from datetime import datetime

from flask import Blueprint, jsonify, request, redirect, url_for

from app.middleware.auth import authenticate_token
from app.middleware.auth import require_role
from app.models.users import User
from app.services.users import get_or_create_user, update_interest
from app.extensions import db
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.models.student_answers import StudentAnswer
from app.models.leveling_test_attempts import LevelingTestAttempt
from app.models.task_answer_options import TaskAnswerOption
from app.models.ebooks import ebooks
from app.middleware.auth import _current_user
from app.utills import _task_theme, _get_solved_task_ids, _get_section_index, _get_current_subsection, _get_recent_sections, _get_section_progress, _current_subsection_json, _timed_options
import random

student_bp = Blueprint("student", __name__)

@student_bp.route("/api/student", methods=["GET"])
@authenticate_token
def student():
    return jsonify({
        "message": "Hello"
    })

@student_bp.route("/api/student/stats")
@authenticate_token
def get_student_stats():
    student = _current_user()
    student_id = student.id

    total_tasks = Task.query.count()

    solved_task_ids = _get_solved_task_ids(student_id)

    solved_tasks = len(solved_task_ids)

    total_attempts = (
        StudentAnswer.query
        .filter_by(student_id=student_id)
        .count()
    )

    correct_attempts = (
        StudentAnswer.query
        .filter_by(
            student_id=student_id,
            is_correct=True,
        )
        .count()
    )

    if total_attempts == 0:
        accuracy = None
    else:
        accuracy = round(
            100 * correct_attempts / total_attempts
        )

    started_sections = (
        db.session.query(Section.id)
        .join(Subsection, Subsection.section_id == Section.id)
        .join(Task, Task.subsection_id == Subsection.id)
        .join(StudentAnswer, StudentAnswer.task_id == Task.id)
        .filter(
            StudentAnswer.student_id == student_id,
            StudentAnswer.is_correct.is_(True),
        )
        .distinct()
        .count()
    )

    current_subsection = _get_current_subsection(
        student_id,
    )

    recent_sections = _get_recent_sections(
        student_id,
        limit=5,
    )

    recent_section_data = []

    for section in recent_sections:
        progress = _get_section_progress(
            student_id,
            section,
        )

        recent_section_data.append(
            {
                "section_id": section.id,
                "section_title": section.title,
                "section_index": _get_section_index(section.id),
                "solved_tasks": progress["solved_tasks"],
                "total_tasks": progress["total_tasks"],
            }
        )

    last_leveling_test = (
    LevelingTestAttempt.query
    .filter_by(student_id=student_id)
    .order_by(LevelingTestAttempt.completed_at.desc())
    .first()
)

    return jsonify(
        {
            "solved_tasks": solved_tasks,
            "total_tasks": total_tasks,
            "accuracy": accuracy,
            "started_sections": started_sections,
            "current": _current_subsection_json(
                student_id,
                current_subsection,
            ),
            "recent_sections": recent_section_data,
            "last_leveling_test": (
                {
                    "completed_at": last_leveling_test.completed_at.isoformat() + "Z",
                    "score": last_leveling_test.score,
                    "total": last_leveling_test.max_score,
                }
                if last_leveling_test is not None
                else None
            ),
        }
    ), 200


@student_bp.route("/api/student/subsections/<int:subsection_id>/timed",methods=["GET"])
@authenticate_token
def get_timed_tasks(subsection_id):
    student = _current_user()

    if student is None:
        return jsonify({
            "error": "User not found"
        }), 404

    subsection = db.session.get(Subsection, subsection_id)

    if subsection is None:
        return jsonify({
            "error": "Subsection not found"
        }), 404

    tasks = (
        Task.query
        .filter_by(
            subsection_id=subsection.id,
            type="single_choice"
        )
        .all()
    )

    random.shuffle(tasks)
    tasks = tasks[:20]

    questions = []

    for task in tasks:
        options = _timed_options(task, student.interest)
        random.shuffle(options)

        questions.append({
            "task_id": task.id,
            "prompt": _task_theme(task, student.interest).get(
                "prompt",
                task.body_text,
            ),
            "options": [
                {
                    "id": option["id"],
                    "text": option["text"]
                }
                for option in options
            ]
        })

    return jsonify({
        "duration_seconds": 60,
        "questions": questions
    }), 200

@student_bp.route("/api/student/subsections/<int:subsection_id>/timed/submit",methods=["POST"])
@authenticate_token
def submit_timed_tasks(subsection_id):
    student = _current_user()

    if student is None:
        return jsonify({
            "error": "User not found"
        }), 404

    subsection = db.session.get(Subsection, subsection_id)

    if subsection is None:
        return jsonify({
            "error": "Subsection not found"
        }), 404

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "Invalid JSON body"
        }), 400

    answers = data.get("answers")
    elapsed_seconds = data.get("elapsed_seconds")

    if not isinstance(answers, list):
        return jsonify({
            "error": "answers must be a list"
        }), 400

    if (
        isinstance(elapsed_seconds, bool)
        or not isinstance(elapsed_seconds, (int, float))
        or elapsed_seconds < 0
    ):
        return jsonify({
            "error": "elapsed_seconds must be a non-negative number"
        }), 400

    tasks = (
        Task.query
        .filter_by(
            subsection_id=subsection.id,
            type="single_choice"
        )
        .all()
    )

    timed_tasks = tasks[:20]
    timed_task_ids = {task.id for task in tasks}
    tasks_by_id = {task.id: task for task in tasks}

    correct = 0
    answered = 0
    answered_task_ids = set()

    for answer_data in answers:
        if not isinstance(answer_data, dict):
            continue

        task_id = answer_data.get("task_id")
        selected_option_id = answer_data.get("selected_option_id")

        if not isinstance(task_id, int):
            continue

        if not isinstance(selected_option_id, int):
            continue

        if task_id not in timed_task_ids:
            continue

        if task_id in answered_task_ids:
            continue

        option = (
            TaskAnswerOption.query
            .filter_by(
                id=selected_option_id,
                task_id=task_id
            )
            .first()
        )

        if option is None:
            continue

        answered_task_ids.add(task_id)
        answered += 1
        timed_options = _timed_options(
            tasks_by_id[task_id],
            student.interest,
        )
        selected = next(
            item for item in timed_options if item["id"] == option.id
        )
        if selected["is_correct"]:
            correct += 1

    return jsonify({
        "correct": correct,
        "answered": answered,
        "total": len(timed_tasks)
    }), 200
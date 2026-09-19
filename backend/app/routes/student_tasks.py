from datetime import datetime

from app.routes import student as student_routes
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
from app.utills import _task_theme, _get_solved_task_ids, _get_section_index, _get_current_subsection, _get_recent_sections, _get_section_progress, _current_subsection_json, _timed_options, determine_student_difficulty_level_, _attempts_used_in_current_cycle, _task_solution
import random
import re

student_tasks_bp = Blueprint("student_tasks", __name__)

@student_tasks_bp.route("/api/student/tasks/<int:task_id>", methods=["GET"])
@authenticate_token
def get_student_task(task_id):
    student = student_routes._current_user()

    if student is None:
        return jsonify({
            "error": "User not found"
        }), 404

    task = db.session.get(Task, task_id)

    if task is None:
        return jsonify({
            "error": "Task not found"
        }), 404

    theme = _task_theme(task, student.interest)
    attempts_used = _attempts_used_in_current_cycle(task.id, student.id)
    response = {
        "id": task.id,
        "type": task.type,
        "difficulty_level": task.difficulty_level,
        "prompt": theme.get("prompt", task.body_text),
    }

    if task.type == "single_choice":
        options = (
            TaskAnswerOption.query
            .filter_by(task_id=task.id)
            .order_by(TaskAnswerOption.order_index)
            .all()
        )
        theme_options = theme.get("options")
        if isinstance(theme_options, list) and len(theme_options) == len(options):
            option_data = [
                {"id": option.id, "text": option_data["text"]}
                for option, option_data in zip(options, theme_options)
            ]
        else:
            option_data = [
                {"id": option.id, "text": option.option_text}
                for option in options
            ]
        random.shuffle(option_data)
        response["options"] = option_data
        response["attempts_used"] = attempts_used
        response["max_attempts"] = 3
        response["solution"] = None
    elif task.type == "short_answer":
        response["attempts_used"] = attempts_used
        response["max_attempts"] = 3
        response["solution"] = None
    elif task.type == "memory":
        pairs = theme.get("pairs", task.memory_pairs or [])
        response["pairs"] = [
            {"id": index, "a": pair["a"], "b": pair["b"]}
            for index, pair in enumerate(pairs, start=1)
        ]
    else:
        return jsonify({"error": "Unsupported task type"}), 400

    return jsonify(response), 200

@student_tasks_bp.route("/api/student/tasks/<int:task_id>/answers",methods=["POST"])
@authenticate_token
def submit_student_answer(task_id):
    student = student_routes._current_user()

    if student is None:
        return jsonify({
            "error": "User not found"
        }), 404

    task = db.session.get(Task, task_id)

    if task is None:
        return jsonify({
            "error": "Task not found"
        }), 404

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "Invalid JSON body"
        }), 400

    # difficulty level of exercise
    getStudentLevel = determine_student_difficulty_level_(student.id, task.subsection_id)

    # ---------------------------------------------------------
    # MEMORY
    # ---------------------------------------------------------

    if task.type == "memory":
        if data.get("completed") is not True:
            return jsonify({
                "error": "completed must be true"
            }), 400

        answer = StudentAnswer(
            task_id=task.id,
            student_id=student.id,
            is_correct=True,
            attempt_number=1,
            submitted_at=datetime.utcnow(),
        )

        db.session.add(answer)
        db.session.commit()

        return jsonify({
            "is_correct": True,
            "attempt_number": 1,
            "attempts_left": None,
            "solution": None,
        }), 200

    if task.type not in ("single_choice", "short_answer"):
        return jsonify({
            "error": "Unsupported task type"
        }), 400

    attempts_used = _attempts_used_in_current_cycle(task.id, student.id)
    attempt_number = attempts_used + 1

    # ---------------------------------------------------------
    # SINGLE CHOICE
    # ---------------------------------------------------------

    if task.type == "single_choice":
        selected_option_id = data.get("selected_option_id")

        if not isinstance(selected_option_id, int):
            return jsonify({
                "error": "selected_option_id is required"
            }), 400

        option = (
            TaskAnswerOption.query
            .filter_by(
                id=selected_option_id,
                task_id=task.id
            )
            .first()
        )

        if option is None:
            return jsonify({
                "error": "Invalid option"
            }), 400

        theme_options = _task_theme(task, student.interest).get("options")
        option_index = option.order_index - 1
        if isinstance(theme_options, list) and option_index < len(theme_options):
            is_correct = theme_options[option_index].get("correct") is True
        else:
            is_correct = option.is_correct

        answer = StudentAnswer(
            task_id=task.id,
            student_id=student.id,
            selected_option_id=selected_option_id,
            is_correct=is_correct,
            attempt_number=attempt_number,
            submitted_at=datetime.utcnow(),
        )

    # ---------------------------------------------------------
    # SHORT ANSWER
    # ---------------------------------------------------------

    else:
        answer_text = data.get("answer_text")

        if not isinstance(answer_text, str):
            return jsonify({
                "error": "answer_text is required"
            }), 400

        def normalize_answer(value):
            value = value.strip()
            value = re.sub(r"\s+", " ", value)
            value = value.lower()
            value = value.replace(",", ".")
            return value

        normalized_answer = normalize_answer(answer_text)

        accepted_answers = _task_theme(task, student.interest).get(
            "answers",
            task.accepted_answers or [],
        )

        is_correct = any(
            normalized_answer == normalize_answer(accepted)
            for accepted in accepted_answers
        )

        answer = StudentAnswer(
            task_id=task.id,
            student_id=student.id,
            answer_text=answer_text,
            is_correct=is_correct,
            attempt_number=attempt_number,
            submitted_at=datetime.utcnow(),
        )

    # ---------------------------------------------------------
    # SAVE
    # ---------------------------------------------------------

    db.session.add(answer)
    db.session.commit()

    attempts_left = 3 - attempt_number

    solution = None
    if not is_correct and attempts_left == 0:

        if task.type == "single_choice":
            solution = _task_solution(task, student.interest)

        elif task.type == "short_answer":
            solution = _task_solution(task, student.interest)

    newDifficultyLevel = determine_student_difficulty_level_(student.id, task.subsection_id)

    if newDifficultyLevel != getStudentLevel:
        return jsonify({
            "is_correct": is_correct,
            "attempt_number": attempt_number,
            "attempts_left": attempts_left,
            "solution": solution,
            "unlocked_difficulty": newDifficultyLevel
        }), 200

    return jsonify({
        "is_correct": is_correct,
        "attempt_number": attempt_number,
        "attempts_left": attempts_left,
        "solution": solution,
        "unlocked_difficulty": None
    }), 200

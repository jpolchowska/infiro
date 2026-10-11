import random

from flask import Blueprint, jsonify, request

from app.auth import authenticate_token, current_user
from app.clock import utc_now
from app.constants import TaskType
from app.extensions import db
from app.models.student_answers import StudentAnswer
from app.models.task_answer_options import TaskAnswerOption
from app.models.tasks import Task
from app.services.answers import (
    MAX_ATTEMPTS,
    attempts_used_in_current_cycle,
    is_accepted_answer,
    task_solution,
)
from app.services.progress import determine_student_difficulty_level
from app.services.themes import resolve_theme, task_options

student_tasks_bp = Blueprint("student_tasks", __name__)


@student_tasks_bp.route("/api/student/tasks/<int:task_id>", methods=["GET"])
@authenticate_token
def get_student_task(task_id):
    student = current_user()

    if student is None:
        return jsonify({
            "error": "User not found"
        }), 404

    task = db.session.get(Task, task_id)

    if task is None:
        return jsonify({
            "error": "Task not found"
        }), 404

    theme = resolve_theme(task, student.interest)
    attempts_used = attempts_used_in_current_cycle(task.id, student.id)
    response = {
        "id": task.id,
        "type": task.type,
        "difficulty_level": task.difficulty_level,
        "prompt": theme.get("prompt", task.body_text),
    }

    if task.type == TaskType.SINGLE_CHOICE:
        options = [
            {"id": option["id"], "text": option["text"]}
            for option in task_options(task, student.interest)
        ]
        random.shuffle(options)
        response["options"] = options
        response["attempts_used"] = attempts_used
        response["max_attempts"] = MAX_ATTEMPTS
        response["solution"] = None
    elif task.type == TaskType.SHORT_ANSWER:
        response["attempts_used"] = attempts_used
        response["max_attempts"] = MAX_ATTEMPTS
        response["solution"] = None
    elif task.type == TaskType.MEMORY:
        pairs = theme.get("pairs", task.memory_pairs or [])
        response["pairs"] = [
            {"id": index, "a": pair["a"], "b": pair["b"]}
            for index, pair in enumerate(pairs, start=1)
        ]
    else:
        return jsonify({"error": "Unsupported task type"}), 400

    return jsonify(response), 200


@student_tasks_bp.route("/api/student/tasks/<int:task_id>/answers", methods=["POST"])
@authenticate_token
def submit_student_answer(task_id):
    student = current_user()

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

    previous_difficulty_level = determine_student_difficulty_level(student.id, task.subsection_id)

    if task.type == TaskType.MEMORY:
        if data.get("completed") is not True:
            return jsonify({
                "error": "completed must be true"
            }), 400

        answer = StudentAnswer(
            task_id=task.id,
            student_id=student.id,
            is_correct=True,
            attempt_number=1,
            submitted_at=utc_now(),
        )

        db.session.add(answer)
        db.session.commit()

        return jsonify({
            "is_correct": True,
            "attempt_number": 1,
            "attempts_left": None,
            "solution": None,
        }), 200

    if task.type not in (TaskType.SINGLE_CHOICE, TaskType.SHORT_ANSWER):
        return jsonify({
            "error": "Unsupported task type"
        }), 400

    attempts_used = attempts_used_in_current_cycle(task.id, student.id)
    attempt_number = attempts_used + 1

    if task.type == TaskType.SINGLE_CHOICE:
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

        theme_options = resolve_theme(task, student.interest).get("options")
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
            submitted_at=utc_now(),
        )

    else:
        answer_text = data.get("answer_text")

        if not isinstance(answer_text, str):
            return jsonify({
                "error": "answer_text is required"
            }), 400

        accepted_answers = resolve_theme(task, student.interest).get(
            "answers",
            task.accepted_answers or [],
        )
        is_correct = is_accepted_answer(answer_text, accepted_answers)

        answer = StudentAnswer(
            task_id=task.id,
            student_id=student.id,
            answer_text=answer_text,
            is_correct=is_correct,
            attempt_number=attempt_number,
            submitted_at=utc_now(),
        )

    db.session.add(answer)
    db.session.commit()

    attempts_left = MAX_ATTEMPTS - attempt_number

    solution = None
    if not is_correct and attempts_left == 0:
        solution = task_solution(task, student.interest)

    new_difficulty_level = determine_student_difficulty_level(student.id, task.subsection_id)
    level_changed = new_difficulty_level != previous_difficulty_level

    return jsonify({
        "is_correct": is_correct,
        "attempt_number": attempt_number,
        "attempts_left": attempts_left,
        "solution": solution,
        "unlocked_difficulty": new_difficulty_level if level_changed else None,
    }), 200

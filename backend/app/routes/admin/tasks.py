from flask import Blueprint, jsonify

from app.auth import authenticate_token, require_realm_role
from app.constants import RealmRole
from app.extensions import db
from app.models.leveling_test_answers import LevelingTestAnswer
from app.models.student_answers import StudentAnswer
from app.models.subsections import Subsection
from app.models.task_answer_options import TaskAnswerOption
from app.models.tasks import Task
from app.payload import json_object
from app.serializers import task_json
from app.services import content_deletion

bp = Blueprint("admin_tasks", __name__, url_prefix="/api/admin")


def _validate_options(options):
    if not isinstance(options, list) or len(options) < 2:
        return "options must be a list with at least 2 items"

    correct_count = 0
    for opt in options:
        if not isinstance(opt, dict) or not isinstance(opt.get("text"), str) or not opt["text"].strip():
            return "Each option needs a non-empty 'text'"
        if not isinstance(opt.get("correct"), bool):
            return "Each option needs a boolean 'correct'"
        if opt["correct"]:
            correct_count += 1

    if correct_count != 1:
        return "Exactly one option must be correct"
    return None


@bp.route("/subsections/<int:subsection_id>/tasks", methods=["POST"])
@authenticate_token
@require_realm_role(RealmRole.ADMIN)
def create_task(subsection_id):
    subsection = db.session.get(Subsection, subsection_id)
    if subsection is None:
        return jsonify({"error": "Subsection not found"}), 404

    data = json_object()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    title = (data.get("title") or "").strip()
    body_text = (data.get("body_text") or "").strip()
    difficulty_level = data.get("difficulty_level")
    options = data.get("options")

    if not title:
        return jsonify({"error": "title is required"}), 400
    if not body_text:
        return jsonify({"error": "body_text is required"}), 400
    if not isinstance(difficulty_level, int) or not (1 <= difficulty_level <= 3):
        return jsonify({"error": "difficulty_level must be an integer 1-3"}), 400

    options_error = _validate_options(options)
    if options_error:
        return jsonify({"error": options_error}), 400

    task = Task(
        subsection_id=subsection_id,
        title=title,
        body_text=body_text,
        difficulty_level=difficulty_level,
    )
    db.session.add(task)
    db.session.flush()

    for order_index, opt in enumerate(options, start=1):
        db.session.add(TaskAnswerOption(
            task_id=task.id,
            option_text=opt["text"].strip(),
            is_correct=opt["correct"],
            order_index=order_index,
        ))

    db.session.commit()

    return jsonify(task_json(task)), 201


@bp.route("/tasks/<int:task_id>", methods=["PATCH"])
@authenticate_token
@require_realm_role(RealmRole.ADMIN)
def update_task(task_id):
    task = db.session.get(Task, task_id)
    if task is None:
        return jsonify({"error": "Task not found"}), 404

    data = json_object()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    if "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            return jsonify({"error": "title cannot be empty"}), 400
        task.title = title
    if "body_text" in data:
        body_text = (data.get("body_text") or "").strip()
        if not body_text:
            return jsonify({"error": "body_text cannot be empty"}), 400
        task.body_text = body_text
    if "difficulty_level" in data:
        difficulty_level = data.get("difficulty_level")
        if not isinstance(difficulty_level, int) or not (1 <= difficulty_level <= 3):
            return jsonify({"error": "difficulty_level must be an integer 1-3"}), 400
        task.difficulty_level = difficulty_level
    if "options" in data:
        options = data.get("options")
        options_error = _validate_options(options)
        if options_error:
            return jsonify({"error": options_error}), 400

        StudentAnswer.query.filter_by(task_id=task.id).delete(synchronize_session=False)
        LevelingTestAnswer.query.filter_by(task_id=task.id).delete(synchronize_session=False)
        TaskAnswerOption.query.filter_by(task_id=task.id).delete(synchronize_session=False)
        for order_index, opt in enumerate(options, start=1):
            db.session.add(TaskAnswerOption(
                task_id=task.id,
                option_text=opt["text"].strip(),
                is_correct=opt["correct"],
                order_index=order_index,
            ))

    db.session.commit()
    return jsonify(task_json(task)), 200


@bp.route("/tasks/<int:task_id>", methods=["DELETE"])
@authenticate_token
@require_realm_role(RealmRole.ADMIN)
def delete_task(task_id):
    task = db.session.get(Task, task_id)
    if task is None:
        return jsonify({"error": "Task not found"}), 404

    content_deletion.delete_task(task)
    db.session.commit()

    return "", 204

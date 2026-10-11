from flask import Blueprint, jsonify, request
from datetime import datetime

from app.models.tasks import Task
from app.models.task_answer_options import TaskAnswerOption
from app.models.subsections import Subsection
from app.middleware.auth import authenticate_token

tasks_bp = Blueprint("tasks", __name__)


@tasks_bp.route("/api/tasks/<int:task_id>", methods=["GET"])
@authenticate_token
def get_task(task_id):
    task = Task.query.get(task_id)

    if task is None:
        return jsonify({
            "error": "task not found"
        }), 404

    options = TaskAnswerOption.query.filter_by(
        task_id=task.id
    ).order_by(
        TaskAnswerOption.order_index
    ).all()

    return jsonify({
        "id": task.id,
        "subsection_id": task.subsection_id,
        "title": task.title,
        "body_text": task.body_text,
        "image_url": task.image_url,
        "difficulty_level": task.difficulty_level,
        "options": [
            {
                "id": option.id,
                "option_text": option.option_text,
                "order_index": option.order_index
            }
            for option in options
        ]
    }), 200

@tasks_bp.route("/api/tasks", methods=["GET"])
@authenticate_token
def get_tasks():
    subsection_id = request.args.get("subsection_id", type=int)

    if subsection_id is None:
        return jsonify({
            "error": "subsection_id is required"
        }), 400

    subsection = Subsection.query.get(subsection_id)

    if subsection is None:
        return jsonify({
            "error": "subsection not found"
        }), 404

    tasks = Task.query.filter_by(
        subsection_id=subsection_id
    ).order_by(Task.order_index, Task.id).all()

    return jsonify([
        {
            "id": task.id,
            "subsection_id": task.subsection_id,
            "title": task.title,
            "body_text": task.body_text,
            "image_url": task.image_url,
            "difficulty_level": task.difficulty_level
        }
        for task in tasks
    ]), 200

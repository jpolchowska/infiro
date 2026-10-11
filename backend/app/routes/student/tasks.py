from flask import Blueprint, jsonify, request

from app.auth import authenticate_token, current_user
from app.extensions import db
from app.models.tasks import Task
from app.services.student_tasks import submit_task_answer, task_view

bp = Blueprint("student_tasks", __name__, url_prefix="/api/student")


@bp.route("/tasks/<int:task_id>", methods=["GET"])
@authenticate_token
def get_student_task(task_id):
    student = current_user()
    if student is None:
        return jsonify({"error": "User not found"}), 404

    task = db.session.get(Task, task_id)
    if task is None:
        return jsonify({"error": "Task not found"}), 404

    view, error = task_view(task, student)
    if error:
        return jsonify({"error": error}), 400

    return jsonify(view), 200


@bp.route("/tasks/<int:task_id>/answers", methods=["POST"])
@authenticate_token
def submit_student_answer(task_id):
    student = current_user()
    if student is None:
        return jsonify({"error": "User not found"}), 404

    task = db.session.get(Task, task_id)
    if task is None:
        return jsonify({"error": "Task not found"}), 404

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON body"}), 400

    result, error = submit_task_answer(task, student, data)
    if error:
        return jsonify({"error": error}), 400

    return jsonify(result), 200

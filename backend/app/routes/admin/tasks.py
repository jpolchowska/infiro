from flask import Blueprint, jsonify

from app.auth import authenticate_token, require_any_realm_role, require_realm_role
from app.constants import RealmRole
from app.extensions import db
from app.models.tasks import Task
from app.payload import json_object
from app.services import content_deletion
from app.services.content_preview import task_detail

bp = Blueprint("admin_tasks", __name__, url_prefix="/api/admin")


@bp.route("/tasks/<int:task_id>", methods=["GET"])
@authenticate_token
@require_any_realm_role(RealmRole.ADMIN, RealmRole.TEACHER)
def get_task(task_id):
    task = db.session.get(Task, task_id)
    if task is None:
        return jsonify({"error": "Task not found"}), 404

    return jsonify(task_detail(task)), 200


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


def _task_ids(data):
    task_ids = data.get("task_ids")
    if not isinstance(task_ids, list) or not task_ids:
        return None
    if not all(isinstance(task_id, int) and not isinstance(task_id, bool) for task_id in task_ids):
        return None
    return set(task_ids)


@bp.route("/tasks/delete", methods=["POST"])
@authenticate_token
@require_realm_role(RealmRole.ADMIN)
def delete_tasks():
    data = json_object()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    task_ids = _task_ids(data)
    if task_ids is None:
        return jsonify({"error": "task_ids must be a non-empty list of integers"}), 400

    found_ids = {task_id for (task_id,) in db.session.query(Task.id).filter(Task.id.in_(task_ids))}
    if found_ids != task_ids:
        return jsonify({"error": "Task not found", "missing_task_ids": sorted(task_ids - found_ids)}), 404

    content_deletion.delete_tasks(task_ids)
    db.session.commit()

    return "", 204

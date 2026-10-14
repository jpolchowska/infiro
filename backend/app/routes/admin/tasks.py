from flask import Blueprint, jsonify

from app.auth import authenticate_token, require_any_realm_role, require_realm_role
from app.constants import RealmRole
from app.extensions import db
from app.models.tasks import Task
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

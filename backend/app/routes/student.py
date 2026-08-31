from flask import Blueprint, jsonify, request, redirect, url_for

from app.middleware.auth import authenticate_token
from app.middleware.auth import require_role
from app.models.users import User
from app.services.users import get_or_create_user, update_interest


student_bp = Blueprint("student", __name__)


@student_bp.route("/api/student", methods=["GET"])
@authenticate_token
@require_role("Uczeń")
def student():
    return jsonify({
        "message": "Hello"
    })


def _current_user():
    """Znajduje User po claimie 'sub' z JWT. Zwraca None, jeśli nie ma
    jeszcze lokalnego wiersza -- używane tam, gdzie brak wiersza ma być
    błędem (np. leveling-test wymaga wcześniejszego wywołania /me),
    w odróżnieniu od get_or_create_user(), który go zakłada.
    """
    sub = request.user.get("sub")
    return User.query.filter_by(keycloak_sub=sub).first()


@student_bp.route("/api/student/me", methods=["GET"])
@authenticate_token
def me():
    user = get_or_create_user("student")

    return jsonify({
        "id": user.id,
        "role": user.role,
        "leveling_test_completed": user.leveling_test_completed_at is not None,
        "interest": user.interest
    }), 200

@student_bp.route("/api/student/interest", methods=["PATCH"])
@authenticate_token
def add_interest():
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    update_interest()

    return "", 204

def _get_section_index(section_id):
    ...

def _get_solved_task_ids(student_id):
    ...

def _get_section_progress(student_id, section):
    ...
def _get_subsection_progress(student_id, subsection):
    ...

@student_bp.route("/api/student/sections")
@authenticate_token
def get_student_sections():
    ...


@student_bp.route("/api/student/subsections/<int:subsection_id>/tasks")
def get_student_subsection_tasks(subsection_id):
    ...

@student_bp.route("/api/student/stats")
def get_student_stats():
    ...
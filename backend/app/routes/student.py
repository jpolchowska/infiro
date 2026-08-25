from flask import Blueprint, jsonify, request

from app.middleware.auth import authenticate_token
from app.middleware.auth import require_role
from app.models.users import User
from app.services.users import get_or_create_user


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
@require_role("Uczeń")
def me():
    user = get_or_create_user("student")

    return jsonify({
        "id": user.id,
        "role": user.role,
        "leveling_test_completed": user.leveling_test_completed_at is not None,
    }), 200
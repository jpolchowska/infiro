from flask import Blueprint, jsonify, request

from app.extensions import db
from app.middleware.auth import authenticate_token
from app.middleware.auth import require_role
from app.models.users import User


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
    jeszcze lokalnego wiersza -- wywołujący ma zdecydować co z tym zrobić.
    """
    sub = request.user.get("sub")
    return User.query.filter_by(keycloak_sub=sub).first()


@student_bp.route("/api/student/me", methods=["GET"])
@authenticate_token
@require_role("Uczeń")
def me():
    user = _current_user()

    if user is None:
        user = User(keycloak_sub=request.user.get("sub"), role="student")
        db.session.add(user)
        db.session.commit()

    return jsonify({
        "id": user.id,
        "role": user.role,
        "leveling_test_completed": user.leveling_test_completed_at is not None,
    }), 200
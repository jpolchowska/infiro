from flask import Blueprint, jsonify, request

from app.auth import authenticate_token, require_student
from app.constants import UserRole
from app.payload import json_object
from app.services.users import get_or_create_user, update_interest

bp = Blueprint("student_profile", __name__, url_prefix="/api/student")


@bp.route("/me", methods=["GET"])
@authenticate_token
def me():
    user = get_or_create_user(request.user, UserRole.STUDENT)

    return jsonify({
        "id": user.id,
        "role": user.role,
        "leveling_test_completed": user.leveling_test_completed_at is not None,
        "interest": user.interest
    }), 200


@bp.route("/interest", methods=["PATCH"])
@require_student
def add_interest(student):
    interest = (json_object() or {}).get("interest")
    try:
        update_interest(student, interest)
    except ValueError:
        return jsonify({"error": "Invalid interest"}), 400

    return "", 204

from flask import Blueprint, jsonify

from app.middleware.auth import authenticate_token, current_user
from app.services.users import get_or_create_user, update_interest

student_profile_bp = Blueprint("student_profile", __name__)


@student_profile_bp.route("/api/student/me", methods=["GET"])
@authenticate_token
def me():
    user = get_or_create_user("student")

    return jsonify({
        "id": user.id,
        "role": user.role,
        "leveling_test_completed": user.leveling_test_completed_at is not None,
        "interest": user.interest
    }), 200


@student_profile_bp.route("/api/student/interest", methods=["PATCH"])
@authenticate_token
def add_interest():
    user = current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    try:
        update_interest()
    except ValueError:
        return jsonify({"error": "Invalid interest"}), 400

    return "", 204

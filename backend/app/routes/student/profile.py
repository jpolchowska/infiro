from flask import Blueprint, jsonify, request

from app.auth import authenticate_token, require_student
from app.constants import LevelingTestStatus, RealmRole, UserRole
from app.payload import json_object
from app.services.leveling_test_settings import leveling_test_state
from app.services.users import get_or_create_user, update_interest

bp = Blueprint("student_profile", __name__, url_prefix="/api/student")

STAFF_ROLES = {RealmRole.ADMIN, RealmRole.TEACHER}


@bp.route("/me", methods=["GET"])
@authenticate_token
def me():
    realm_roles = set(request.user.get("realm_access", {}).get("roles", []))
    if realm_roles & STAFF_ROLES:
        return jsonify({"error": "Staff accounts cannot use the student app"}), 403

    user = get_or_create_user(request.user, UserRole.STUDENT)
    leveling_test = leveling_test_state(user)

    return jsonify({
        "id": user.id,
        "username": user.username,
        "role": user.role,
        "leveling_test_completed": leveling_test["status"] in (
            LevelingTestStatus.UP_TO_DATE,
            LevelingTestStatus.DUE,
        ),
        "leveling_test": leveling_test,
        "interest": user.interest,
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

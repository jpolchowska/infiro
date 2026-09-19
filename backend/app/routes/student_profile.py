from datetime import datetime

from flask import Blueprint, jsonify, request, redirect, url_for

from app.middleware.auth import authenticate_token
from app.middleware.auth import require_role
from app.middleware.auth import _current_user
from app.models.users import User
from app.services.users import get_or_create_user, update_interest
from app.extensions import db
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.models.student_answers import StudentAnswer
from app.models.leveling_test_attempts import LevelingTestAttempt
from app.models.task_answer_options import TaskAnswerOption
from app.models.ebooks import ebooks

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
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    try:
        update_interest()
    except ValueError:
        return jsonify({"error": "Invalid interest"}), 400

    return "", 204

from flask import Blueprint, jsonify

from app.auth import authenticate_token, current_user
from app.services.student_stats import build_student_stats

bp = Blueprint("student_stats", __name__, url_prefix="/api/student")


@bp.route("/stats")
@authenticate_token
def get_stats():
    student = current_user()
    if student is None:
        return jsonify({"error": "User not found"}), 404

    return jsonify(build_student_stats(student.id)), 200

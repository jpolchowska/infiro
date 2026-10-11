from flask import Blueprint, jsonify, request

from app.auth import authenticate_token, current_user
from app.extensions import db
from app.models.subsections import Subsection
from app.services.student_stats import build_student_stats
from app.services.timed_practice import build_timed_practice, score_timed_practice

student_bp = Blueprint("student", __name__)


@student_bp.route("/api/student/stats")
@authenticate_token
def get_student_stats():
    student = current_user()
    if student is None:
        return jsonify({"error": "User not found"}), 404

    return jsonify(build_student_stats(student.id)), 200


def _is_valid_duration(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and value >= 0


@student_bp.route("/api/student/subsections/<int:subsection_id>/timed", methods=["GET"])
@authenticate_token
def get_timed_practice(subsection_id):
    student = current_user()
    if student is None:
        return jsonify({"error": "User not found"}), 404

    subsection = db.session.get(Subsection, subsection_id)
    if subsection is None:
        return jsonify({"error": "Subsection not found"}), 404

    return jsonify(build_timed_practice(subsection, student.interest)), 200


@student_bp.route("/api/student/subsections/<int:subsection_id>/timed/submit", methods=["POST"])
@authenticate_token
def submit_timed_practice(subsection_id):
    student = current_user()
    if student is None:
        return jsonify({"error": "User not found"}), 404

    subsection = db.session.get(Subsection, subsection_id)
    if subsection is None:
        return jsonify({"error": "Subsection not found"}), 404

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON body"}), 400

    answers = data.get("answers")
    if not isinstance(answers, list):
        return jsonify({"error": "answers must be a list"}), 400

    if not _is_valid_duration(data.get("elapsed_seconds")):
        return jsonify({"error": "elapsed_seconds must be a non-negative number"}), 400

    return jsonify(score_timed_practice(subsection, student.interest, answers)), 200

from flask import Blueprint, jsonify

from app.auth import require_student
from app.extensions import db
from app.models.subsections import Subsection
from app.payload import json_object
from app.services.timed_practice import build_timed_practice, score_timed_practice

bp = Blueprint("student_timed_practice", __name__, url_prefix="/api/student")


def _is_valid_duration(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and value >= 0


@bp.route("/subsections/<int:subsection_id>/timed", methods=["GET"])
@require_student
def get_timed_practice(student, subsection_id):
    subsection = db.session.get(Subsection, subsection_id)
    if subsection is None:
        return jsonify({"error": "Subsection not found"}), 404

    return jsonify(build_timed_practice(subsection, student.interest)), 200


@bp.route("/subsections/<int:subsection_id>/timed/submit", methods=["POST"])
@require_student
def submit_timed_practice(student, subsection_id):
    subsection = db.session.get(Subsection, subsection_id)
    if subsection is None:
        return jsonify({"error": "Subsection not found"}), 404

    data = json_object()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    answers = data.get("answers")
    if not isinstance(answers, list):
        return jsonify({"error": "answers must be a list"}), 400

    if not _is_valid_duration(data.get("elapsed_seconds")):
        return jsonify({"error": "elapsed_seconds must be a non-negative number"}), 400

    return jsonify(score_timed_practice(subsection, student.interest, answers)), 200

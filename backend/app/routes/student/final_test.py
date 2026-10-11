from flask import Blueprint, jsonify

from app.auth import require_student
from app.extensions import db
from app.models.sections import Section
from app.payload import json_object
from app.services.final_test import build_final_test, final_test_history, submit_final_test

bp = Blueprint("student_final_test", __name__, url_prefix="/api/student")


@bp.route("/sections/<int:section_id>/final-test", methods=["GET"])
@require_student
def get_final_test(student, section_id):
    section = db.session.get(Section, section_id)
    if section is None:
        return jsonify({"error": "section not found"}), 404

    return jsonify(build_final_test(section, student.interest)), 200


@bp.route("/sections/<int:section_id>/final-test/submit", methods=["POST"])
@require_student
def submit_final_test_answers(student, section_id):
    section = db.session.get(Section, section_id)
    if section is None:
        return jsonify({"error": "section not found"}), 404

    data = json_object()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    answers = data.get("answers")
    if not isinstance(answers, list) or len(answers) == 0:
        return jsonify({"error": "answers must be a non-empty list"}), 400

    result, error = submit_final_test(student, section, answers)
    if error:
        return jsonify({"error": error}), 400

    return jsonify(result), 201


@bp.route("/sections/<int:section_id>/final-test/history", methods=["GET"])
@require_student
def get_final_test_history(student, section_id):
    return jsonify(final_test_history(student, section_id)), 200

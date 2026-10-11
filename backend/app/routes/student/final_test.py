from flask import Blueprint, jsonify

from app.auth import authenticate_token, current_user
from app.extensions import db
from app.models.sections import Section
from app.payload import json_object
from app.services.final_test import build_final_test, final_test_history, submit_final_test

bp = Blueprint("student_final_test", __name__, url_prefix="/api/student")

USER_NOT_FOUND = "user not found, call /api/student/me first"


@bp.route("/sections/<int:section_id>/final-test", methods=["GET"])
@authenticate_token
def get_final_test(section_id):
    student = current_user()
    if student is None:
        return jsonify({"error": USER_NOT_FOUND}), 404

    section = db.session.get(Section, section_id)
    if section is None:
        return jsonify({"error": "section not found"}), 404

    return jsonify(build_final_test(section, student.interest)), 200


@bp.route("/sections/<int:section_id>/final-test/submit", methods=["POST"])
@authenticate_token
def submit_final_test_answers(section_id):
    student = current_user()
    if student is None:
        return jsonify({"error": USER_NOT_FOUND}), 404

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
@authenticate_token
def get_final_test_history(section_id):
    student = current_user()
    if student is None:
        return jsonify({"error": USER_NOT_FOUND}), 404

    return jsonify(final_test_history(student, section_id)), 200

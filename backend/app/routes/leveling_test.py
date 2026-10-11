from flask import Blueprint, jsonify, request

from app.auth import authenticate_token, current_user
from app.services.leveling_test import build_leveling_test, leveling_test_history, submit_leveling_test

leveling_test_bp = Blueprint("leveling_test", __name__)

USER_NOT_FOUND = "user not found, call /api/student/me first"


@leveling_test_bp.route("/api/student/leveling-test", methods=["GET"])
@authenticate_token
def get_leveling_test():
    student = current_user()
    if student is None:
        return jsonify({"error": USER_NOT_FOUND}), 404

    return jsonify(build_leveling_test(student.interest)), 200


@leveling_test_bp.route("/api/student/leveling-test/submit", methods=["POST"])
@authenticate_token
def submit_leveling_test_answers():
    student = current_user()
    if student is None:
        return jsonify({"error": USER_NOT_FOUND}), 404

    data = request.get_json()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    answers = data.get("answers")
    if not isinstance(answers, list) or len(answers) == 0:
        return jsonify({"error": "answers must be a non-empty list"}), 400

    result, error = submit_leveling_test(student, answers)
    if error:
        return jsonify({"error": error}), 400

    return jsonify(result), 201


@leveling_test_bp.route("/api/student/leveling-test/history", methods=["GET"])
@authenticate_token
def get_leveling_test_history():
    student = current_user()
    if student is None:
        return jsonify({"error": USER_NOT_FOUND}), 404

    return jsonify(leveling_test_history(student)), 200

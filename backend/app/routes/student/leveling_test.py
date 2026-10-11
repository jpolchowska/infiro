from flask import Blueprint, jsonify

from app.auth import require_student
from app.payload import json_object
from app.services.leveling_test import build_leveling_test, leveling_test_history, submit_leveling_test

bp = Blueprint("student_leveling_test", __name__, url_prefix="/api/student")


@bp.route("/leveling-test", methods=["GET"])
@require_student
def get_leveling_test(student):
    return jsonify(build_leveling_test(student.interest)), 200


@bp.route("/leveling-test/submit", methods=["POST"])
@require_student
def submit_leveling_test_answers(student):
    data = json_object()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    answers = data.get("answers")
    if not isinstance(answers, list) or len(answers) == 0:
        return jsonify({"error": "answers must be a non-empty list"}), 400

    result, error = submit_leveling_test(student, answers)
    if error:
        return jsonify({"error": error}), 400

    return jsonify(result), 201


@bp.route("/leveling-test/history", methods=["GET"])
@require_student
def get_leveling_test_history(student):
    return jsonify(leveling_test_history(student)), 200

from flask import Blueprint, jsonify

from app.auth import require_student
from app.services.student_stats import build_student_stats

bp = Blueprint("student_stats", __name__, url_prefix="/api/student")


@bp.route("/stats", methods=["GET"])
@require_student
def get_stats(student):
    return jsonify(build_student_stats(student.id)), 200

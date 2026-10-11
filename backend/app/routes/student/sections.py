from flask import Blueprint, jsonify

from app.auth import require_student
from app.extensions import db
from app.models.subsections import Subsection
from app.services.student_content import list_sections, subsection_overview

bp = Blueprint("student_sections", __name__, url_prefix="/api/student")


@bp.route("/sections", methods=["GET"])
@require_student
def get_sections(student):
    return jsonify(list_sections(student.id)), 200


@bp.route("/subsections/<int:subsection_id>/tasks", methods=["GET"])
@require_student
def get_subsection_tasks(student, subsection_id):
    subsection = db.session.get(Subsection, subsection_id)
    if subsection is None:
        return jsonify({"error": "Subsection not found"}), 404

    return jsonify(subsection_overview(student.id, subsection)), 200

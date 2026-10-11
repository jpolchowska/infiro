from flask import Blueprint, jsonify

from app.auth import authenticate_token, current_user
from app.extensions import db
from app.models.subsections import Subsection
from app.services.student_content import list_sections, subsection_overview

bp = Blueprint("student_sections", __name__, url_prefix="/api/student")


@bp.route("/sections")
@authenticate_token
def get_sections():
    student = current_user()
    if student is None:
        return jsonify({"error": "User not found"}), 404

    return jsonify(list_sections(student.id)), 200


@bp.route("/subsections/<int:subsection_id>/tasks")
@authenticate_token
def get_subsection_tasks(subsection_id):
    student = current_user()
    if student is None:
        return jsonify({"error": "User not found"}), 404

    subsection = db.session.get(Subsection, subsection_id)
    if subsection is None:
        return jsonify({"message": "Subsection not found"}), 404

    return jsonify(subsection_overview(student.id, subsection)), 200

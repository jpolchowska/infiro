from flask import Blueprint, jsonify

from app.auth import authenticate_token, current_user
from app.extensions import db
from app.models.ebooks import Ebook
from app.models.subsections import Subsection
from app.services.student_content import list_sections, subsection_overview

student_sections_and_subsections_bp = Blueprint("student_sections_and_subsections", __name__)


@student_sections_and_subsections_bp.route("/api/student/sections")
@authenticate_token
def get_student_sections():
    student = current_user()
    if student is None:
        return jsonify({"error": "User not found"}), 404

    return jsonify(list_sections(student.id)), 200


@student_sections_and_subsections_bp.route("/api/student/subsections/<int:subsection_id>/tasks")
@authenticate_token
def get_student_subsection_tasks(subsection_id):
    student = current_user()
    if student is None:
        return jsonify({"error": "User not found"}), 404

    subsection = db.session.get(Subsection, subsection_id)
    if subsection is None:
        return jsonify({"message": "Subsection not found"}), 404

    return jsonify(subsection_overview(student.id, subsection)), 200


@student_sections_and_subsections_bp.route("/api/student/subsections/<int:subsection_id>/ebook", methods=["GET"])
@authenticate_token
def get_student_ebook(subsection_id):
    ebook = Ebook.query.filter_by(subsection_id=subsection_id).first()
    if ebook is None:
        return jsonify({"error": "Ebook not found"}), 404

    return jsonify({
        "title": ebook.title,
        "intro": ebook.intro,
        "blocks": ebook.content,
    }), 200

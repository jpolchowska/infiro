from flask import Blueprint, jsonify, request

from app.extensions import db
from app.middleware.auth import authenticate_token, require_any_realm_role, require_realm_role
from app.models.ebooks import Ebook
from app.models.knowledge_resources import KnowledgeResource
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.services import content_deletion
from app.services.admin_serializers import material_json, subsection_json, task_json

admin_subsections_bp = Blueprint("admin_subsections", __name__)


@admin_subsections_bp.route("/api/admin/sections/<int:section_id>/subsections", methods=["POST"])
@authenticate_token
@require_realm_role("admin")
def create_subsection(section_id):
    section = Section.query.get(section_id)
    if section is None:
        return jsonify({"error": "section not found"}), 404

    data = request.get_json()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip() or None

    if not title:
        return jsonify({"error": "title is required"}), 400

    max_order = db.session.query(db.func.max(Subsection.order_index)).filter(
        Subsection.section_id == section_id
    ).scalar() or 0

    subsection = Subsection(
        section_id=section_id,
        title=title,
        description=description,
        order_index=max_order + 1,
    )
    db.session.add(subsection)
    db.session.commit()

    return jsonify(subsection_json(subsection)), 201


@admin_subsections_bp.route("/api/admin/subsections/<int:subsection_id>", methods=["GET"])
@authenticate_token
@require_any_realm_role("admin", "ROLE_TEACHER")
def get_subsection(subsection_id):
    subsection = Subsection.query.get(subsection_id)
    if subsection is None:
        return jsonify({"error": "subsection not found"}), 404

    tasks = Task.query.filter_by(subsection_id=subsection_id).order_by(
        Task.order_index, Task.id
    ).all()
    materials = KnowledgeResource.query.filter_by(subsection_id=subsection_id).order_by(
        KnowledgeResource.order_index
    ).all()
    ebook = Ebook.query.filter_by(subsection_id=subsection_id).first()

    payload = subsection_json(subsection)
    payload["tasks"] = [task_json(t) for t in tasks]
    payload["materials"] = [material_json(m) for m in materials]
    payload["ebook"] = {"id": ebook.id, "title": ebook.title} if ebook else None
    return jsonify(payload), 200


@admin_subsections_bp.route("/api/admin/subsections/<int:subsection_id>", methods=["PATCH"])
@authenticate_token
@require_realm_role("admin")
def update_subsection(subsection_id):
    subsection = Subsection.query.get(subsection_id)
    if subsection is None:
        return jsonify({"error": "subsection not found"}), 404

    data = request.get_json()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    if "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            return jsonify({"error": "title cannot be empty"}), 400
        subsection.title = title
    if "description" in data:
        subsection.description = (data.get("description") or "").strip() or None

    db.session.commit()
    return jsonify(subsection_json(subsection)), 200


@admin_subsections_bp.route("/api/admin/subsections/<int:subsection_id>", methods=["DELETE"])
@authenticate_token
@require_realm_role("admin")
def delete_subsection(subsection_id):
    subsection = Subsection.query.get(subsection_id)
    if subsection is None:
        return jsonify({"error": "subsection not found"}), 404

    content_deletion.delete_subsection(subsection)
    db.session.commit()

    return "", 204

from flask import Blueprint, jsonify, request

from app.auth import authenticate_token, require_any_realm_role, require_realm_role
from app.constants import RealmRole
from app.extensions import db
from app.models.sections import Section
from app.models.subsections import Subsection
from app.serializers import section_json, subsection_json
from app.services import content_deletion

admin_sections_bp = Blueprint("admin_sections", __name__)


@admin_sections_bp.route("/api/admin/sections", methods=["GET"])
@authenticate_token
@require_any_realm_role(RealmRole.ADMIN, RealmRole.TEACHER)
def list_sections():
    sections = Section.query.order_by(Section.order_index).all()
    return jsonify([section_json(s) for s in sections]), 200


@admin_sections_bp.route("/api/admin/sections", methods=["POST"])
@authenticate_token
@require_realm_role(RealmRole.ADMIN)
def create_section():
    data = request.get_json()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip() or None

    if not title:
        return jsonify({"error": "title is required"}), 400

    max_order = db.session.query(db.func.max(Section.order_index)).scalar() or 0

    section = Section(title=title, description=description, order_index=max_order + 1)
    db.session.add(section)
    db.session.commit()

    return jsonify(section_json(section)), 201


@admin_sections_bp.route("/api/admin/sections/<int:section_id>", methods=["GET"])
@authenticate_token
@require_any_realm_role(RealmRole.ADMIN, RealmRole.TEACHER)
def get_section(section_id):
    section = db.session.get(Section, section_id)
    if section is None:
        return jsonify({"error": "section not found"}), 404

    subsections = Subsection.query.filter_by(section_id=section_id).order_by(
        Subsection.order_index
    ).all()

    payload = section_json(section)
    payload["subsections"] = [subsection_json(s) for s in subsections]
    payload["materials"] = []
    return jsonify(payload), 200


@admin_sections_bp.route("/api/admin/sections/<int:section_id>", methods=["PATCH"])
@authenticate_token
@require_realm_role(RealmRole.ADMIN)
def update_section(section_id):
    section = db.session.get(Section, section_id)
    if section is None:
        return jsonify({"error": "section not found"}), 404

    data = request.get_json()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    if "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            return jsonify({"error": "title cannot be empty"}), 400
        section.title = title
    if "description" in data:
        section.description = (data.get("description") or "").strip() or None

    db.session.commit()
    return jsonify(section_json(section)), 200


@admin_sections_bp.route("/api/admin/sections/<int:section_id>", methods=["DELETE"])
@authenticate_token
@require_realm_role(RealmRole.ADMIN)
def delete_section(section_id):
    section = db.session.get(Section, section_id)
    if section is None:
        return jsonify({"error": "section not found"}), 404

    content_deletion.delete_section(section)
    db.session.commit()

    return "", 204

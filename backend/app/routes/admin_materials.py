import os

from flask import Blueprint, current_app, jsonify, request

from app.extensions import db
from app.middleware.auth import authenticate_token, require_realm_role
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.knowledge_resources import KnowledgeResource
from app.services.uploads import save_upload_file

admin_materials_bp = Blueprint("admin_materials", __name__)


def _material_json(resource):
    return {
        "id": resource.id,
        "section_id": resource.section_id,
        "subsection_id": resource.subsection_id,
        "type": resource.type,
        "title": resource.title,
        "content_text": resource.content_text,
        "file_url": resource.file_url,
        "order_index": resource.order_index,
    }


def _create_material(*, section_id=None, subsection_id=None):
    title = (request.form.get("title") or "").strip()
    if not title:
        return jsonify({"error": "title is required"}), 400

    content_text = (request.form.get("content_text") or "").strip()
    file_storage = request.files.get("file")

    if file_storage and file_storage.filename:
        resource_type, file_url = save_upload_file(file_storage)
        if resource_type is None:
            return jsonify({"error": "file must be a PDF or image (or use the text box instead)"}), 400
        stored_text = None
    elif content_text:
        resource_type = "text"
        file_url = None
        stored_text = content_text
    else:
        return jsonify({"error": "add either some text or a file"}), 400

    order_query = db.session.query(db.func.max(KnowledgeResource.order_index))
    if section_id is not None:
        order_query = order_query.filter(KnowledgeResource.section_id == section_id)
    else:
        order_query = order_query.filter(KnowledgeResource.subsection_id == subsection_id)
    max_order = order_query.scalar() or 0

    resource = KnowledgeResource(
        section_id=section_id,
        subsection_id=subsection_id,
        type=resource_type,
        title=title,
        content_text=stored_text,
        file_url=file_url,
        order_index=max_order + 1,
    )
    db.session.add(resource)
    db.session.commit()

    return jsonify(_material_json(resource)), 201


@admin_materials_bp.route("/api/admin/sections/<int:section_id>/materials", methods=["POST"])
@authenticate_token
@require_realm_role("admin")
def create_section_material(section_id):
    if Section.query.get(section_id) is None:
        return jsonify({"error": "section not found"}), 404
    return _create_material(section_id=section_id)


@admin_materials_bp.route("/api/admin/subsections/<int:subsection_id>/materials", methods=["POST"])
@authenticate_token
@require_realm_role("admin")
def create_subsection_material(subsection_id):
    if Subsection.query.get(subsection_id) is None:
        return jsonify({"error": "subsection not found"}), 404
    return _create_material(subsection_id=subsection_id)


@admin_materials_bp.route("/api/admin/materials/<int:material_id>", methods=["DELETE"])
@authenticate_token
@require_realm_role("admin")
def delete_material(material_id):
    resource = KnowledgeResource.query.get(material_id)
    if resource is None:
        return jsonify({"error": "material not found"}), 404

    if resource.file_url:
        file_path = os.path.join(current_app.static_folder, *resource.file_url.split("/")[2:])
        if os.path.exists(file_path):
            os.remove(file_path)

    db.session.delete(resource)
    db.session.commit()

    return "", 204

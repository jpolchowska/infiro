from flask import Blueprint, jsonify

from app.auth import authenticate_token, require_any_realm_role, require_realm_role
from app.constants import RealmRole
from app.extensions import db
from app.models.ebooks import Ebook
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.payload import json_object
from app.serializers import subsection_json
from app.services.content_preview import task_summary
from app.services import content_deletion

bp = Blueprint("admin_subsections", __name__, url_prefix="/api/admin")


@bp.route("/sections/<int:section_id>/subsections", methods=["POST"])
@authenticate_token
@require_realm_role(RealmRole.ADMIN)
def create_subsection(section_id):
    section = db.session.get(Section, section_id)
    if section is None:
        return jsonify({"error": "Section not found"}), 404

    data = json_object()
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


@bp.route("/subsections/<int:subsection_id>", methods=["GET"])
@authenticate_token
@require_any_realm_role(RealmRole.ADMIN, RealmRole.TEACHER)
def get_subsection(subsection_id):
    subsection = db.session.get(Subsection, subsection_id)
    if subsection is None:
        return jsonify({"error": "Subsection not found"}), 404

    tasks = Task.query.filter_by(subsection_id=subsection_id).order_by(
        Task.order_index, Task.id
    ).all()
    ebook = Ebook.query.filter_by(subsection_id=subsection_id).first()

    payload = subsection_json(subsection)
    payload["tasks"] = [task_summary(t) for t in tasks]
    payload["ebook"] = {"id": ebook.id, "title": ebook.title} if ebook else None
    return jsonify(payload), 200


@bp.route("/subsections/<int:subsection_id>/ebook", methods=["GET"])
@authenticate_token
@require_any_realm_role(RealmRole.ADMIN, RealmRole.TEACHER)
def get_subsection_ebook(subsection_id):
    ebook = Ebook.query.filter_by(subsection_id=subsection_id).first()
    if ebook is None:
        return jsonify({"error": "Ebook not found"}), 404

    return jsonify({
        "id": ebook.id,
        "subsection_id": ebook.subsection_id,
        "title": ebook.title,
        "intro": ebook.intro,
        "blocks": ebook.content,
    }), 200


@bp.route("/subsections/<int:subsection_id>", methods=["PATCH"])
@authenticate_token
@require_realm_role(RealmRole.ADMIN)
def update_subsection(subsection_id):
    subsection = db.session.get(Subsection, subsection_id)
    if subsection is None:
        return jsonify({"error": "Subsection not found"}), 404

    data = json_object()
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


@bp.route("/subsections/<int:subsection_id>", methods=["DELETE"])
@authenticate_token
@require_realm_role(RealmRole.ADMIN)
def delete_subsection(subsection_id):
    subsection = db.session.get(Subsection, subsection_id)
    if subsection is None:
        return jsonify({"error": "Subsection not found"}), 404

    content_deletion.delete_subsection(subsection)
    db.session.commit()

    return "", 204

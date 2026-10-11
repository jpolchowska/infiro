from flask import Blueprint, jsonify, request

from app.auth import authenticate_token, require_realm_role
from app.constants import RealmRole
from app.extensions import db
from app.models.sections import Section
from app.payload import json_body
from app.services.ebook_import import import_ebook
from app.services.final_test_import import import_final_test
from app.services.task_import import import_tasks
from app.services.uploads import extract_image_zip

bp = Blueprint("admin_imports", __name__, url_prefix="/api/admin")


@bp.route("/uploads/images", methods=["POST"])
@authenticate_token
@require_realm_role(RealmRole.ADMIN)
def upload_images_zip():
    urls, error = extract_image_zip(request.files.get("file"))
    if error:
        return jsonify({"error": error}), 400

    return jsonify({"file_count": len(urls), "files": urls}), 201


@bp.route("/tasks/import", methods=["POST"])
@authenticate_token
@require_realm_role(RealmRole.ADMIN)
def import_tasks_json():
    data = json_body()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    result, errors = import_tasks(data)
    if errors:
        return jsonify({"errors": errors}), 400

    return jsonify(result), 201


@bp.route("/ebooks/import", methods=["POST"])
@authenticate_token
@require_realm_role(RealmRole.ADMIN)
def upload_ebooks():
    result, errors = import_ebook(request.files.get("file"))
    if errors:
        return jsonify({"errors": errors}), 400

    return jsonify(result), 201


@bp.route("/sections/<int:section_id>/final-test/import", methods=["POST"])
@authenticate_token
@require_realm_role(RealmRole.ADMIN)
def import_final_test_json(section_id):
    section = db.session.get(Section, section_id)
    if section is None:
        return jsonify({"errors": [f"Section does not exist: {section_id}"]}), 404

    data = json_body()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    result, errors = import_final_test(section, data)
    if errors:
        return jsonify({"errors": errors}), 400

    return jsonify(result), 201

from flask import Blueprint, jsonify, request

from app.extensions import db
from app.middleware.auth import authenticate_token, require_realm_role
from app.models.sections import Section
from app.services.ebook_import import import_ebook
from app.services.section_test_import import import_section_test
from app.services.task_import import import_tasks
from app.services.uploads import extract_image_zip

admin_import_bp = Blueprint("admin_import", __name__)


@admin_import_bp.route("/api/admin/uploads/images", methods=["POST"])
@authenticate_token
@require_realm_role("admin")
def upload_images_zip():
    urls, error = extract_image_zip(request.files.get("file"))
    if error:
        return jsonify({"error": error}), 400

    return jsonify({"file_count": len(urls), "files": urls}), 201


@admin_import_bp.route("/api/admin/tasks/import", methods=["POST"])
@authenticate_token
@require_realm_role("admin")
def import_tasks_json():
    data = request.get_json()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    result, errors = import_tasks(data)
    if errors:
        return jsonify({"errors": errors}), 400

    return jsonify(result), 201


@admin_import_bp.route("/api/admin/ebooks/import", methods=["POST"])
@authenticate_token
@require_realm_role("admin")
def upload_ebooks():
    result, errors = import_ebook(request.files.get("file"))
    if errors:
        return jsonify({"errors": errors}), 400

    return jsonify(result), 201


@admin_import_bp.route("/api/admin/sections/<int:section_id>/final-test/import", methods=["POST"])
@authenticate_token
@require_realm_role("admin")
def import_section_final_test(section_id):
    section = db.session.get(Section, section_id)
    if section is None:
        return jsonify({"errors": [f"Section does not exist: {section_id}"]}), 404

    data = request.get_json()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    result, errors = import_section_test(section, data)
    if errors:
        return jsonify({"errors": errors}), 400

    return jsonify(result), 201

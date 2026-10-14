from flask import Blueprint, jsonify

from app.auth import authenticate_token, require_realm_role
from app.constants import RealmRole
from app.payload import json_object
from app.services.leveling_test_settings import get_settings, settings_json, update_settings

bp = Blueprint("admin_settings", __name__, url_prefix="/api/admin")


@bp.route("/settings/leveling-test", methods=["GET"])
@authenticate_token
@require_realm_role(RealmRole.ADMIN)
def get_leveling_test_settings():
    return jsonify(settings_json(get_settings())), 200


@bp.route("/settings/leveling-test", methods=["PATCH"])
@authenticate_token
@require_realm_role(RealmRole.ADMIN)
def update_leveling_test_settings():
    data = json_object()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    settings, errors = update_settings(data)
    if errors:
        return jsonify({"errors": errors}), 400

    return jsonify(settings_json(settings)), 200

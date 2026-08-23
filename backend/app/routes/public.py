from flask import Blueprint, jsonify


public_bp = Blueprint("public", __name__)


@public_bp.route("/api/public", methods=["GET"])
def public():
    return jsonify({
        "message": "Backend is running"
    })
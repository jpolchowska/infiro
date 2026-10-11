from flask import Blueprint, jsonify

bp = Blueprint("health", __name__)


@bp.route("/api/public", methods=["GET"])
def health():
    return jsonify({
        "message": "Backend is running"
    })

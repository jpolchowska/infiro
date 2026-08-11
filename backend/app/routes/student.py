from flask import Blueprint, jsonify

from app.middleware.auth import authenticate_token
from app.middleware.auth import require_role


student_bp = Blueprint("student", __name__)


@student_bp.route("/api/student", methods=["GET"])
@authenticate_token
@require_role("Uczeń")
def student():
    return jsonify({
        "message": "Witaj"
    })
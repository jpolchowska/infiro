from flask import Blueprint, jsonify

from app.middleware.auth import authenticate_token


student_bp = Blueprint("student", __name__)


@student_bp.route("/api/student", methods=["GET"])
@authenticate_token
def student():
    return jsonify({
        "message": "Witaj"
    })
from flask import Blueprint, jsonify

from app.auth import authenticate_token
from app.models.ebooks import Ebook

bp = Blueprint("student_ebooks", __name__, url_prefix="/api/student")


@bp.route("/subsections/<int:subsection_id>/ebook", methods=["GET"])
@authenticate_token
def get_ebook(subsection_id):
    ebook = Ebook.query.filter_by(subsection_id=subsection_id).first()
    if ebook is None:
        return jsonify({"error": "Ebook not found"}), 404

    return jsonify({
        "title": ebook.title,
        "intro": ebook.intro,
        "blocks": ebook.content,
    }), 200

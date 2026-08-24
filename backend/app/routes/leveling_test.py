from flask import Blueprint, jsonify

from app.extensions import db
from app.middleware.auth import authenticate_token, require_role
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.models.task_answer_options import TaskAnswerOption
from app.routes.student import _current_user

LEVELING_TEST_DIFFICULTY_LEVELS = [1, 2, 3]

leveling_test_bp = Blueprint("leveling_test", __name__)


def _pick_random_task(section_id, difficulty_level):
    return (
        Task.query.join(Subsection, Task.subsection_id == Subsection.id)
        .filter(Subsection.section_id == section_id, Task.difficulty_level == difficulty_level)
        .order_by(db.func.random())
        .first()
    )


def _task_json(task):
    options = (
        TaskAnswerOption.query.filter_by(task_id=task.id)
        .order_by(db.func.random())
        .all()
    )
    return {
        "task_id": task.id,
        "difficulty_level": task.difficulty_level,
        "title": task.title,
        "body_text": task.body_text,
        "image_url": task.image_url,
        "options": [
            {"id": o.id, "option_text": o.option_text, "is_correct": o.is_correct}
            for o in options
        ],
    }


@leveling_test_bp.route("/api/student/leveling-test", methods=["GET"])
@authenticate_token
@require_role("Uczeń")
def get_leveling_test():
    user = _current_user()
    if user is None:
        return jsonify({"error": "user not found, call /api/student/me first"}), 404

    sections_payload = []
    for section in Section.query.order_by(Section.order_index).all():
        questions = []
        for level in LEVELING_TEST_DIFFICULTY_LEVELS:
            task = _pick_random_task(section.id, level)
            if task is not None:
                questions.append(_task_json(task))

        if questions:
            sections_payload.append({
                "section_id": section.id,
                "section_title": section.title,
                "questions": questions,
            })

    return jsonify({"sections": sections_payload}), 200

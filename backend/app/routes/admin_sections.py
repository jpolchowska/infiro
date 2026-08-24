from flask import Blueprint, jsonify, request

from app.extensions import db
from app.middleware.auth import authenticate_token, require_realm_role
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.models.task_answer_options import TaskAnswerOption
from app.models.knowledge_resources import KnowledgeResource
from app.routes.admin_materials import _material_json

admin_sections_bp = Blueprint("admin_sections", __name__)


def _section_json(section):
    return {
        "id": section.id,
        "title": section.title,
        "description": section.description,
        "order_index": section.order_index,
        "subsection_count": Subsection.query.filter_by(section_id=section.id).count(),
        "task_count": (
            Task.query.join(Subsection).filter(Subsection.section_id == section.id).count()
        ),
    }


def _subsection_json(subsection):
    return {
        "id": subsection.id,
        "section_id": subsection.section_id,
        "title": subsection.title,
        "description": subsection.description,
        "order_index": subsection.order_index,
        "task_count": Task.query.filter_by(subsection_id=subsection.id).count(),
    }


def _validate_options(options):
    """Zwraca komunikat błędu (string), albo None jeśli opcje są poprawne."""
    if not isinstance(options, list) or len(options) < 2:
        return "options must be a list with at least 2 items"

    correct_count = 0
    for opt in options:
        if not isinstance(opt, dict) or not isinstance(opt.get("text"), str) or not opt["text"].strip():
            return "each option needs a non-empty 'text'"
        if not isinstance(opt.get("correct"), bool):
            return "each option needs a boolean 'correct'"
        if opt["correct"]:
            correct_count += 1

    if correct_count != 1:
        return "exactly one option must be correct"
    return None


def _task_json(task):
    options = TaskAnswerOption.query.filter_by(task_id=task.id).order_by(
        TaskAnswerOption.order_index
    ).all()
    return {
        "id": task.id,
        "subsection_id": task.subsection_id,
        "title": task.title,
        "body_text": task.body_text,
        "image_url": task.image_url,
        "difficulty_level": task.difficulty_level,
        "options": [
            {
                "id": option.id,
                "option_text": option.option_text,
                "is_correct": option.is_correct,
                "order_index": option.order_index,
            }
            for option in options
        ],
    }


@admin_sections_bp.route("/api/admin/sections", methods=["GET"])
@authenticate_token
@require_realm_role("admin")
def list_sections():
    sections = Section.query.order_by(Section.order_index).all()
    return jsonify([_section_json(s) for s in sections]), 200


@admin_sections_bp.route("/api/admin/sections", methods=["POST"])
@authenticate_token
@require_realm_role("admin")
def create_section():
    data = request.get_json()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip() or None

    if not title:
        return jsonify({"error": "title is required"}), 400

    max_order = db.session.query(db.func.max(Section.order_index)).scalar() or 0

    section = Section(title=title, description=description, order_index=max_order + 1)
    db.session.add(section)
    db.session.commit()

    return jsonify(_section_json(section)), 201


@admin_sections_bp.route("/api/admin/sections/<int:section_id>", methods=["GET"])
@authenticate_token
@require_realm_role("admin")
def get_section(section_id):
    section = Section.query.get(section_id)
    if section is None:
        return jsonify({"error": "section not found"}), 404

    subsections = Subsection.query.filter_by(section_id=section_id).order_by(
        Subsection.order_index
    ).all()
    materials = KnowledgeResource.query.filter_by(section_id=section_id).order_by(
        KnowledgeResource.order_index
    ).all()

    payload = _section_json(section)
    payload["subsections"] = [_subsection_json(s) for s in subsections]
    payload["materials"] = [_material_json(m) for m in materials]
    return jsonify(payload), 200


@admin_sections_bp.route("/api/admin/sections/<int:section_id>/subsections", methods=["POST"])
@authenticate_token
@require_realm_role("admin")
def create_subsection(section_id):
    section = Section.query.get(section_id)
    if section is None:
        return jsonify({"error": "section not found"}), 404

    data = request.get_json()
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

    return jsonify(_subsection_json(subsection)), 201


@admin_sections_bp.route("/api/admin/subsections/<int:subsection_id>", methods=["GET"])
@authenticate_token
@require_realm_role("admin")
def get_subsection(subsection_id):
    subsection = Subsection.query.get(subsection_id)
    if subsection is None:
        return jsonify({"error": "subsection not found"}), 404

    tasks = Task.query.filter_by(subsection_id=subsection_id).order_by(Task.id).all()
    materials = KnowledgeResource.query.filter_by(subsection_id=subsection_id).order_by(
        KnowledgeResource.order_index
    ).all()

    payload = _subsection_json(subsection)
    payload["tasks"] = [_task_json(t) for t in tasks]
    payload["materials"] = [_material_json(m) for m in materials]
    return jsonify(payload), 200


@admin_sections_bp.route("/api/admin/subsections/<int:subsection_id>/tasks", methods=["POST"])
@authenticate_token
@require_realm_role("admin")
def create_task(subsection_id):
    subsection = Subsection.query.get(subsection_id)
    if subsection is None:
        return jsonify({"error": "subsection not found"}), 404

    data = request.get_json()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    title = (data.get("title") or "").strip()
    body_text = (data.get("body_text") or "").strip()
    difficulty_level = data.get("difficulty_level")
    options = data.get("options")

    if not title:
        return jsonify({"error": "title is required"}), 400
    if not body_text:
        return jsonify({"error": "body_text is required"}), 400
    if not isinstance(difficulty_level, int) or not (1 <= difficulty_level <= 5):
        return jsonify({"error": "difficulty_level must be an integer 1-5"}), 400

    options_error = _validate_options(options)
    if options_error:
        return jsonify({"error": options_error}), 400

    task = Task(
        subsection_id=subsection_id,
        title=title,
        body_text=body_text,
        difficulty_level=difficulty_level,
    )
    db.session.add(task)
    db.session.flush()

    for order_index, opt in enumerate(options, start=1):
        db.session.add(TaskAnswerOption(
            task_id=task.id,
            option_text=opt["text"].strip(),
            is_correct=opt["correct"],
            order_index=order_index,
        ))

    db.session.commit()

    return jsonify(_task_json(task)), 201


@admin_sections_bp.route("/api/admin/sections/<int:section_id>", methods=["PATCH"])
@authenticate_token
@require_realm_role("admin")
def update_section(section_id):
    section = Section.query.get(section_id)
    if section is None:
        return jsonify({"error": "section not found"}), 404

    data = request.get_json()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    if "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            return jsonify({"error": "title cannot be empty"}), 400
        section.title = title
    if "description" in data:
        section.description = (data.get("description") or "").strip() or None

    db.session.commit()
    return jsonify(_section_json(section)), 200


@admin_sections_bp.route("/api/admin/sections/<int:section_id>", methods=["DELETE"])
@authenticate_token
@require_realm_role("admin")
def delete_section(section_id):
    section = Section.query.get(section_id)
    if section is None:
        return jsonify({"error": "section not found"}), 404

    subsection_ids = [
        s.id for s in Subsection.query.filter_by(section_id=section_id).all()
    ]
    if subsection_ids:
        task_ids = [
            t.id for t in Task.query.filter(Task.subsection_id.in_(subsection_ids)).all()
        ]
        if task_ids:
            TaskAnswerOption.query.filter(TaskAnswerOption.task_id.in_(task_ids)).delete(
                synchronize_session=False
            )
            Task.query.filter(Task.id.in_(task_ids)).delete(synchronize_session=False)
        KnowledgeResource.query.filter(
            KnowledgeResource.subsection_id.in_(subsection_ids)
        ).delete(synchronize_session=False)
        Subsection.query.filter(Subsection.id.in_(subsection_ids)).delete(synchronize_session=False)

    KnowledgeResource.query.filter_by(section_id=section_id).delete(synchronize_session=False)
    db.session.delete(section)
    db.session.commit()

    return "", 204


@admin_sections_bp.route("/api/admin/subsections/<int:subsection_id>", methods=["PATCH"])
@authenticate_token
@require_realm_role("admin")
def update_subsection(subsection_id):
    subsection = Subsection.query.get(subsection_id)
    if subsection is None:
        return jsonify({"error": "subsection not found"}), 404

    data = request.get_json()
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
    return jsonify(_subsection_json(subsection)), 200


@admin_sections_bp.route("/api/admin/subsections/<int:subsection_id>", methods=["DELETE"])
@authenticate_token
@require_realm_role("admin")
def delete_subsection(subsection_id):
    subsection = Subsection.query.get(subsection_id)
    if subsection is None:
        return jsonify({"error": "subsection not found"}), 404

    task_ids = [t.id for t in Task.query.filter_by(subsection_id=subsection_id).all()]
    if task_ids:
        TaskAnswerOption.query.filter(TaskAnswerOption.task_id.in_(task_ids)).delete(
            synchronize_session=False
        )
        Task.query.filter(Task.id.in_(task_ids)).delete(synchronize_session=False)

    KnowledgeResource.query.filter_by(subsection_id=subsection_id).delete(synchronize_session=False)
    db.session.delete(subsection)
    db.session.commit()

    return "", 204


@admin_sections_bp.route("/api/admin/tasks/<int:task_id>", methods=["PATCH"])
@authenticate_token
@require_realm_role("admin")
def update_task(task_id):
    task = Task.query.get(task_id)
    if task is None:
        return jsonify({"error": "task not found"}), 404

    data = request.get_json()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    if "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            return jsonify({"error": "title cannot be empty"}), 400
        task.title = title
    if "body_text" in data:
        body_text = (data.get("body_text") or "").strip()
        if not body_text:
            return jsonify({"error": "body_text cannot be empty"}), 400
        task.body_text = body_text
    if "difficulty_level" in data:
        difficulty_level = data.get("difficulty_level")
        if not isinstance(difficulty_level, int) or not (1 <= difficulty_level <= 5):
            return jsonify({"error": "difficulty_level must be an integer 1-5"}), 400
        task.difficulty_level = difficulty_level
    if "options" in data:
        options = data.get("options")
        options_error = _validate_options(options)
        if options_error:
            return jsonify({"error": options_error}), 400

        TaskAnswerOption.query.filter_by(task_id=task.id).delete(synchronize_session=False)
        for order_index, opt in enumerate(options, start=1):
            db.session.add(TaskAnswerOption(
                task_id=task.id,
                option_text=opt["text"].strip(),
                is_correct=opt["correct"],
                order_index=order_index,
            ))

    db.session.commit()
    return jsonify(_task_json(task)), 200


@admin_sections_bp.route("/api/admin/tasks/<int:task_id>", methods=["DELETE"])
@authenticate_token
@require_realm_role("admin")
def delete_task(task_id):
    task = Task.query.get(task_id)
    if task is None:
        return jsonify({"error": "task not found"}), 404

    TaskAnswerOption.query.filter_by(task_id=task.id).delete(synchronize_session=False)
    db.session.delete(task)
    db.session.commit()

    return "", 204

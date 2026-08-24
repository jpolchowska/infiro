from flask import Blueprint, jsonify, request

from app.extensions import db
from app.middleware.auth import authenticate_token, require_realm_role
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.models.task_answer_options import TaskAnswerOption

admin_import_bp = Blueprint("admin_import", __name__)


def _is_non_empty_string(value):
    return isinstance(value, str) and value.strip() != ""


def validate_import_payload(data):
    """Waliduje sparsowany JSON z importem zadań. Zwraca listę błędów jako
    tekst; pusta lista oznacza poprawny plik. Odzwierciedla logikę
    admin/lib/validateImport.ts -- trzymać oba pliki w zgodzie.
    """
    errors = []
    if not isinstance(data, list):
        return ["The file must contain a JSON array of tasks."]
    if not data:
        return ["The file contains no tasks."]

    for i, item in enumerate(data):
        if not isinstance(item, dict):
            errors.append(f"task #{i + 1}: must be an object.")
            continue
        label = f"task #{i + 1} ({item.get('section', '?')} / {item.get('subsection', '?')})"

        for field in ("section", "subsection", "difficulty", "title", "question", "options"):
            if field not in item:
                errors.append(f"{label}: missing '{field}'.")

        if "section" in item and not _is_non_empty_string(item.get("section")):
            errors.append(f"{label}: 'section' must be a non-empty string.")
        if "subsection" in item and not _is_non_empty_string(item.get("subsection")):
            errors.append(f"{label}: 'subsection' must be a non-empty string.")
        if "section_description" in item and item.get("section_description") is not None \
                and not isinstance(item.get("section_description"), str):
            errors.append(f"{label}: 'section_description' must be a string.")
        if "subsection_description" in item and item.get("subsection_description") is not None \
                and not isinstance(item.get("subsection_description"), str):
            errors.append(f"{label}: 'subsection_description' must be a string.")
        if "title" in item and not _is_non_empty_string(item.get("title")):
            errors.append(f"{label}: 'title' must be a non-empty string.")
        if "question" in item and not _is_non_empty_string(item.get("question")):
            errors.append(f"{label}: 'question' must be a non-empty string.")

        difficulty = item.get("difficulty")
        if isinstance(difficulty, bool) or not isinstance(difficulty, int) or not (1 <= difficulty <= 3):
            errors.append(f"{label}: 'difficulty' must be an integer 1-3.")

        options = item.get("options")
        if not isinstance(options, list) or len(options) < 2:
            errors.append(f"{label}: 'options' must be a list with at least 2 items.")
            continue

        correct_count = 0
        for j, opt in enumerate(options):
            olabel = f"{label} option #{j + 1}"
            if not isinstance(opt, dict):
                errors.append(f"{olabel}: must be an object.")
                continue
            if not _is_non_empty_string(opt.get("text")):
                errors.append(f"{olabel}: 'text' must be a non-empty string.")
            if not isinstance(opt.get("correct"), bool):
                errors.append(f"{olabel}: 'correct' must be true or false.")
            elif opt["correct"]:
                correct_count += 1

        if correct_count != 1:
            errors.append(f"{label}: exactly one option must have \"correct\": true (found {correct_count}).")

    return errors


@admin_import_bp.route("/api/admin/tasks/import", methods=["POST"])
@authenticate_token
@require_realm_role("admin")
def import_tasks():
    data = request.get_json()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    errors = validate_import_payload(data)
    if errors:
        return jsonify({"errors": errors}), 400

    section_cache = {}
    subsection_cache = {}
    task_count = 0

    for item in data:
        section_title = item["section"].strip()
        subsection_title = item["subsection"].strip()
        section_description = (item.get("section_description") or "").strip() or None
        subsection_description = (item.get("subsection_description") or "").strip() or None

        section = section_cache.get(section_title)
        if section is None:
            section = Section.query.filter_by(title=section_title).first()
            if section is None:
                max_order = db.session.query(db.func.max(Section.order_index)).scalar() or 0
                section = Section(title=section_title, order_index=max_order + 1)
                db.session.add(section)
                db.session.flush()
            section_cache[section_title] = section
        if section_description:
            section.description = section_description

        sub_key = (section.id, subsection_title)
        subsection = subsection_cache.get(sub_key)
        if subsection is None:
            subsection = Subsection.query.filter_by(
                section_id=section.id, title=subsection_title
            ).first()
            if subsection is None:
                max_order = db.session.query(db.func.max(Subsection.order_index)).filter(
                    Subsection.section_id == section.id
                ).scalar() or 0
                subsection = Subsection(
                    section_id=section.id,
                    title=subsection_title,
                    order_index=max_order + 1,
                )
                db.session.add(subsection)
                db.session.flush()
            subsection_cache[sub_key] = subsection
        if subsection_description:
            subsection.description = subsection_description

        task = Task(
            subsection_id=subsection.id,
            title=item["title"].strip(),
            body_text=item["question"].strip(),
            difficulty_level=item["difficulty"],
        )
        db.session.add(task)
        db.session.flush()

        for order_index, opt in enumerate(item["options"], start=1):
            db.session.add(TaskAnswerOption(
                task_id=task.id,
                option_text=opt["text"].strip(),
                is_correct=bool(opt["correct"]),
                order_index=order_index,
            ))
        task_count += 1

    db.session.commit()

    return jsonify({"task_count": task_count}), 201

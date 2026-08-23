import uuid

from flask import Blueprint, jsonify, request

from app.extensions import db
from app.middleware.auth import authenticate_token, require_realm_role
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.models.task_answer_options import TaskAnswerOption

admin_import_bp = Blueprint("admin_import", __name__)

STUDENT_THEME_IDS = {"default", "lol", "mario", "roblox"}


def _is_non_empty_string(value):
    return isinstance(value, str) and value.strip() != ""


def validate_import_payload(data):
    """Mirrors admin/lib/validateImport.ts -- keep the two in sync."""
    errors = []
    if not isinstance(data, list):
        return ["Plik musi zawierać tablicę JSON zadań."]
    if not data:
        return ["Plik nie zawiera żadnych zadań."]

    for i, item in enumerate(data):
        if not isinstance(item, dict):
            errors.append(f"zadanie #{i + 1}: musi być obiektem.")
            continue
        label = f"zadanie #{i + 1} ({item.get('section', '?')} / {item.get('subsection', '?')})"

        for field in ("section", "subsection", "difficulty", "variants"):
            if field not in item:
                errors.append(f"{label}: brak pola '{field}'.")
        if "section" in item and not _is_non_empty_string(item.get("section")):
            errors.append(f"{label}: 'section' musi być niepustym tekstem.")
        if "subsection" in item and not _is_non_empty_string(item.get("subsection")):
            errors.append(f"{label}: 'subsection' musi być niepustym tekstem.")

        difficulty = item.get("difficulty")
        if isinstance(difficulty, bool) or not isinstance(difficulty, int) or not (1 <= difficulty <= 5):
            errors.append(f"{label}: 'difficulty' musi być liczbą całkowitą 1-5.")

        variants = item.get("variants")
        if not isinstance(variants, dict):
            errors.append(f"{label}: 'variants' musi być obiektem.")
            continue
        if "default" not in variants:
            errors.append(f"{label}: warianty muszą zawierać wpis 'default'.")
        unknown_themes = sorted(set(variants) - STUDENT_THEME_IDS)
        if unknown_themes:
            errors.append(f"{label}: nieznane motywy: {unknown_themes}.")

        for theme, variant in variants.items():
            if theme not in STUDENT_THEME_IDS:
                continue
            vlabel = f"{label} [{theme}]"
            if not isinstance(variant, dict):
                errors.append(f"{vlabel}: musi być obiektem.")
                continue
            for field in ("title", "question", "options"):
                if field not in variant:
                    errors.append(f"{vlabel}: brak pola '{field}'.")
            if "title" in variant and not _is_non_empty_string(variant.get("title")):
                errors.append(f"{vlabel}: 'title' musi być niepustym tekstem.")
            if "question" in variant and not _is_non_empty_string(variant.get("question")):
                errors.append(f"{vlabel}: 'question' musi być niepustym tekstem.")

            options = variant.get("options")
            if not isinstance(options, list) or len(options) < 2:
                errors.append(f"{vlabel}: 'options' musi być listą z co najmniej 2 elementami.")
                continue
            correct_count = 0
            for j, opt in enumerate(options):
                olabel = f"{vlabel} opcja #{j + 1}"
                if not isinstance(opt, dict):
                    errors.append(f"{olabel}: musi być obiektem.")
                    continue
                if not _is_non_empty_string(opt.get("text")):
                    errors.append(f"{olabel}: 'text' musi być niepustym tekstem.")
                if not isinstance(opt.get("correct"), bool):
                    errors.append(f"{olabel}: 'correct' musi być wartością true/false.")
                elif opt["correct"]:
                    correct_count += 1
            if correct_count != 1:
                errors.append(
                    f"{vlabel}: dokładnie jedna opcja musi mieć \"correct\": true "
                    f"(znaleziono {correct_count})."
                )

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
    variant_row_count = 0

    for item in data:
        section_title = item["section"].strip()
        subsection_title = item["subsection"].strip()

        section_id = section_cache.get(section_title)
        if section_id is None:
            section = Section.query.filter_by(title=section_title).first()
            if section is None:
                max_order = db.session.query(db.func.max(Section.order_index)).scalar() or 0
                section = Section(title=section_title, order_index=max_order + 1)
                db.session.add(section)
                db.session.flush()
            section_id = section.id
            section_cache[section_title] = section_id

        sub_key = (section_id, subsection_title)
        subsection_id = subsection_cache.get(sub_key)
        if subsection_id is None:
            subsection = Subsection.query.filter_by(
                section_id=section_id, title=subsection_title
            ).first()
            if subsection is None:
                max_order = db.session.query(db.func.max(Subsection.order_index)).filter(
                    Subsection.section_id == section_id
                ).scalar() or 0
                subsection = Subsection(
                    section_id=section_id,
                    title=subsection_title,
                    order_index=max_order + 1,
                )
                db.session.add(subsection)
                db.session.flush()
            subsection_id = subsection.id
            subsection_cache[sub_key] = subsection_id

        variants = item["variants"]
        group = uuid.uuid4().hex if len(variants) > 1 else None
        theme_order = ["default"] + [t for t in variants if t != "default"]

        for theme in theme_order:
            if theme not in variants:
                continue
            variant = variants[theme]
            task = Task(
                subsection_id=subsection_id,
                title=variant["title"].strip(),
                body_text=variant["question"].strip(),
                difficulty_level=item["difficulty"],
                theme=theme,
                variant_group=group,
            )
            db.session.add(task)
            db.session.flush()

            for order_index, opt in enumerate(variant["options"], start=1):
                db.session.add(TaskAnswerOption(
                    task_id=task.id,
                    option_text=opt["text"].strip(),
                    is_correct=bool(opt["correct"]),
                    order_index=order_index,
                ))
            variant_row_count += 1
        task_count += 1

    db.session.commit()

    return jsonify({"task_count": task_count, "variant_row_count": variant_row_count}), 201

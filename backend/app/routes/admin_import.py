from flask import Blueprint, jsonify, request
from uuid import uuid4

from app.extensions import db
from app.middleware.auth import authenticate_token, require_realm_role
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.models.task_answer_options import TaskAnswerOption
from app.services.uploads import extract_image_zip

admin_import_bp = Blueprint("admin_import", __name__)


@admin_import_bp.route("/api/admin/uploads/images", methods=["POST"])
@authenticate_token
@require_realm_role("admin")
def upload_images_zip():
    urls, error = extract_image_zip(request.files.get("file"))
    if error:
        return jsonify({"error": error}), 400

    return jsonify({"file_count": len(urls), "files": urls}), 201


def _is_non_empty_string(value):
    return isinstance(value, str) and value.strip() != ""


ALLOWED_TASK_TYPES = {"single_choice", "short_answer", "memory"}
ALLOWED_THEMES = {
    "default", "sport", "gry", "lego", "zwierzeta",
    "rysowanie", "muzyka", "jedzenie",
}


def validate_import_payload(data):
    """Waliduje sparsowany JSON z importem zadań (format zagnieżdżony:
    sekcje -> podsekcje -> zadania). Zwraca listę błędów jako tekst;
    pusta lista oznacza poprawny plik. Odzwierciedla logikę
    staff/lib/validateImport.ts -- trzymać oba pliki w zgodzie.
    """
    errors = []
    if not isinstance(data, list):
        return ["The file must contain a JSON array of sections."]
    if not data:
        return ["The file contains no sections."]

    for si, section in enumerate(data):
        slabel = f"section #{si + 1}"
        if not isinstance(section, dict):
            errors.append(f"{slabel}: must be an object.")
            continue
        if not _is_non_empty_string(section.get("section")):
            errors.append(f"{slabel}: 'section' must be a non-empty string.")
        else:
            slabel = f"section '{section['section']}'"

        subsections = section.get("subsections")
        if not isinstance(subsections, list):
            errors.append(f"{slabel}: 'subsections' must be a list.")
            continue

        for ssi, subsection in enumerate(subsections):
            sslabel = f"{slabel} / subsection #{ssi + 1}"
            if not isinstance(subsection, dict):
                errors.append(f"{sslabel}: must be an object.")
                continue
            if not _is_non_empty_string(subsection.get("subsection")):
                errors.append(f"{sslabel}: 'subsection' must be a non-empty string.")
            else:
                sslabel = f"{slabel} / subsection '{subsection['subsection']}'"

            tasks = subsection.get("tasks")
            if not isinstance(tasks, list):
                errors.append(f"{sslabel}: 'tasks' must be a list.")
                continue

            for ti, task in enumerate(tasks):
                tlabel = f"{sslabel} / task #{ti + 1}"
                if not isinstance(task, dict):
                    errors.append(f"{tlabel}: must be an object.")
                    continue
                _validate_task(task, tlabel, errors)

    return errors


def _validate_task(task, tlabel, errors):
    content_key = task.get("content_key")
    if content_key is not None and not _is_non_empty_string(content_key):
        errors.append(f"{tlabel}: 'content_key' must be a non-empty string.")

    task_type = task.get("type")
    if task_type not in ALLOWED_TASK_TYPES:
        errors.append(f"{tlabel}: 'type' must be one of {sorted(ALLOWED_TASK_TYPES)}.")
        task_type = None  # nieznany typ -> pomijamy dalsze reguły specyficzne dla typu

    if task_type != "memory":
        difficulty = task.get("difficulty")
        if isinstance(difficulty, bool) or not isinstance(difficulty, int) or not (1 <= difficulty <= 3):
            errors.append(f"{tlabel}: 'difficulty' must be an integer 1-3.")

    themes = task.get("themes")
    if not isinstance(themes, dict):
        errors.append(f"{tlabel}: 'themes' must be an object.")
        themes = None
    else:
        for key in set(themes.keys()) - ALLOWED_THEMES:
            errors.append(f"{tlabel}: unknown theme key '{key}'.")
        if "default" not in themes:
            errors.append(f"{tlabel}: themes must include 'default'.")
        for theme_key, variant in themes.items():
            if theme_key not in ALLOWED_THEMES:
                continue
            vlabel = f"{tlabel} theme '{theme_key}'"
            if not isinstance(variant, dict):
                errors.append(f"{vlabel}: must be an object.")
                continue
            if not _is_non_empty_string(variant.get("prompt")):
                errors.append(f"{vlabel}: 'prompt' must be a non-empty string.")

    if task_type == "single_choice":
        _validate_single_choice(themes, tlabel, errors)
    elif task_type == "short_answer":
        _validate_short_answer(themes, tlabel, errors)
    elif task_type == "memory":
        _validate_memory(task, tlabel, errors)


def _validate_single_choice(themes, tlabel, errors):
    if not isinstance(themes, dict) or not isinstance(themes.get("default"), dict):
        return  # brak/zły 'default' już zgłoszony wyżej
    _validate_options(themes["default"].get("options"), f"{tlabel} theme 'default'", errors)

    for theme_key, variant in themes.items():
        if theme_key == "default" or not isinstance(variant, dict):
            continue
        if "options" in variant:  # nadpisuje całą listę; brak -> dziedziczy z default
            _validate_options(variant.get("options"), f"{tlabel} theme '{theme_key}'", errors)


def _validate_options(options, olabel, errors):
    if not isinstance(options, list) or len(options) != 3:
        errors.append(f"{olabel}: 'options' must be a list of exactly 3 items.")
        return
    correct_count = 0
    for j, opt in enumerate(options):
        oplabel = f"{olabel} option #{j + 1}"
        if not isinstance(opt, dict):
            errors.append(f"{oplabel}: must be an object.")
            continue
        if not _is_non_empty_string(opt.get("text")):
            errors.append(f"{oplabel}: 'text' must be a non-empty string.")
        if opt.get("correct") is True:
            correct_count += 1
        # błędny/zły typ 'correct' jest pomijany, zgodnie ze specyfikacją

    if correct_count != 1:
        errors.append(f"{olabel}: exactly one option must have \"correct\": true (found {correct_count}).")


def _validate_short_answer(themes, tlabel, errors):
    if not isinstance(themes, dict) or not isinstance(themes.get("default"), dict):
        return
    _validate_answers(themes["default"].get("answers"), f"{tlabel} theme 'default'", errors)

    for theme_key, variant in themes.items():
        if theme_key == "default" or not isinstance(variant, dict):
            continue
        if "answers" in variant:  # zwykle brak -> dziedziczy z default
            _validate_answers(variant.get("answers"), f"{tlabel} theme '{theme_key}'", errors)


def _validate_answers(answers, alabel, errors):
    if not isinstance(answers, list) or not answers or not all(_is_non_empty_string(a) for a in answers):
        errors.append(f"{alabel}: 'answers' must be a non-empty list of non-empty strings.")


def _validate_memory(task, tlabel, errors):
    if not isinstance(task.get("themes"), dict):
        return

    default = task["themes"].get("default")
    if not isinstance(default, dict):
        return

    _validate_pairs(default.get("pairs"), f"{tlabel} theme 'default'", errors)
    for theme_key, variant in task["themes"].items():
        if theme_key == "default" or not isinstance(variant, dict):
            continue
        if "pairs" in variant:
            _validate_pairs(variant.get("pairs"), f"{tlabel} theme '{theme_key}'", errors)


def _validate_pairs(pairs, plabel, errors):
    if not isinstance(pairs, list) or len(pairs) not in (3, 6):
        errors.append(f"{plabel}: 'pairs' must be a list of length 3 or 6.")
        return
    for pi, pair in enumerate(pairs):
        label = f"{plabel} pair #{pi + 1}"
        if not isinstance(pair, dict):
            errors.append(f"{label}: must be an object.")
            continue
        if not _is_non_empty_string(pair.get("a")):
            errors.append(f"{label}: 'a' must be a non-empty string.")
        if not _is_non_empty_string(pair.get("b")):
            errors.append(f"{label}: 'b' must be a non-empty string.")


def _resolved_themes(themes):
    default = themes["default"]
    return {
        key: {**default, **variant}
        for key, variant in themes.items()
    }


def _replace_options(task, options):
    existing = TaskAnswerOption.query.filter_by(task_id=task.id).order_by(
        TaskAnswerOption.order_index
    ).all()
    for index, option_data in enumerate(options, start=1):
        if index <= len(existing):
            option = existing[index - 1]
            option.option_text = option_data["text"].strip()
            option.is_correct = option_data.get("correct") is True
            option.order_index = index
        else:
            db.session.add(TaskAnswerOption(
                task_id=task.id,
                option_text=option_data["text"].strip(),
                is_correct=option_data.get("correct") is True,
                order_index=index,
            ))


def _task_output(task):
    return {
        "id": task.id,
        "content_key": task.content_key,
        "type": task.type,
        "difficulty": task.difficulty_level,
        "themes": task.themes,
    }

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
    content_keys = set()
    imported_tasks = []
    task_count = 0

    for section_order, section_data in enumerate(data, start=1):
        section_title = section_data["section"].strip()
        section = section_cache.get(section_title) or Section.query.filter_by(
            title=section_title
        ).first()
        if section is None:
            section = Section(title=section_title)
            db.session.add(section)
            db.session.flush()
        section.order_index = section_order
        section_cache[section_title] = section

        for subsection_order, subsection_data in enumerate(
            section_data["subsections"], start=1
        ):
            subsection_title = subsection_data["subsection"].strip()
            sub_key = (section.id, subsection_title)
            subsection = subsection_cache.get(sub_key) or Subsection.query.filter_by(
                section_id=section.id, title=subsection_title
            ).first()
            if subsection is None:
                subsection = Subsection(
                    section_id=section.id,
                    title=subsection_title,
                )
                db.session.add(subsection)
                db.session.flush()
            subsection.order_index = subsection_order
            subsection_cache[sub_key] = subsection

            for task_order, task_data in enumerate(subsection_data["tasks"], start=1):
                themes = _resolved_themes(task_data["themes"])
                content_key = task_data.get("content_key") or str(uuid4())
                if content_key in content_keys:
                    return jsonify({"errors": [
                        f"duplicate content_key: '{content_key}'"
                    ]}), 400
                content_keys.add(content_key)

                task = Task.query.filter_by(content_key=content_key).first()
                if task is None:
                    default = themes["default"]
                    task = Task(
                        subsection_id=subsection.id,
                        title=None,
                        body_text=default["prompt"].strip(),
                        difficulty_level=task_data.get("difficulty"),
                        type=task_data["type"],
                        order_index=task_order,
                        content_key=content_key,
                    )
                    db.session.add(task)
                    db.session.flush()

                default = themes["default"]
                task.subsection_id = subsection.id
                task.type = task_data["type"]
                task.order_index = task_order
                task.title = None
                task.body_text = default["prompt"].strip()
                task.difficulty_level = task_data.get("difficulty")
                task.accepted_answers = default.get("answers")
                task.memory_pairs = default.get("pairs")
                task.themes = themes
                task.content_key = content_key
                task_data["id"] = task.id
                task_data["content_key"] = content_key

                if task.type == "single_choice":
                    _replace_options(task, default["options"])
                task_count += 1
                imported_tasks.append(_task_output(task))

    db.session.commit()

    return jsonify({
        "task_count": task_count,
        "tasks": imported_tasks,
        "data": data,
    }), 201

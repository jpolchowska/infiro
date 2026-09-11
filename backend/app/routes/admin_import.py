from flask import Blueprint, jsonify, request
from uuid import uuid4
import json
import jsonschema
from jsonschema import validate

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
    schema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "array",
        "items": {
            "type": "object",
            "required": ["section", "subsections"],
            "properties": {
                "section": {"type": "string"},
                "subsections": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["subsection", "tasks"],
                        "properties": {
                            "subsection": {"type": "string"},
                            "tasks": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "required": ["type", "themes"],
                                    "properties": {
                                        "type": {"type": "string"},
                                        "difficulty": {"type": "integer"},
                                        "themes": {
                                            "type": "object",
                                            "required": ["default"],
                                            "additionalProperties": {
                                                "type": "object",
                                                "required": ["prompt"],
                                                "properties": {
                                                    "prompt": {"type": "string"},
                                                    "options": {
                                                        "type": "array",
                                                        "items": {
                                                            "type": "object",
                                                            "required": ["text"],
                                                            "properties": {
                                                                "text": {"type": "string"},
                                                                "correct": {"type": "boolean"}
                                                            }
                                                        }
                                                    },
                                                    "answers": {
                                                        "type": "array",
                                                        "items": {"type": "string"}
                                                    },
                                                    "pairs": {
                                                        "type": "array",
                                                        "items": {
                                                            "type": "object",
                                                            "required": ["a", "b"],
                                                            "properties": {
                                                                "a": {"type": "string"},
                                                                "b": {"type": "string"}
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    try:
        validate(instance=data, schema=schema)
        print("✓ JSON jest poprawny!")
        return True
    except jsonschema.exceptions.ValidationError as err:
        print(f"Błąd walidacji: {err.message}")
        return False

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

    isOk = validate_import_payload(data)
    if isOk == False:
        return jsonify({"errors": ["Invalid JSON format"]}), 400

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
                        title="",
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

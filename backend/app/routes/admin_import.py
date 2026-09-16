from flask import Blueprint, current_app, jsonify, request
from uuid import uuid4
import io
import json
import jsonschema
import os
import posixpath
import zipfile
from jsonschema import validate
from PIL import Image as PILImage
from werkzeug.utils import secure_filename

from app.extensions import db
from app.middleware.auth import authenticate_token, require_realm_role
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.models.task_answer_options import TaskAnswerOption
from app.models.ebooks import ebooks
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
ALLOWED_CALLOUT_STYLES = {
    "zapamietaj", "wskazowka", "uwaga", "definicja",
}
ALLOWED_EBOOK_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}


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


def _ebook_errors(data):
    errors = []
    if not isinstance(data, dict):
        return ["ebook.json must contain an object"]

    for field in ("section", "subsection", "title"):
        if not _is_non_empty_string(data.get(field)):
            errors.append(f"{field} must be a non-empty string")
    if "intro" in data and not isinstance(data["intro"], str):
        errors.append("intro must be a string")

    blocks = data.get("blocks")
    if not isinstance(blocks, list) or not blocks:
        errors.append("blocks must be a non-empty list")
        return errors

    for index, block in enumerate(blocks):
        prefix = f"blocks[{index}]"
        if not isinstance(block, dict):
            errors.append(f"{prefix} must be an object")
            continue
        block_type = block.get("type")
        if block_type in {"heading", "subheading", "paragraph"}:
            if not _is_non_empty_string(block.get("text")):
                errors.append(f"{prefix}.text must be a non-empty string")
        elif block_type == "list":
            items = block.get("items")
            if not isinstance(items, list) or not items or any(
                not _is_non_empty_string(item) for item in items
            ):
                errors.append(f"{prefix}.items must be a non-empty list of strings")
        elif block_type == "image":
            if not _is_non_empty_string(block.get("file")):
                errors.append(f"{prefix}.file must be a non-empty string")
            if not _is_non_empty_string(block.get("alt")):
                errors.append(f"{prefix}.alt must be a non-empty string")
        elif block_type == "callout":
            if block.get("style") not in ALLOWED_CALLOUT_STYLES:
                errors.append(f"{prefix}.style is not allowed")
            if not _is_non_empty_string(block.get("text")):
                errors.append(f"{prefix}.text must be a non-empty string")
        else:
            errors.append(f"{prefix}.type is unknown")
    return errors


def _zip_member_path(name):
    path = name.replace("\\", "/")
    normalized = posixpath.normpath(path)
    if not path or path.startswith("/") or normalized != path:
        return None
    parts = path.split("/")
    if any(part in ("", ".", "..") for part in parts):
        return None
    return path


def _load_ebook_zip(file_storage):
    if not file_storage or not file_storage.filename:
        return None, ["ZIP file is required"]
    if not file_storage.filename.lower().endswith(".zip"):
        return None, ["Only .zip files are allowed"]
    try:
        archive = zipfile.ZipFile(file_storage.stream)
    except (OSError, zipfile.BadZipFile):
        return None, ["The uploaded file is not a valid ZIP archive"]

    with archive:
        members = {}
        for item in archive.infolist():
            path = _zip_member_path(item.filename)
            if item.is_dir():
                continue
            if path is None:
                return None, ["The ZIP archive contains an unsafe path"]
            if path in members:
                return None, [f"Duplicate ZIP path: {path}"]
            members[path] = item

        ebook_paths = [
            path for path in members
            if path.rsplit("/", 1)[-1] == "ebook.json"
        ]
        if len(ebook_paths) != 1:
            return None, ["The ZIP archive must contain exactly one ebook.json"]

        try:
            data = json.loads(archive.read(members[ebook_paths[0]]).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return None, ["ebook.json must contain valid UTF-8 JSON"]

        errors = _ebook_errors(data)
        ebook_root = posixpath.dirname(ebook_paths[0])
        image_root = f"{ebook_root}/images/" if ebook_root else "images/"
        image_paths = {
            path for path in members
            if path.startswith(image_root) and path.rsplit("/", 1)[-1]
        }
        image_bytes = {}
        for path in image_paths:
            extension = os.path.splitext(path)[1].lower().lstrip(".")
            if extension not in ALLOWED_EBOOK_IMAGE_EXTENSIONS:
                errors.append(f"Unsupported image file: {path}")
            else:
                image_bytes[path] = archive.read(members[path])

        for index, block in enumerate(
            data.get("blocks", []) if isinstance(data, dict) else []
        ):
            if isinstance(block, dict) and block.get("type") == "image":
                path = block.get("file")
                if isinstance(path, str):
                    normalized = posixpath.normpath(path.replace("\\", "/"))
                    archive_path = posixpath.join(ebook_root, normalized)
                    if normalized != path or archive_path not in image_paths:
                        errors.append(
                            f"blocks[{index}].file does not reference an image in the ZIP"
                        )

        if errors:
            return None, errors
        return {"data": data, "image_bytes": image_bytes, "ebook_root": ebook_root}, None

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

@admin_import_bp.route("/api/admin/ebooks/import", methods=["POST"])
@authenticate_token
@require_realm_role("admin")
def upload_ebooks():
    loaded, errors = _load_ebook_zip(request.files.get("file"))
    if errors:
        return jsonify({"errors": errors}), 400

    data = loaded["data"]
    section_title = data["section"].strip()
    subsection_title = data["subsection"].strip()
    section = Section.query.filter_by(title=section_title).first()
    subsection = None
    if section is not None:
        subsection = Subsection.query.filter_by(
            section_id=section.id, title=subsection_title
        ).first()
    if section is None:
        return jsonify({"errors": [f"Section does not exist: {section_title}"]}), 400
    if subsection is None:
        return jsonify({"errors": [
            f"Subsection does not exist in section: {subsection_title}"
        ]}), 400

    import_prefix = secure_filename(
        f"ebook_{subsection_title}_{data['title']}_{uuid4().hex}"
    )
    image_urls = {}
    image_dimensions = {}
    upload_dir = os.path.join(current_app.static_folder, "uploads", import_prefix)
    os.makedirs(upload_dir, exist_ok=True)
    for path, image_data in loaded["image_bytes"].items():
        filename = f"{uuid4().hex}_{secure_filename(os.path.basename(path))}"
        destination = os.path.join(upload_dir, filename)
        with open(destination, "wb") as image_file:
            image_file.write(image_data)
        relative_path = path[len(loaded["ebook_root"]):].lstrip("/")
        image_urls[relative_path] = f"/static/uploads/{import_prefix}/{filename}"
        with PILImage.open(io.BytesIO(image_data)) as img:
            image_dimensions[relative_path] = img.size

    content = dict(data)
    content["section"] = section_title
    content["subsection"] = subsection_title
    content["title"] = data["title"].strip()
    content["blocks"] = [
        {
            **block,
            "file": image_urls[block["file"]],
            "width": image_dimensions[block["file"]][0],
            "height": image_dimensions[block["file"]][1],
        }
        if block["type"] == "image" else block
        for block in data["blocks"]
    ]
    ebook = ebooks.query.filter_by(subsection_id=subsection.id).first()
    if ebook is None:
        ebook = ebooks(subsection_id=subsection.id, title=content["title"])
        db.session.add(ebook)
    ebook.title = content["title"]
    ebook.intro = content.get("intro")
    ebook.content = content["blocks"]
    db.session.commit()

    return jsonify({
        "id": ebook.id,
        "subsection_id": subsection.id,
        "title": ebook.title,
        "intro": ebook.intro,
        "blocks": ebook.content,
    }), 201


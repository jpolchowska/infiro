import io
import json
import os
import posixpath
import zipfile
from uuid import uuid4

from flask import current_app
from PIL import Image as PILImage
from werkzeug.utils import secure_filename

from app.extensions import db
from app.models.ebooks import Ebook
from app.models.sections import Section
from app.models.subsections import Subsection

ALLOWED_CALLOUT_STYLES = {
    "zapamietaj", "wskazowka", "uwaga", "definicja",
}
ALLOWED_EBOOK_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}


def _is_non_empty_string(value):
    return isinstance(value, str) and value.strip() != ""


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


def _find_subsection(section_title, subsection_title):
    section = Section.query.filter_by(title=section_title).first()
    if section is None:
        return None, [f"Section does not exist: {section_title}"]

    subsection = Subsection.query.filter_by(
        section_id=section.id, title=subsection_title
    ).first()
    if subsection is None:
        return None, [f"Subsection does not exist in section: {subsection_title}"]

    return subsection, None


def _store_images(loaded, import_prefix):
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
    return image_urls, image_dimensions


def import_ebook(file_storage):
    loaded, errors = _load_ebook_zip(file_storage)
    if errors:
        return None, errors

    data = loaded["data"]
    section_title = data["section"].strip()
    subsection_title = data["subsection"].strip()
    subsection, errors = _find_subsection(section_title, subsection_title)
    if errors:
        return None, errors

    import_prefix = secure_filename(
        f"ebook_{subsection_title}_{data['title']}_{uuid4().hex}"
    )
    image_urls, image_dimensions = _store_images(loaded, import_prefix)

    title = data["title"].strip()
    blocks = [
        {
            **block,
            "file": image_urls[block["file"]],
            "width": image_dimensions[block["file"]][0],
            "height": image_dimensions[block["file"]][1],
        }
        if block["type"] == "image" else block
        for block in data["blocks"]
    ]
    ebook = Ebook.query.filter_by(subsection_id=subsection.id).first()
    if ebook is None:
        ebook = Ebook(subsection_id=subsection.id, title=title)
        db.session.add(ebook)
    ebook.title = title
    ebook.intro = data.get("intro")
    ebook.content = blocks
    db.session.commit()

    return {
        "id": ebook.id,
        "subsection_id": subsection.id,
        "title": ebook.title,
        "intro": ebook.intro,
        "blocks": ebook.content,
    }, None

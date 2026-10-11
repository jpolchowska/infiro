import os
import zipfile

from flask import current_app

ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}


def extract_image_zip(file_storage):
    if not file_storage or not file_storage.filename:
        return None, "ZIP file is required"

    if not file_storage.filename.lower().endswith(".zip"):
        return None, "Only .zip files are allowed"

    try:
        archive = zipfile.ZipFile(file_storage.stream)
    except (OSError, zipfile.BadZipFile):
        return None, "The uploaded file is not a valid ZIP archive"

    with archive:
        files = [item for item in archive.infolist() if not item.is_dir()]
        if not files:
            return None, "The ZIP archive contains no files"

        upload_dir = os.path.realpath(os.path.join(current_app.static_folder, "uploads"))
        destinations = []
        total_size = 0

        for item in files:
            path = item.filename.replace("\\", "/")
            parts = path.split("/")
            extension = os.path.splitext(path)[1].lower().lstrip(".")
            is_symlink = (item.external_attr >> 16) & 0o170000 == 0o120000
            destination = os.path.realpath(os.path.join(upload_dir, *parts))

            if is_symlink or not path or any(part in ("", ".", "..") for part in parts):
                return None, "The ZIP archive contains an unsafe path"
            if extension not in ALLOWED_IMAGE_EXTENSIONS:
                return None, "The ZIP archive may contain only image files"
            if not destination.startswith(upload_dir + os.sep):
                return None, "The ZIP archive contains an unsafe path"
            if destination in destinations:
                return None, "The ZIP archive contains duplicate file paths"

            total_size += item.file_size
            if total_size > 100 * 1024 * 1024:
                return None, "The uncompressed ZIP content exceeds 100 MB"
            destinations.append(destination)

        os.makedirs(upload_dir, exist_ok=True)
        urls = []
        for item, destination in zip(files, destinations):
            os.makedirs(os.path.dirname(destination), exist_ok=True)
            with archive.open(item) as source, open(destination, "wb") as target:
                target.write(source.read())
            relative_path = os.path.relpath(destination, current_app.static_folder)
            urls.append("/static/" + relative_path.replace(os.sep, "/"))

        return urls, None

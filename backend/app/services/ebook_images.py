import os
import shutil

from flask import current_app

UPLOADS_URL_PREFIX = "/static/uploads/"


def _uploads_root():
    return os.path.realpath(os.path.join(current_app.static_folder, "uploads"))


def image_directories(blocks):
    directories = set()
    for block in blocks or []:
        if not isinstance(block, dict) or block.get("type") != "image":
            continue
        file_url = block.get("file")
        if isinstance(file_url, str) and file_url.startswith(UPLOADS_URL_PREFIX):
            directory = file_url[len(UPLOADS_URL_PREFIX):].split("/", 1)[0]
            if directory:
                directories.add(directory)
    return directories


def remove_image_directories(directories):
    uploads_root = _uploads_root()
    for directory in directories:
        path = os.path.realpath(os.path.join(uploads_root, directory))
        if os.path.dirname(path) == uploads_root and os.path.isdir(path):
            shutil.rmtree(path)

import os
from datetime import datetime

from flask import current_app
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "gif"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def save_upload_file(file_storage):
    """Zapisuje przesłany plik w app/static/uploads i zwraca (resource_type, file_url).

    Zwraca (None, None) jeśli rozszerzenie pliku jest niedozwolone.
    """
    if not file_storage or not file_storage.filename or not allowed_file(file_storage.filename):
        return None, None

    ext = file_storage.filename.rsplit(".", 1)[1].lower()
    resource_type = "pdf" if ext == "pdf" else "image"

    upload_dir = os.path.join(current_app.static_folder, "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    filename = secure_filename(f"{datetime.utcnow().timestamp():.0f}_{file_storage.filename}")
    file_storage.save(os.path.join(upload_dir, filename))

    file_url = f"/static/uploads/{filename}"
    return resource_type, file_url

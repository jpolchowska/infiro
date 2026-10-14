import io
import json
import zipfile

import pytest

from app.extensions import db
from app.models.ebooks import Ebook
from app.models.sections import Section
from app.models.subsections import Subsection
from tests.ebook_zip import IMAGE_PATH, build_ebook_zip, ebook_content, import_ebook


def _create_subsection():
    section = Section(title="Ułamki proste", order_index=0)
    db.session.add(section)
    db.session.flush()

    subsection = Subsection(section_id=section.id, title="Kawałki całości", order_index=0)
    db.session.add(subsection)
    db.session.commit()
    return subsection


def test_post_correct_zip(client, login):
    login("admin-sub", ["admin"])
    subsection = _create_subsection()

    response = import_ebook(client, build_ebook_zip())

    assert response.status_code == 201
    assert response.json["title"] == "Kawałki całości"
    assert response.json["subsection_id"] == subsection.id


def test_post_bad_zip(client, login):
    login("admin-sub", ["admin"])
    _create_subsection()

    response = import_ebook(client, build_ebook_zip(ebook_json='{"section": "Ułamki proste", "blocks": ['))

    assert response.status_code == 400


def test_post_zip_without_subsection(client, login):
    login("admin-sub", ["admin"])

    response = import_ebook(client, build_ebook_zip())

    assert response.status_code == 400


def _ebook_json(**changes):
    content = ebook_content()
    content.update(changes)
    return json.dumps(content, ensure_ascii=False)


def _zip_with(files):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        for path, data in files.items():
            archive.writestr(path, data)
    buffer.seek(0)
    return buffer


@pytest.mark.parametrize("archive,error", [
    (lambda: build_ebook_zip(ebook_json="[]"), "ebook.json must contain an object"),
    (lambda: build_ebook_zip(ebook_json=_ebook_json(title=" ")), "title must be a non-empty string"),
    (lambda: build_ebook_zip(ebook_json=_ebook_json(intro=5)), "intro must be a string"),
    (lambda: build_ebook_zip(ebook_json=_ebook_json(blocks=[])), "blocks must be a non-empty list"),
    (lambda: build_ebook_zip(ebook_json=_ebook_json(blocks=["x"])), "blocks[0] must be an object"),
    (lambda: build_ebook_zip(ebook_json=_ebook_json(blocks=[{"type": "video"}])), "blocks[0].type is unknown"),
    (lambda: build_ebook_zip(ebook_json=_ebook_json(blocks=[{"type": "paragraph"}])),
     "blocks[0].text must be a non-empty string"),
    (lambda: build_ebook_zip(ebook_json=_ebook_json(blocks=[{"type": "list", "items": []}])),
     "blocks[0].items must be a non-empty list of strings"),
    (lambda: build_ebook_zip(ebook_json=_ebook_json(blocks=[{"type": "callout", "style": "x", "text": "t"}])),
     "blocks[0].style is not allowed"),
    (lambda: build_ebook_zip(ebook_json=_ebook_json(blocks=[{"type": "image", "file": "images/x.png", "alt": "a"}])),
     "blocks[0].file does not reference an image in the ZIP"),
    (lambda: build_ebook_zip(ebook_json=_ebook_json(blocks=[{"type": "image", "file": "", "alt": ""}])),
     "blocks[0].file must be a non-empty string"),
    (lambda: build_ebook_zip(images=(IMAGE_PATH, "images/rysunek.bmp")),
     "Unsupported image file: kawalki-calosci/images/rysunek.bmp"),
    (lambda: _zip_with({"images/a.png": b"x"}), "The ZIP archive must contain exactly one ebook.json"),
    (lambda: _zip_with({"a/ebook.json": _ebook_json(), "b/ebook.json": _ebook_json()}),
     "The ZIP archive must contain exactly one ebook.json"),
    (lambda: _zip_with({"../ebook.json": _ebook_json()}), "The ZIP archive contains an unsafe path"),
])
def test_invalid_ebook_archives_are_rejected(client, login, archive, error):
    login("admin-sub", ["admin"])
    _create_subsection()

    response = import_ebook(client, archive())

    assert response.status_code == 400
    assert error in response.json["errors"]


@pytest.mark.parametrize("data,error", [
    ({}, "ZIP file is required"),
    ({"file": (io.BytesIO(b"x"), "ebook.txt")}, "Only .zip files are allowed"),
    ({"file": (io.BytesIO(b"not a zip"), "ebook.zip")}, "The uploaded file is not a valid ZIP archive"),
])
def test_upload_must_be_a_zip_archive(client, login, data, error):
    login("admin-sub", ["admin"])

    response = client.post(
        "/api/admin/ebooks/import",
        data=data,
        content_type="multipart/form-data",
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 400
    assert response.json == {"errors": [error]}


def test_reimporting_an_ebook_replaces_its_content(client, login):
    login("admin-sub", ["admin"])
    subsection = _create_subsection()
    import_ebook(client, build_ebook_zip())

    response = import_ebook(client, build_ebook_zip(ebook_json=_ebook_json(title="Nowy tytuł")))

    assert response.status_code == 201
    assert response.json["title"] == "Nowy tytuł"
    assert Ebook.query.filter_by(subsection_id=subsection.id).count() == 1

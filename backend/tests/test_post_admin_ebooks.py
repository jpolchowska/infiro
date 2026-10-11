from app.extensions import db
from app.models.sections import Section
from app.models.subsections import Subsection
from tests.ebook_archive import build_ebook_zip, import_ebook


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

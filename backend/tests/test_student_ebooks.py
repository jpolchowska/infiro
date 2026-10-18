from app.extensions import db
from app.models.users import User
from app.models.sections import Section
from app.models.subsections import Subsection
from tests.ebook_zip import build_ebook_zip, import_ebook


def test_get_student_ebooks_existing_ebook(client, login):
    login("admin-sub", ["admin", "student"])

    admin = User(
        keycloak_sub="admin-sub",
        role="admin",
    )

    db.session.add(admin)
    db.session.commit()

    student = User(
        keycloak_sub="student-sub",
        role="student",
    )

    section = Section(
        title="Ułamki proste",
        description="Nauka mnożenia",
        order_index=0,
    )

    db.session.add_all([student, section])
    db.session.flush()

    subsection = Subsection(
        section_id=section.id,
        title="Kawałki całości",
        description="Podstawowe działania",
        order_index=0,
    )

    db.session.add_all([subsection])
    db.session.commit()

    response = import_ebook(client, build_ebook_zip())

    assert response.status_code == 201

    response = client.get(
        f'/api/student/subsections/{subsection.id}/ebook',
        headers={
            "Authorization": "Bearer test-token",
        },
    )

    assert response.status_code == 200
    assert response.json["title"] == "Kawałki całości"


def test_get_student_ebooks_nonexisting_ebook(client, login):
    login("admin-sub", ["admin", "student"])

    section = Section(
        title="Ułamki proste",
        description="Nauka mnożenia",
        order_index=0,
    )

    db.session.add_all([section])
    db.session.flush()

    subsection = Subsection(
        section_id=section.id,
        title="Kawałki całości",
        description="Podstawowe działania",
        order_index=0,
    )

    db.session.add_all([subsection])
    db.session.commit()

    response = client.get(
        f'/api/student/subsections/{subsection.id}/ebook',
        headers={
            "Authorization": "Bearer test-token",
        },
    )

    assert response.status_code == 404


def test_staff_can_preview_an_ebook(client, login):
    login("admin-sub", ["admin"])
    section = Section(title="Ułamki proste", order_index=0)
    db.session.add(section)
    db.session.flush()
    subsection = Subsection(section_id=section.id, title="Kawałki całości", order_index=0)
    db.session.add(subsection)
    db.session.commit()
    import_ebook(client, build_ebook_zip())

    login("teacher-sub", ["teacher"])
    response = client.get(
        f"/api/admin/subsections/{subsection.id}/ebook",
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 200
    assert response.json["title"] == "Kawałki całości"
    assert response.json["blocks"][0]["type"] == "heading"


def test_staff_ebook_preview_returns_404_without_ebook(client, login):
    login("admin-sub", ["admin"])

    response = client.get("/api/admin/subsections/999/ebook", headers={"Authorization": "Bearer test-token"})

    assert response.status_code == 404
    assert response.json == {"error": "Ebook not found"}

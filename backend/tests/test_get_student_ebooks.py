from pathlib import Path

from app.extensions import db
from app.models.users import User
from app.models.sections import Section
from app.models.subsections import Subsection


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

    zip_path = Path(__file__).with_name("kawalki-calosci-correct.zip")

    with zip_path.open("rb") as file:
        response = client.post(
            "/api/admin/ebooks/import",
            data={
                "file": (file, "kawalki-calosci-correct.zip"),
            },
            content_type="multipart/form-data",
            headers={"Authorization": "Bearer test-token"},
        )

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

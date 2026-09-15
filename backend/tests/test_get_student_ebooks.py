from datetime import datetime
from types import SimpleNamespace
from pathlib import Path

import pytest

from app import create_app
from app.extensions import db
from app.models.users import User
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.models.student_answers import StudentAnswer


@pytest.fixture
def client():
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite://",
    })

    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()



def test_get_student_ebooks_existing_ebook(client, monkeypatch):
    monkeypatch.setattr(
        "app.middleware.auth.jwks_client.get_signing_key_from_jwt",
        lambda token: SimpleNamespace(key="test-key"),
    )

    monkeypatch.setattr(
        "app.middleware.auth.jwt.decode",
        lambda *args, **kwargs: {
            "iss": "http://keycloak:8080/realms/matematyka-app",
            "sub": "admin-sub",
            "realm_access": {"roles": ["admin", "student"]},
        },
    )

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

    zip_path = Path(__file__).with_name("testowanie2.zip")

    with zip_path.open("rb") as file:
        response = client.post(
            "/api/admin/ebooks/import",
            data={
                "file": (file, "testowanie2.zip"),
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

def test_get_student_ebooks_nonexisting_ebook(client, monkeypatch):
    monkeypatch.setattr(
        "app.middleware.auth.jwks_client.get_signing_key_from_jwt",
        lambda token: SimpleNamespace(key="test-key"),
    )

    monkeypatch.setattr(
        "app.middleware.auth.jwt.decode",
        lambda *args, **kwargs: {
            "iss": "http://keycloak:8080/realms/matematyka-app",
            "sub": "admin-sub",
            "realm_access": {"roles": ["admin", "student"]},
        },
    )

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

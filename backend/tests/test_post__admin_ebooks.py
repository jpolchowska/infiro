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



def test_post_correct_zip(client, monkeypatch):
    monkeypatch.setattr(
        "app.middleware.auth.jwks_client.get_signing_key_from_jwt",
        lambda token: SimpleNamespace(key="test-key"),
    )

    monkeypatch.setattr(
        "app.middleware.auth.jwt.decode",
        lambda *args, **kwargs: {
            "iss": "http://keycloak:8080/realms/matematyka-app",
            "sub": "admin-sub",
            "realm_access": {"roles": ["admin"]},
        },
    )

    admin = User(
        keycloak_sub="admin-sub",
        role="admin",
    )

    db.session.add(admin)
    db.session.commit()

    section = Section(
        title="Ułamki proste",
        order_index=0,
    )
    db.session.add(section)
    db.session.commit()

    subsection = Subsection(
        section_id=section.id,
        title="Kawałki całości",
        order_index=0,
    )
    db.session.add(subsection)
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
    assert response.json["title"] == "Kawałki całości"
    assert response.json["subsection_id"] == subsection.id


def test_post_bad_zip(client, monkeypatch):
    monkeypatch.setattr(
        "app.middleware.auth.jwks_client.get_signing_key_from_jwt",
        lambda token: SimpleNamespace(key="test-key"),
    )

    monkeypatch.setattr(
        "app.middleware.auth.jwt.decode",
        lambda *args, **kwargs: {
            "iss": "http://keycloak:8080/realms/matematyka-app",
            "sub": "admin-sub",
            "realm_access": {"roles": ["admin"]},
        },
    )

    admin = User(
        keycloak_sub="admin-sub",
        role="admin",
    )

    db.session.add(admin)
    db.session.commit()

    section = Section(
        title="Ułamki proste",
        order_index=0,
    )
    db.session.add(section)
    db.session.commit()

    subsection = Subsection(
        section_id=section.id,
        title="Kawałki całości",
        order_index=0,
    )
    db.session.add(subsection)
    db.session.commit()

    zip_path = Path(__file__).with_name("kawalki-calosci-incorrect.zip")
    with zip_path.open("rb") as file:
        response = client.post(
            "/api/admin/ebooks/import",
            data={
                "file": (file, "kawalki-calosci-incorrect.zip"),
            },
            content_type="multipart/form-data",
            headers={"Authorization": "Bearer test-token"},
        )

    assert response.status_code == 400

def test_post_zip_without_subsection(client, monkeypatch):
    monkeypatch.setattr(
        "app.middleware.auth.jwks_client.get_signing_key_from_jwt",
        lambda token: SimpleNamespace(key="test-key"),
    )

    monkeypatch.setattr(
        "app.middleware.auth.jwt.decode",
        lambda *args, **kwargs: {
            "iss": "http://keycloak:8080/realms/matematyka-app",
            "sub": "admin-sub",
            "realm_access": {"roles": ["admin"]},
        },
    )

    admin = User(
        keycloak_sub="admin-sub",
        role="admin",
    )

    db.session.add(admin)
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

    assert response.status_code == 400
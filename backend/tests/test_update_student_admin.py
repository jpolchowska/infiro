from types import SimpleNamespace

import pytest

from app import create_app
from app.extensions import db
from app.models.users import User


@pytest.fixture
def client():
    app = create_app()
    app.config.update(
        TESTING=True,
        SQLALCHEMY_DATABASE_URI="sqlite://",
    )

    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def test_admin_can_assign_student_to_teacher(client, monkeypatch):
    monkeypatch.setattr(
        "app.middleware.auth.jwks_client.get_signing_key_from_jwt",
        lambda token: SimpleNamespace(key="test-key"),
    )
    monkeypatch.setattr(
        "app.middleware.auth.jwt.decode",
        lambda *args, **kwargs: {
            "iss": "http://keycloak:8080/realms/matematyka-app",
            "realm_access": {"roles": ["admin"]},
        },
    )

    teacher = User(keycloak_sub="teacher-sub", role="teacher")
    student = User(keycloak_sub="student-sub", role="student")
    db.session.add_all([teacher, student])
    db.session.commit()

    response = client.patch(
        f"/api/admin/students/{student.id}",
        headers={"Authorization": "Bearer test-token"},
        json={"teacher_id": teacher.id},
    )

    assert response.status_code == 200
    assert db.session.get(User, student.id).teacher_id == teacher.id

def test_admin_cannot_assign_nonexistent_teacher(client, monkeypatch):
    monkeypatch.setattr(
        "app.middleware.auth.jwks_client.get_signing_key_from_jwt",
        lambda token: SimpleNamespace(key="test-key"),
    )
    monkeypatch.setattr(
        "app.middleware.auth.jwt.decode",
        lambda *args, **kwargs: {
            "iss": "http://keycloak:8080/realms/matematyka-app",
            "realm_access": {"roles": ["admin"]},
        },
    )

    student = User(keycloak_sub = "student_sub",role = "student")

    db.session.add(student)
    db.session.commit()

    response = client.patch(
    f"/api/admin/students/{student.id}",
    headers={"Authorization": "Bearer test-token"},
    json={"teacher_id": 9999},
)
    assert response.status_code == 404

def test_admin_not_admin_tries_to_update_student(client, monkeypatch):
    monkeypatch.setattr(
        "app.middleware.auth.jwks_client.get_signing_key_from_jwt",
        lambda token: SimpleNamespace(key="test-key"),
    )
    monkeypatch.setattr(
        "app.middleware.auth.jwt.decode",
        lambda *args, **kwargs: {
            "iss": "http://keycloak:8080/realms/matematyka-app",
            "realm_access": {"roles": ["teacher"]},
        },
    )

    teacher = User(keycloak_sub="teacher-sub", role="teacher")
    student = User(keycloak_sub="student-sub", role="student")
    db.session.add_all([teacher, student])
    db.session.commit()

    response = client.patch(
        f"/api/admin/students/{student.id}",
        headers={"Authorization": "Bearer test-token"},
        json={"teacher_id": teacher.id},
    )

    assert response.status_code == 403

def test_admin_student_doesnt_exist(client, monkeypatch):
    monkeypatch.setattr(
        "app.middleware.auth.jwks_client.get_signing_key_from_jwt",
        lambda token: SimpleNamespace(key="test-key"),
    )
    monkeypatch.setattr(
        "app.middleware.auth.jwt.decode",
        lambda *args, **kwargs: {
            "iss": "http://keycloak:8080/realms/matematyka-app",
            "realm_access": {"roles": ["admin"]},
        },
    )

    teacher = User(keycloak_sub="teacher-sub", role="teacher")
    student = User(keycloak_sub="student-sub", role="student")
    db.session.add_all([teacher, student])
    db.session.commit()

    response = client.patch(
        f"/api/admin/students/{9999}",
        headers={"Authorization": "Bearer test-token"},
        json={"teacher_id": teacher.id},
    )

    assert response.status_code == 404
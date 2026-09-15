import pytest
from types import SimpleNamespace

from app import create_app


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True

    with app.test_client() as client:
        yield client


def test_public_endpoint(client):
    response = client.get("/api/public")

    assert response.status_code == 200
    assert response.json["message"] == "Backend is running"


def test_student_without_token(client):
    response = client.get("/api/student")

    assert response.status_code == 401


def test_student_with_token(client, monkeypatch):
    monkeypatch.setattr(
        "app.middleware.auth.jwks_client.get_signing_key_from_jwt",
        lambda token: SimpleNamespace(key="test-key"),
    )
    monkeypatch.setattr(
        "app.middleware.auth.jwt.decode",
        lambda *args, **kwargs: {
            "iss": "http://keycloak:8080/realms/matematyka-app",
            "sub": "student-sub",
            "realm_access": {"roles": ["student"]},
        },
    )

    response = client.get(
        "/api/student",
        headers={
            "Authorization": "Bearer test-token"
        }
    )

    assert response.status_code == 200
    assert response.json["message"] == "Hello"
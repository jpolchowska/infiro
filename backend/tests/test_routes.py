import pytest

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


def test_student_with_token(client):
    response = client.get(
        "/api/student",
        headers={
            "Authorization": "Bearer test-token"
        }
    )

    assert response.status_code == 200
    assert response.json["message"] == "Hello"
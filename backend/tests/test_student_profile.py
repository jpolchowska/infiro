import pytest

from app.models.users import User

HEADERS = {"Authorization": "Bearer test-token"}


@pytest.mark.parametrize("url", [
    "/api/student/stats",
    "/api/student/sections",
    "/api/student/subsections/1/tasks",
])
def test_student_endpoints_return_404_without_profile(client, login, url):
    login("unknown-sub", ["student"])

    response = client.get(url, headers={"Authorization": "Bearer test-token"})

    assert response.status_code == 404
    assert response.get_json() == {"error": "User not found"}


@pytest.mark.parametrize("method,url", [
    ("get", "/api/student/leveling-test"),
    ("post", "/api/student/leveling-test/submit"),
    ("get", "/api/student/leveling-test/history"),
    ("get", "/api/student/sections/1/final-test"),
    ("post", "/api/student/sections/1/final-test/submit"),
    ("get", "/api/student/sections/1/final-test/history"),
    ("get", "/api/student/tasks/1"),
    ("post", "/api/student/tasks/1/answers"),
    ("get", "/api/student/subsections/1/timed"),
    ("post", "/api/student/subsections/1/timed/submit"),
    ("patch", "/api/student/interest"),
])
def test_other_student_endpoints_return_404_without_profile(client, login, method, url):
    login("unknown-sub", ["student"])

    response = getattr(client, method)(url, json={}, headers={"Authorization": "Bearer test-token"})

    assert response.status_code == 404
    assert response.get_json() == {"error": "User not found"}


def test_me_creates_the_student_and_refreshes_their_name(client, monkeypatch, login):
    login("student-sub", ["student"])
    first = client.get("/api/student/me", headers=HEADERS).json

    login("student-sub", ["student"])
    monkeypatch.setattr(
        "app.auth.jwt.decode",
        lambda *args, **kwargs: {
            "iss": "http://keycloak:8080/realms/matematyka-app",
            "sub": "student-sub",
            "given_name": "Ala",
            "family_name": "Kot",
            "realm_access": {"roles": ["student"]},
        },
    )
    second = client.get("/api/student/me", headers=HEADERS).json

    student = User.query.filter_by(keycloak_sub="student-sub").one()
    assert first["id"] == second["id"]
    assert (student.first_name, student.last_name) == ("Ala", "Kot")
    assert second["role"] == "student"


@pytest.mark.parametrize("interest,status", [("sport", 204), (None, 204), ("kosmos", 400)])
def test_interest_must_be_one_of_the_themes(client, login, interest, status):
    login("student-sub", ["student"])
    client.get("/api/student/me", headers=HEADERS)

    response = client.patch("/api/student/interest", json={"interest": interest}, headers=HEADERS)

    assert response.status_code == status
    if status == 204:
        assert client.get("/api/student/me", headers=HEADERS).json["interest"] == interest
    else:
        assert response.json == {"error": "Invalid interest"}

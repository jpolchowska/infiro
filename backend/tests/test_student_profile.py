import pytest


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

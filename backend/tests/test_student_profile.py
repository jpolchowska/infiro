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

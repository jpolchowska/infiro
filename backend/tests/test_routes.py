def test_public_endpoint(client):
    response = client.get("/api/public")

    assert response.status_code == 200
    assert response.json["message"] == "Backend is running"


def test_protected_endpoint_without_token(client):
    response = client.get("/api/student/me")

    assert response.status_code == 401


def test_protected_endpoint_with_malformed_header(client):
    response = client.get("/api/student/me", headers={"Authorization": "test-token"})

    assert response.status_code == 401

def test_health_endpoint_needs_no_token(client):
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json == {"status": "ok"}


def test_protected_endpoint_without_token(client):
    response = client.get("/api/student/me")

    assert response.status_code == 401


def test_protected_endpoint_with_malformed_header(client):
    response = client.get("/api/student/me", headers={"Authorization": "test-token"})

    assert response.status_code == 401

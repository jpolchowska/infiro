import jwt


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


def _request_with_failing_decode(client, login, monkeypatch, error):
    login("student-sub", ["student"])

    def fail(*args, **kwargs):
        raise error

    monkeypatch.setattr("app.auth.jwt.decode", fail)
    return client.get("/api/student/me", headers={"Authorization": "Bearer test-token"})


def test_expired_token_is_rejected(client, login, monkeypatch):
    response = _request_with_failing_decode(client, login, monkeypatch, jwt.ExpiredSignatureError())

    assert response.status_code == 403
    assert response.json == {"message": "Token expired"}


def test_invalid_token_is_rejected(client, login, monkeypatch):
    response = _request_with_failing_decode(client, login, monkeypatch, jwt.InvalidSignatureError("bad signature"))

    assert response.status_code == 403
    assert response.json["message"].startswith("Token verification failed")


def test_token_from_another_realm_is_rejected(client, login, monkeypatch):
    login("student-sub", ["student"])
    monkeypatch.setattr(
        "app.auth.jwt.decode",
        lambda *args, **kwargs: {"iss": "http://keycloak:8080/realms/other", "sub": "x", "realm_access": {"roles": []}},
    )

    response = client.get("/api/student/me", headers={"Authorization": "Bearer test-token"})

    assert response.status_code == 403
    assert response.json == {"message": "Invalid issuer"}


def test_missing_realm_role_is_rejected(client, login):
    login("student-sub", ["student"])

    admin_only = client.get("/api/admin/teachers", headers={"Authorization": "Bearer test-token"})
    staff_only = client.get("/api/admin/sections", headers={"Authorization": "Bearer test-token"})

    assert admin_only.status_code == 403
    assert admin_only.json == {"message": "Missing required role: admin"}
    assert staff_only.status_code == 403

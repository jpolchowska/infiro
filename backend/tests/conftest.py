from types import SimpleNamespace

import pytest

from app import create_app
from app.extensions import db

KEYCLOAK_ISSUER = "http://keycloak:8080/realms/matematyka-app"


@pytest.fixture
def client(tmp_path):
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite://",
    })
    app.static_folder = str(tmp_path)

    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()
        db.engine.dispose()


@pytest.fixture
def login(monkeypatch):
    def _login(sub=None, roles=()):
        claims = {
            "iss": KEYCLOAK_ISSUER,
            "realm_access": {"roles": list(roles)},
        }
        if sub is not None:
            claims["sub"] = sub

        monkeypatch.setattr(
            "app.auth.jwks_client.get_signing_key_from_jwt",
            lambda token: SimpleNamespace(key="test-key"),
        )
        monkeypatch.setattr(
            "app.auth.jwt.decode",
            lambda *args, **kwargs: claims,
        )

    return _login

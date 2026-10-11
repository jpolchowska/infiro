# Infiro Backend

Flask REST API for the Infiro platform. It serves the student mobile app and the staff panel,
verifies Keycloak access tokens and stores data in PostgreSQL.

Setup, environment variables and deployment are described in the [main README](../README.md).

## Structure

| Path | Contents |
| --- | --- |
| `app/routes/` | HTTP endpoints grouped into blueprints |
| `app/services/` | Business logic: imports and validation, themes, answers, progress, uploads |
| `app/models/` | SQLAlchemy models |
| `app/auth.py` | Token verification and role checks |
| `migrations/` | Flask-Migrate migrations, applied on container start |
| `seed/` | Example import files |
| `tests/` | pytest suite |

## Running

The backend runs as the `backend` service of the project's Docker Compose setup:

```bash
docker compose up --build backend
```

## Tests

```bash
docker compose exec backend python -m pytest tests -q
```

The tests use an in-memory SQLite database and mock token verification, so they need neither
PostgreSQL nor Keycloak.

## Local development

The tests can also run outside Docker in a virtual environment:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m pytest tests -q
```

The server itself is started through Docker Compose only. It needs PostgreSQL and reaches Keycloak
by its Compose service name, so authenticated endpoints do not work outside the Compose network.

import pytest

from app.extensions import db
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.models.users import User

HEADERS = {"Authorization": "Bearer test-token"}

ENDPOINTS = [
    ("post", "/api/admin/sections"),
    ("patch", "/api/admin/sections/1"),
    ("post", "/api/admin/sections/1/subsections"),
    ("patch", "/api/admin/subsections/1"),
    ("patch", "/api/admin/students/1"),
    ("post", "/api/student/tasks/1/answers"),
    ("post", "/api/student/subsections/1/timed/submit"),
    ("post", "/api/student/leveling-test/submit"),
    ("post", "/api/student/sections/1/final-test/submit"),
]


@pytest.fixture
def content():
    db.session.add_all([
        User(keycloak_sub="user-sub", role="student"),
        Section(title="Ułamki", order_index=1),
        Subsection(section_id=1, title="Kawałki całości", order_index=1),
        Task(subsection_id=1, title="", body_text="Ile to 2 · 2?", difficulty_level=1),
    ])
    db.session.commit()


def _login_for(login, url):
    login("user-sub", ["admin"] if url.startswith("/api/admin/") else ["student"])


@pytest.mark.parametrize("method,url", ENDPOINTS)
@pytest.mark.parametrize("body", [[], "text", 5, None])
def test_non_object_json_body_is_rejected(client, login, content, method, url, body):
    _login_for(login, url)

    response = getattr(client, method)(url, json=body, headers=HEADERS)

    assert response.status_code == 400
    assert response.json == {"error": "JSON body is required"}


@pytest.mark.parametrize("method,url", ENDPOINTS + [
    ("post", "/api/admin/tasks/import"),
    ("post", "/api/admin/sections/1/final-test/import"),
])
def test_non_json_body_is_rejected(client, login, content, method, url):
    _login_for(login, url)

    response = getattr(client, method)(url, data="not json", headers=HEADERS)

    assert response.status_code == 400
    assert response.json == {"error": "JSON body is required"}

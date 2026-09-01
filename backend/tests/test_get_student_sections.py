from datetime import datetime
from types import SimpleNamespace

import pytest

from app import create_app
from app.extensions import db
from app.models.users import User
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.models.student_answers import StudentAnswer


@pytest.fixture
def client():
    app = create_app()
    app.config.update(
        TESTING=True,
        SQLALCHEMY_DATABASE_URI="sqlite://",
    )

    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def test_get_student_sections(client, monkeypatch):
    monkeypatch.setattr(
        "app.middleware.auth.jwks_client.get_signing_key_from_jwt",
        lambda token: SimpleNamespace(key="test-key"),
    )

    monkeypatch.setattr(
        "app.middleware.auth.jwt.decode",
        lambda *args, **kwargs: {
            "iss": "http://keycloak:8080/realms/matematyka-app",
            "sub": "student-sub",
            "realm_access": {"roles": ["student"]},
        },
    )

    student = User(
        keycloak_sub="student-sub",
        role="student",
    )

    section = Section(
        title="Tabliczka mnożenia",
        description="Nauka mnożenia",
        order_index=1,
    )

    db.session.add_all([student, section])
    db.session.commit()

    subsection = Subsection(
        section_id=section.id,
        title="Mnożenie przez 2",
        description="Podstawowe działania",
        order_index=1,
    )

    db.session.add(subsection)
    db.session.commit()

    task1 = Task(
        subsection_id=subsection.id,
        title="2 × 2",
        body_text="Ile to jest 2 × 2?",
        difficulty_level=1,
    )

    task2 = Task(
        subsection_id=subsection.id,
        title="2 × 3",
        body_text="Ile to jest 2 × 3?",
        difficulty_level=1,
    )

    task3 = Task(
        subsection_id=subsection.id,
        title="2 × 4",
        body_text="Ile to jest 2 × 4?",
        difficulty_level=2,
    )

    db.session.add_all([task1, task2, task3])
    db.session.commit()

    answer1 = StudentAnswer(
        task_id=task1.id,
        student_id=student.id,
        is_correct=True,
        attempt_number=1,
        submitted_at=datetime.utcnow(),
    )

    answer2 = StudentAnswer(
        task_id=task2.id,
        student_id=student.id,
        is_correct=True,
        attempt_number=1,
        submitted_at=datetime.utcnow(),
    )

    answer3 = StudentAnswer(
        task_id=task3.id,
        student_id=student.id,
        is_correct=False,
        attempt_number=1,
        submitted_at=datetime.utcnow(),
    )

    db.session.add_all([answer1, answer2, answer3])
    db.session.commit()

    response = client.get(
        "/api/student/sections",
        headers={
            "Authorization": "Bearer test-token",
        },
    )

    assert response.status_code == 200

    data = response.get_json()

    assert len(data) == 1

    section_data = data[0]

    assert section_data["id"] == section.id
    assert section_data["title"] == "Tabliczka mnożenia"
    assert section_data["description"] == "Nauka mnożenia"
    assert section_data["index"] == 0

    assert len(section_data["subsections"]) == 1

    subsection_data = section_data["subsections"][0]

    assert subsection_data["id"] == subsection.id
    assert subsection_data["title"] == "Mnożenie przez 2"
    assert subsection_data["description"] == "Podstawowe działania"

    assert subsection_data["total_tasks"] == 3
    assert subsection_data["solved_tasks"] == 2
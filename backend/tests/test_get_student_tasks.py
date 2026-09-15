from datetime import datetime
from types import SimpleNamespace

import pytest

from app import create_app
from app.extensions import db
from app.models.users import User
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.models.task_answer_options import TaskAnswerOption
from app.models.student_answers import StudentAnswer


@pytest.fixture
def client():
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite://",
    })

    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def test_get_student_tasks(client, monkeypatch):
    student = User(
        keycloak_sub="student-sub",
        role="student",
    )

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

    monkeypatch.setattr(
        "app.routes.student._current_user",
        lambda: student,
    )

    section = Section(
        title="Tabliczka mnożenia",
        description="Nauka mnożenia",
        order_index=0,
    )

    db.session.add_all([
        student,
        section,
    ])
    db.session.commit()

    subsection = Subsection(
        section_id=section.id,
        title="Mnożenie przez 2",
        description="Podstawowe działania",
        order_index=0,
    )

    next_subsection = Subsection(
        section_id=section.id,
        title="Mnożenie przez 3",
        description="Kolejny etap",
        order_index=1,
    )

    db.session.add_all([
        subsection,
        next_subsection,
    ])
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
        difficulty_level=1,
    )

    db.session.add_all([
        task1,
        task2,
        task3,
    ])
    db.session.commit()

    answer = StudentAnswer(
        task_id=task1.id,
        student_id=student.id,
        is_correct=True,
        attempt_number=1,
        submitted_at=datetime.utcnow(),
    )

    db.session.add(answer)
    db.session.commit()

    response = client.get(
        f"/api/student/subsections/{subsection.id}/tasks",
        headers={
            "Authorization": "Bearer test-token",
        },
    )

    assert response.status_code == 200

    data = response.get_json()

    assert data["id"] == subsection.id
    assert data["title"] == "Mnożenie przez 2"
    assert data["description"] == "Podstawowe działania"

    assert data["section_id"] == section.id
    assert data["section_title"] == "Tabliczka mnożenia"
    assert data["section_index"] == 0

    assert data["next_subsection_id"] == next_subsection.id

    assert len(data["tasks"]) == 3

    assert data["tasks"][0]["id"] == task1.id
    assert data["tasks"][0]["difficulty_level"] == 1
    assert data["tasks"][0]["status"] == "done"

    assert data["tasks"][1]["id"] == task2.id
    assert data["tasks"][1]["difficulty_level"] == 1
    assert data["tasks"][1]["status"] == "current"

    assert data["tasks"][2]["id"] == task3.id
    assert data["tasks"][2]["difficulty_level"] == 1
    assert data["tasks"][2]["status"] == "todo"


def test_get_student_tasks_subsection_not_found(client, monkeypatch):
    student = User(
        keycloak_sub="student-sub",
        role="student",
    )

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

    monkeypatch.setattr(
        "app.routes.student._current_user",
        lambda: student,
    )

    response = client.get(
        "/api/student/subsections/9999/tasks",
        headers={
            "Authorization": "Bearer test-token",
        },
    )

    assert response.status_code == 404

def test_unlocked_new_tasks(client, monkeypatch):
    student = User(
        keycloak_sub="student-sub",
        role="student",
    )

    monkeypatch.setattr(
        "app.middleware.auth.jwks_client.get_signing_key_from_jwt",
        lambda token: SimpleNamespace(key="test-key"),
    )

    monkeypatch.setattr(
        "app.routes.student._current_user",
        lambda: student,
    )

    monkeypatch.setattr(
        "app.middleware.auth.jwt.decode",
        lambda *args, **kwargs: {
            "iss": "http://keycloak:8080/realms/matematyka-app",
            "sub": "student-sub",
            "realm_access": {"roles": ["student"]},
        },
    )

    section = Section(
        title="Tabliczka mnożenia",
        description="Nauka mnożenia",
        order_index=0,
    )

    db.session.add_all([
        student,
        section,
    ])
    db.session.commit()

    subsection = Subsection(
        section_id=section.id,
        title="Mnożenie przez 2",
        description="Podstawowe działania",
        order_index=0,
    )

    db.session.add(subsection)
    db.session.commit()

    task1 = Task(
        subsection_id=subsection.id,
        title="2 × 2",
        body_text="Ile to jest 2 × 2?",
        difficulty_level=1,
        type="short_answer",
        accepted_answers=["4"],
    )

    task2 = Task(
        subsection_id=subsection.id,
        title="2 × 3",
        body_text="Ile to jest 2 × 3?",
        difficulty_level=1,
        type="short_answer",
        accepted_answers=["6"],
    )

    task3 = Task(
        subsection_id=subsection.id,
        title="2 × 4",
        body_text="Ile to jest 2 × 4?",
        difficulty_level=2,
        type="short_answer",
        accepted_answers=["8"],
    )

    db.session.add_all([
        task1,
        task2,
        task3,
    ])
    db.session.commit()

    answers = [
        (task1, "4"),
        (task2, "6"),
        (task3, "8"),
    ]

    response = client.get(
        f"/api/student/subsections/{subsection.id}/tasks", 
        headers={
            "Authorization": "Bearer test-token",
        },
    )

    assert response.status_code == 200
    data = response.get_json()
    assert len(data["tasks"]) == 2

    for idx, (task, answer_text) in enumerate(answers):
        response = client.post(
            f"/api/student/tasks/{task.id}/answers",
            json={"answer_text": answer_text},
            headers={
                "Authorization": "Bearer test-token",
            },
        )

        assert response.status_code == 200
        assert response.json["is_correct"] is True
        assert response.json["attempt_number"] == 1

        if (idx == 1):
            assert response.json["unlocked_difficulty"] == 2

    saved_answers = StudentAnswer.query.filter_by(
        student_id=student.id,
    ).order_by(StudentAnswer.task_id).all()

    assert len(saved_answers) == 3
    assert all(answer.is_correct for answer in saved_answers)

    response = client.get(
        f"/api/student/subsections/{subsection.id}/tasks", 
        headers={
            "Authorization": "Bearer test-token",
        },
    )
    data = response.get_json()
    assert len(data["tasks"]) == 3

def test_wrong_answer_does_not_unlock_new_tasks(client, monkeypatch):
    student = User(keycloak_sub="student-sub", role="student")
    monkeypatch.setattr("app.routes.student._current_user", lambda: student)
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

    section = Section(title="Tabliczka mnożenia", order_index=0)
    db.session.add_all([student, section])
    db.session.commit()

    subsection = Subsection(
        section_id=section.id,
        title="Mnożenie przez 2",
        order_index=0,
    )
    db.session.add(subsection)
    db.session.commit()

    task1 = Task(
        subsection_id=subsection.id,
        title="2 × 2",
        body_text="Ile to jest 2 × 2?",
        difficulty_level=1,
        type="short_answer",
        accepted_answers=["4"],
    )
    task2 = Task(
        subsection_id=subsection.id,
        title="2 × 3",
        body_text="Ile to jest 2 × 3?",
        difficulty_level=1,
        type="short_answer",
        accepted_answers=["6"],
    )
    task3 = Task(
        subsection_id=subsection.id,
        title="2 × 4",
        body_text="Ile to jest 2 × 4?",
        difficulty_level=2,
        type="short_answer",
        accepted_answers=["8"],
    )
    db.session.add_all([task1, task2, task3])
    db.session.commit()

    response = client.post(
        f"/api/student/tasks/{task1.id}/answers",
        json={"answer_text": "5"},
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 200
    assert response.json["is_correct"] is False

    response = client.get(
        f"/api/student/subsections/{subsection.id}/tasks",
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 200
    assert [task["id"] for task in response.json["tasks"]] == [
        task1.id,
        task2.id,
    ]

    response = client.post(
        f"/api/student/tasks/{task1.id}/answers",
        json={"answer_text": "4"},
        headers={"Authorization": "Bearer test-token"},
    )
    assert response.json["is_correct"] is True
    assert response.json["attempt_number"] == 2

    response = client.post(
        f"/api/student/tasks/{task2.id}/answers",
        json={"answer_text": "6"},
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 200
    assert response.json["unlocked_difficulty"] == 2


def test_single_choice_answer_unlocks_new_tasks(client, monkeypatch):
    student = User(keycloak_sub="student-sub", role="student")
    monkeypatch.setattr("app.routes.student._current_user", lambda: student)
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

    section = Section(title="Tabliczka mnożenia", order_index=0)
    db.session.add_all([student, section])
    db.session.commit()

    subsection = Subsection(
        section_id=section.id,
        title="Mnożenie przez 2",
        order_index=0,
    )
    db.session.add(subsection)
    db.session.commit()

    task1 = Task(
        subsection_id=subsection.id,
        title="2 × 2",
        body_text="Ile to jest 2 × 2?",
        difficulty_level=1,
        type="single_choice",
    )
    task2 = Task(
        subsection_id=subsection.id,
        title="2 × 4",
        body_text="Ile to jest 2 × 4?",
        difficulty_level=2,
        type="short_answer",
        accepted_answers=["8"],
    )
    db.session.add_all([task1, task2])
    db.session.commit()

    correct_option = TaskAnswerOption(
        task_id=task1.id,
        option_text="4",
        is_correct=True,
        order_index=1,
    )
    wrong_option = TaskAnswerOption(
        task_id=task1.id,
        option_text="5",
        is_correct=False,
        order_index=2,
    )
    db.session.add_all([correct_option, wrong_option])
    db.session.commit()

    response = client.post(
        f"/api/student/tasks/{task1.id}/answers",
        json={"selected_option_id": correct_option.id},
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 200
    assert response.json["is_correct"] is True
    assert response.json["attempt_number"] == 1
    assert response.json["unlocked_difficulty"] == 2

    response = client.get(
        f"/api/student/subsections/{subsection.id}/tasks",
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 200
    assert [task["id"] for task in response.json["tasks"]] == [
        task1.id,
        task2.id,
    ]

    
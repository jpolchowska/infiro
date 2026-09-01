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
from app.models.leveling_test_attempts import LevelingTestAttempt


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


def test_get_student_stats(client, monkeypatch):
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

    section1 = Section(
        title="Tabliczka mnożenia",
        description="Nauka mnożenia",
        order_index=0,
    )

    section2 = Section(
        title="Dzielenie",
        description="Nauka dzielenia",
        order_index=1,
    )

    db.session.add_all([
        student,
        section1,
        section2,
    ])
    db.session.commit()

    subsection1 = Subsection(
        section_id=section1.id,
        title="Mnożenie przez 2",
        description="Podstawowe działania",
        order_index=0,
    )

    subsection2 = Subsection(
        section_id=section1.id,
        title="Mnożenie przez 3",
        description="Kolejny etap",
        order_index=1,
    )

    subsection3 = Subsection(
        section_id=section2.id,
        title="Dzielenie przez 2",
        description="Podstawowe dzielenie",
        order_index=0,
    )

    db.session.add_all([
        subsection1,
        subsection2,
        subsection3,
    ])
    db.session.commit()

    task1 = Task(
        subsection_id=subsection1.id,
        title="2 × 2",
        body_text="Ile to jest 2 × 2?",
        difficulty_level=1,
    )

    task2 = Task(
        subsection_id=subsection1.id,
        title="2 × 3",
        body_text="Ile to jest 2 × 3?",
        difficulty_level=1,
    )

    task3 = Task(
        subsection_id=subsection2.id,
        title="3 × 3",
        body_text="Ile to jest 3 × 3?",
        difficulty_level=1,
    )

    task4 = Task(
        subsection_id=subsection3.id,
        title="4 ÷ 2",
        body_text="Ile to jest 4 ÷ 2?",
        difficulty_level=1,
    )

    db.session.add_all([
        task1,
        task2,
        task3,
        task4,
    ])
    db.session.commit()

    # subsection1:
    # jedna poprawna i jedna błędna odpowiedź
    answer1 = StudentAnswer(
        task_id=task1.id,
        student_id=student.id,
        is_correct=True,
        attempt_number=1,
        submitted_at=datetime(2026, 8, 31, 10, 0),
    )

    answer2 = StudentAnswer(
        task_id=task2.id,
        student_id=student.id,
        is_correct=False,
        attempt_number=1,
        submitted_at=datetime(2026, 8, 31, 10, 5),
    )

    # subsection3:
    # poprawna odpowiedź -> podsekcja ukończona
    answer3 = StudentAnswer(
        task_id=task4.id,
        student_id=student.id,
        is_correct=True,
        attempt_number=1,
        submitted_at=datetime(2026, 8, 31, 11, 0),
    )

    # subsection2:
    # ostatnia aktywność, ale odpowiedź błędna
    # -> podsekcja nadal nieukończona
    answer4 = StudentAnswer(
        task_id=task3.id,
        student_id=student.id,
        is_correct=False,
        attempt_number=1,
        submitted_at=datetime(2026, 8, 31, 13, 0),
    )

    db.session.add_all([
        answer1,
        answer2,
        answer3,
        answer4,
    ])
    db.session.commit()

    # Ostatni test poziomujący
    leveling_test = LevelingTestAttempt(
        student_id=student.id,
        score=9,
        max_score=12,
        completed_at=datetime(2026, 8, 31, 14, 0),
    )

    db.session.add(leveling_test)
    db.session.commit()

    response = client.get(
        "/api/student/stats",
        headers={
            "Authorization": "Bearer test-token",
        },
    )

    assert response.status_code == 200

    data = response.get_json()

    # ---------------------------------------------------------
    # Overall statistics
    # ---------------------------------------------------------

    # Poprawnie rozwiązane zadania:
    # task1 + task4 = 2
    assert data["solved_tasks"] == 2

    # Wszystkich zadań:
    # task1, task2, task3, task4 = 4
    assert data["total_tasks"] == 4

    # Wszystkie próby:
    # 2 poprawne + 2 błędne = 4
    # 2 / 4 * 100 = 50%
    assert data["accuracy"] == 50

    # Poprawne odpowiedzi pojawiły się w:
    # section1 oraz section2
    assert data["started_sections"] == 2

    # ---------------------------------------------------------
    # Current subsection
    # ---------------------------------------------------------

    assert data["current"] is not None

    # Ostatnia aktywność była w subsection2
    assert data["current"]["subsection_id"] == subsection2.id

    assert data["current"]["subsection_title"] == "Mnożenie przez 3"

    assert data["current"]["section_title"] == "Tabliczka mnożenia"

    assert data["current"]["section_index"] == 0

    # W subsection2 zadanie nie zostało rozwiązane poprawnie
    assert data["current"]["solved_tasks"] == 0

    assert data["current"]["total_tasks"] == 1

    # ---------------------------------------------------------
    # Recent sections
    # ---------------------------------------------------------

    assert len(data["recent_sections"]) == 2

    # Ostatnia aktywność była w section1
    # (subsection2, godz. 13:00)
    assert data["recent_sections"][0]["section_id"] == section1.id
    assert data["recent_sections"][0]["section_title"] == "Tabliczka mnożenia"
    assert data["recent_sections"][0]["section_index"] == 0

    # Wcześniejsza aktywność była w section2
    # (subsection3, godz. 11:00)
    assert data["recent_sections"][1]["section_id"] == section2.id
    assert data["recent_sections"][1]["section_title"] == "Dzielenie"
    assert data["recent_sections"][1]["section_index"] == 1

    # ---------------------------------------------------------
    # Last leveling test
    # ---------------------------------------------------------

    assert data["last_leveling_test"] is not None

    assert data["last_leveling_test"]["score"] == 9

    assert data["last_leveling_test"]["total"] == 12

    assert (
        data["last_leveling_test"]["completed_at"]
        == "2026-08-31T14:00:00"
    )
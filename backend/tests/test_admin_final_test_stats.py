import copy

import pytest

from app.clock import utc_now
from app.extensions import db
from app.models.section_test_answers import SectionTestAnswer
from app.models.section_test_attempts import SectionTestAttempt
from app.models.section_test_questions import SectionTestQuestion
from app.models.sections import Section
from app.models.users import User
from tests.test_final_test import IMPORT_PAYLOAD

HEADERS = {"Authorization": "Bearer test-token"}


def _payload_with_three_questions():
    payload = copy.deepcopy(IMPORT_PAYLOAD)
    payload[0]["questions"].append(copy.deepcopy(payload[0]["questions"][0]) | {"content_key": "final-ulamki-3"})
    return payload


@pytest.fixture
def section(client, login):
    login("admin-sub", ["admin"])
    section = Section(title="Ułamki", order_index=1)
    db.session.add(section)
    db.session.commit()
    return section


@pytest.fixture
def people():
    teacher = User(keycloak_sub="teacher-sub", role="teacher", username="nauczyciel")
    db.session.add(teacher)
    db.session.flush()
    own = [User(keycloak_sub=f"own-{index}", role="student", teacher_id=teacher.id) for index in range(2)]
    other = User(keycloak_sub="other", role="student")
    db.session.add_all([*own, other])
    db.session.commit()
    return {"own": own, "other": other}


def _import(client, section, payload):
    response = client.post(f"/api/admin/sections/{section.id}/final-test/import", json=payload, headers=HEADERS)
    assert response.status_code == 201


def _attempt(section, student, results):
    attempt = SectionTestAttempt(
        student_id=student.id,
        section_id=section.id,
        score=sum(results.values()),
        max_score=len(results),
        completed_at=utc_now(),
    )
    db.session.add(attempt)
    db.session.flush()
    for content_key, is_correct in results.items():
        question = SectionTestQuestion.query.filter_by(content_key=content_key).one()
        db.session.add(SectionTestAnswer(attempt_id=attempt.id, question_id=question.id, is_correct=is_correct))
    db.session.commit()


def _question_id(content_key):
    return SectionTestQuestion.query.filter_by(content_key=content_key).one().id


def _stats(client, section):
    preview = client.get(f"/api/admin/sections/{section.id}/final-test", headers=HEADERS).json
    return {key: value for key, value in preview.items() if key not in ("section_id", "section_title", "questions")}


def test_admin_sees_statistics_of_all_students(client, section, people):
    _import(client, section, IMPORT_PAYLOAD)
    first, _ = people["own"]
    _attempt(section, first, {"final-ulamki-1": True, "final-ulamki-2": False})
    _attempt(section, first, {"final-ulamki-1": True, "final-ulamki-2": True})
    _attempt(section, people["other"], {"final-ulamki-1": False, "final-ulamki-2": False})

    assert _stats(client, section) == {
        "students_attempted": 2,
        "students_total": 3,
        "average_attempts": 1.5,
        "average_score": 50,
        "easiest": {"question_ids": [_question_id("final-ulamki-1")], "correct_rate": 67},
        "hardest": {"question_ids": [_question_id("final-ulamki-2")], "correct_rate": 33},
    }


def test_teacher_sees_statistics_of_own_students_only(client, login, section, people):
    _import(client, section, IMPORT_PAYLOAD)
    first, _ = people["own"]
    _attempt(section, first, {"final-ulamki-1": True, "final-ulamki-2": False})
    _attempt(section, first, {"final-ulamki-1": True, "final-ulamki-2": True})
    _attempt(section, people["other"], {"final-ulamki-1": False, "final-ulamki-2": False})
    login("teacher-sub", ["teacher"])

    assert _stats(client, section) == {
        "students_attempted": 1,
        "students_total": 2,
        "average_attempts": 2.0,
        "average_score": 75,
        "easiest": {"question_ids": [_question_id("final-ulamki-1")], "correct_rate": 100},
        "hardest": {"question_ids": [_question_id("final-ulamki-2")], "correct_rate": 50},
    }


def test_questions_with_the_same_result_are_listed_together(client, section, people):
    _import(client, section, _payload_with_three_questions())
    _attempt(section, people["other"], {"final-ulamki-1": True, "final-ulamki-2": False, "final-ulamki-3": True})

    stats = _stats(client, section)

    assert stats["easiest"] == {
        "question_ids": [_question_id("final-ulamki-1"), _question_id("final-ulamki-3")],
        "correct_rate": 100,
    }
    assert stats["hardest"] == {"question_ids": [_question_id("final-ulamki-2")], "correct_rate": 0}


def test_easiest_and_hardest_are_hidden_when_every_question_has_the_same_result(client, section, people):
    _import(client, section, IMPORT_PAYLOAD)
    _attempt(section, people["other"], {"final-ulamki-1": True, "final-ulamki-2": True})

    stats = _stats(client, section)

    assert (stats["average_score"], stats["easiest"], stats["hardest"]) == (100, None, None)


def test_statistics_are_empty_before_anyone_takes_the_test(client, section, people):
    _import(client, section, IMPORT_PAYLOAD)

    assert _stats(client, section) == {
        "students_attempted": 0,
        "students_total": 3,
        "average_attempts": None,
        "average_score": None,
        "easiest": None,
        "hardest": None,
    }

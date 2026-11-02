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


@pytest.fixture
def section(client, login):
    login("admin-sub", ["admin"])
    section = Section(title="Ułamki", order_index=1)
    db.session.add(section)
    db.session.commit()
    return section


def _import(client, section, payload, dry_run=False):
    url = f"/api/admin/sections/{section.id}/final-test/import" + ("?dry_run=true" if dry_run else "")
    return client.post(url, json=payload, headers=HEADERS)


def _answer(section, content_key):
    student = User(keycloak_sub="student-sub", role="student")
    db.session.add(student)
    db.session.flush()
    attempt = SectionTestAttempt(
        student_id=student.id, section_id=section.id, score=1, max_score=2, completed_at=utc_now()
    )
    db.session.add(attempt)
    db.session.flush()
    question = SectionTestQuestion.query.filter_by(content_key=content_key).one()
    db.session.add(SectionTestAnswer(attempt_id=attempt.id, question_id=question.id, answer_text="5", is_correct=True))
    db.session.commit()


def _keys(section):
    questions = SectionTestQuestion.query.filter_by(section_id=section.id).order_by(SectionTestQuestion.order_index)
    return [(question.content_key, question.order_index) for question in questions]


def test_question_without_content_key_is_rejected(client, section):
    payload = copy.deepcopy(IMPORT_PAYLOAD)
    del payload[0]["questions"][0]["content_key"]

    response = _import(client, section, payload)

    assert response.status_code == 400
    assert any("content_key" in error for error in response.json["errors"])
    assert SectionTestQuestion.query.count() == 0


def test_reimporting_the_same_file_does_not_duplicate_questions(client, section):
    _import(client, section, IMPORT_PAYLOAD)
    response = _import(client, section, IMPORT_PAYLOAD)

    assert response.status_code == 201
    assert _keys(section) == [("final-ulamki-1", 1), ("final-ulamki-2", 2)]


def test_reimport_removes_questions_missing_from_the_file(client, section):
    _import(client, section, IMPORT_PAYLOAD)
    _answer(section, "final-ulamki-1")
    payload = copy.deepcopy(IMPORT_PAYLOAD)
    del payload[0]["questions"][0]

    response = _import(client, section, payload)

    deleted = response.json["summary"]["questions"]["deleted"]
    assert [(question["content_key"], question["answer_count"]) for question in deleted] == [("final-ulamki-1", 1)]
    assert _keys(section) == [("final-ulamki-2", 1)]
    assert SectionTestAnswer.query.count() == 0
    assert SectionTestAttempt.query.count() == 1


def test_dry_run_reports_changes_without_saving_them(client, section):
    _import(client, section, IMPORT_PAYLOAD)
    payload = copy.deepcopy(IMPORT_PAYLOAD)
    payload[0]["questions"][1] = copy.deepcopy(payload[0]["questions"][1]) | {"content_key": "final-ulamki-3"}

    response = _import(client, section, payload, dry_run=True)

    assert response.status_code == 200
    questions = response.json["summary"]["questions"]
    assert (questions["created"], questions["updated"]) == (1, 1)
    assert [question["content_key"] for question in questions["deleted"]] == ["final-ulamki-2"]
    assert _keys(section) == [("final-ulamki-1", 1), ("final-ulamki-2", 2)]

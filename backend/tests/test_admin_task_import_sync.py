import copy

import pytest

from app.clock import utc_now
from app.extensions import db
from app.models.ebooks import Ebook
from app.models.section_test_questions import SectionTestQuestion
from app.models.sections import Section
from app.models.student_answers import StudentAnswer
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.models.users import User
from tests.test_admin_task_import import _payload

HEADERS = {"Authorization": "Bearer test-token"}


def _import(client, payload, dry_run=False):
    url = "/api/admin/tasks/import" + ("?dry_run=true" if dry_run else "")
    return client.post(url, json=payload, headers=HEADERS)


def _keys():
    return [task.content_key for task in Task.query.order_by(Task.order_index).all()]


def _answer(task_key):
    student = User.query.filter_by(keycloak_sub="student-sub").first()
    if student is None:
        student = User(keycloak_sub="student-sub", role="student")
        db.session.add(student)
        db.session.flush()
    task = Task.query.filter_by(content_key=task_key).one()
    db.session.add(StudentAnswer(
        task_id=task.id, student_id=student.id, is_correct=True, attempt_number=1, submitted_at=utc_now(),
    ))
    db.session.commit()


@pytest.fixture
def course(client, login):
    login("admin-sub", ["admin"])
    payload = _payload()
    payload[0]["subsections"].append({
        "subsection": "Dzielenie",
        "tasks": [copy.deepcopy(payload[0]["subsections"][0]["tasks"][0]) | {"content_key": "dzielenie-01"}],
    })
    payload.append({
        "section": "Ułamki",
        "subsections": [{
            "subsection": "Kawałki",
            "tasks": [copy.deepcopy(payload[0]["subsections"][0]["tasks"][1]) | {"content_key": "ulamki-01"}],
        }],
    })
    assert _import(client, payload).status_code == 201
    return payload


def test_reimport_removes_tasks_missing_from_the_file(client, course):
    _answer("latwe-mnozenie-02")
    payload = copy.deepcopy(course)
    del payload[0]["subsections"][0]["tasks"][1]

    response = _import(client, payload)

    assert response.status_code == 201
    deleted = response.json["summary"]["tasks"]["deleted"]
    assert [(task["content_key"], task["answer_count"]) for task in deleted] == [("latwe-mnozenie-02", 1)]
    assert Task.query.filter_by(content_key="latwe-mnozenie-02").first() is None
    assert StudentAnswer.query.count() == 0
    subsection = Subsection.query.filter_by(title="Łatwe mnożenie").one()
    remaining = Task.query.filter_by(subsection_id=subsection.id).order_by(Task.order_index).all()
    assert [(task.content_key, task.order_index) for task in remaining] == [
        ("latwe-mnozenie-01", 1),
        ("latwe-mnozenie-03", 2),
    ]


def test_dry_run_reports_changes_without_saving_them(client, course):
    payload = copy.deepcopy(course)
    del payload[1]
    payload[0]["subsections"][0]["tasks"].append(
        copy.deepcopy(payload[0]["subsections"][0]["tasks"][0]) | {"content_key": "nowe-01"}
    )

    response = _import(client, payload, dry_run=True)

    assert response.status_code == 200
    summary = response.json["summary"]
    assert (summary["tasks"]["created"], summary["tasks"]["updated"]) == (1, 4)
    assert [section["title"] for section in summary["sections"]["deleted"]] == ["Ułamki"]
    assert summary["sections"]["deleted"][0]["task_count"] == 1
    assert "nowe-01" not in _keys()
    assert Section.query.filter_by(title="Ułamki").first() is not None


def test_reimport_removes_a_missing_subsection_with_its_ebook(client, course):
    dzielenie = Subsection.query.filter_by(title="Dzielenie").one()
    db.session.add(Ebook(subsection_id=dzielenie.id, title="Dzielenie", content=[]))
    db.session.commit()
    payload = copy.deepcopy(course)
    del payload[0]["subsections"][1]

    response = _import(client, payload)

    deleted = response.json["summary"]["subsections"]["deleted"]
    assert [(item["title"], item["task_count"], item["has_ebook"]) for item in deleted] == [("Dzielenie", 1, True)]
    assert Subsection.query.filter_by(title="Dzielenie").first() is None
    assert Ebook.query.count() == 0
    assert "dzielenie-01" not in _keys()


def test_reimport_removes_a_missing_section_with_its_final_test(client, course):
    ulamki = Section.query.filter_by(title="Ułamki").one()
    db.session.add(SectionTestQuestion(section_id=ulamki.id, prompt="Ile to 1/2 + 1/2?", order_index=1))
    db.session.commit()
    payload = copy.deepcopy(course)
    del payload[1]

    response = _import(client, payload)

    deleted = response.json["summary"]["sections"]["deleted"]
    assert [(item["title"], item["has_final_test"]) for item in deleted] == [("Ułamki", True)]
    assert Section.query.filter_by(title="Ułamki").first() is None
    assert SectionTestQuestion.query.count() == 0
    assert [section.order_index for section in Section.query.all()] == [1]


def test_task_moved_to_another_subsection_keeps_its_answers(client, course):
    _answer("dzielenie-01")
    payload = copy.deepcopy(course)
    moved = payload[0]["subsections"][1]["tasks"].pop()
    payload[0]["subsections"][0]["tasks"].append(moved)
    del payload[0]["subsections"][1]

    response = _import(client, payload)

    summary = response.json["summary"]
    assert summary["tasks"]["deleted"] == []
    assert summary["subsections"]["deleted"][0]["task_count"] == 0
    task = Task.query.filter_by(content_key="dzielenie-01").one()
    assert db.session.get(Subsection, task.subsection_id).title == "Łatwe mnożenie"
    assert StudentAnswer.query.count() == 1


def test_teacher_cannot_preview_an_import(client, login, course):
    login("teacher-sub", ["teacher"])

    assert _import(client, course, dry_run=True).status_code == 403

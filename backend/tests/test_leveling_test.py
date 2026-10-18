from datetime import timedelta

import pytest

from app.clock import utc_now
from app.extensions import db
from app.models.leveling_test_answers import LevelingTestAnswer
from app.models.leveling_test_attempts import LevelingTestAttempt
from app.models.leveling_test_question_sets import LevelingTestQuestionSet
from app.models.leveling_test_section_results import LevelingTestSectionResult
from app.models.sections import Section
from app.models.student_answers import StudentAnswer
from app.models.subsections import Subsection
from app.models.task_answer_options import TaskAnswerOption
from app.models.tasks import Task
from app.models.users import User

HEADERS = {"Authorization": "Bearer test-token"}


def _add_task(subsection, level, task_type="single_choice"):
    task = Task(
        subsection_id=subsection.id,
        title="",
        body_text=f"Zadanie poziomu {level}",
        difficulty_level=level,
        type=task_type,
        accepted_answers=["4"] if task_type == "short_answer" else None,
    )
    db.session.add(task)
    db.session.flush()
    if task_type == "single_choice":
        for index, text in enumerate(("4", "5", "6"), start=1):
            db.session.add(TaskAnswerOption(
                task_id=task.id, option_text=text, is_correct=index == 1, order_index=index,
            ))
    return task


@pytest.fixture
def course():
    full = Section(title="Tabliczka mnożenia", order_index=1)
    partial = Section(title="Ułamki", order_index=2)
    db.session.add_all([full, partial])
    db.session.flush()

    full_subsection = Subsection(section_id=full.id, title="Łatwe mnożenie", order_index=1)
    partial_subsection = Subsection(section_id=partial.id, title="Kawałki całości", order_index=1)
    db.session.add_all([full_subsection, partial_subsection])
    db.session.flush()

    for level in (1, 2, 3):
        for _ in range(3):
            _add_task(full_subsection, level)
    _add_task(full_subsection, 2, "memory")
    _add_task(partial_subsection, 1)
    _add_task(partial_subsection, 1, "short_answer")
    _add_task(partial_subsection, 3)
    db.session.commit()
    return {"full": full, "partial": partial}


@pytest.fixture
def student(client, login):
    login("student-sub", ["student"])
    client.get("/api/student/me", headers=HEADERS)
    return User.query.filter_by(keycloak_sub="student-sub").one()


def _set_questions_per_section(client, login, value):
    login("admin-sub", ["admin"])
    response = client.patch(
        "/api/admin/settings/leveling-test", json={"questions_per_section": value}, headers=HEADERS
    )
    assert response.status_code == 200
    login("student-sub", ["student"])


def _questions_by_section(client):
    response = client.get("/api/student/leveling-test", headers=HEADERS)
    assert response.status_code == 200
    return {section["section_title"]: section["questions"] for section in response.json["sections"]}


def test_default_test_takes_one_task_per_level_from_each_section(client, course, student):
    questions = _questions_by_section(client)

    assert [q["difficulty_level"] for q in questions["Tabliczka mnożenia"]] == [1, 2, 3]
    assert sorted(q["difficulty_level"] for q in questions["Ułamki"]) == [1, 1, 3]


def test_test_grows_with_questions_per_section_setting(client, login, course, student):
    _set_questions_per_section(client, login, 6)

    questions = _questions_by_section(client)["Tabliczka mnożenia"]

    assert [q["difficulty_level"] for q in questions] == [1, 1, 2, 2, 3, 3]
    assert len({q["task_id"] for q in questions}) == 6


def test_section_with_too_few_tasks_gets_fewer_questions(client, login, course, student):
    _set_questions_per_section(client, login, 9)

    questions = _questions_by_section(client)

    assert len(questions["Tabliczka mnożenia"]) == 9
    assert len(questions["Ułamki"]) == 3
    assert len({q["task_id"] for q in questions["Ułamki"]}) == 3


def test_memory_tasks_are_never_used(client, login, course, student):
    _set_questions_per_section(client, login, 9)

    questions = _questions_by_section(client)

    assert all(q["type"] in ("single_choice", "short_answer") for qs in questions.values() for q in qs)


def _correct_answers(client):
    answers = []
    for section_questions in _questions_by_section(client).values():
        for question in section_questions:
            if question["type"] == "single_choice":
                option = TaskAnswerOption.query.filter_by(task_id=question["task_id"], is_correct=True).one()
                answers.append({"task_id": question["task_id"], "selected_option_id": option.id})
            else:
                answers.append({"task_id": question["task_id"], "answer_text": "4"})
    return answers


def test_submit_saves_results_without_counting_towards_progress(client, course, student):
    answers = _correct_answers(client)
    answers[0] = {"task_id": answers[0]["task_id"]}

    response = client.post("/api/student/leveling-test/submit", json={"answers": answers}, headers=HEADERS)

    assert response.status_code == 201
    assert response.json["score"] == 5
    assert response.json["max_score"] == 6
    assert response.json["per_section"] == [
        {"section_id": course["full"].id, "section_title": "Tabliczka mnożenia", "score": 2, "total": 3},
        {"section_id": course["partial"].id, "section_title": "Ułamki", "score": 3, "total": 3},
    ]
    assert StudentAnswer.query.count() == 0
    assert LevelingTestAnswer.query.count() == 6
    assert LevelingTestSectionResult.query.count() == 2

    stats = client.get("/api/student/stats", headers=HEADERS).json
    assert stats["solved_tasks"] == 0
    assert stats["last_leveling_test"]["score"] == 5

    history = client.get("/api/student/leveling-test/history", headers=HEADERS).json
    assert history[0]["score"] == 5
    assert history[0]["completed_at"] == stats["last_leveling_test"]["completed_at"]
    assert history[0]["per_section"][1]["section_title"] == "Ułamki"


def _me(client):
    return client.get("/api/student/me", headers=HEADERS).json


def _complete_test_days_ago(student, days):
    completed_at = utc_now() - timedelta(days=days)
    db.session.add(LevelingTestAttempt(student_id=student.id, score=1, max_score=1, completed_at=completed_at))
    student.leveling_test_completed_at = completed_at
    db.session.commit()


def test_new_student_must_take_the_test(client, student):
    me = _me(client)

    assert me["leveling_test_completed"] is False
    assert me["leveling_test"]["status"] == "not_taken"


@pytest.mark.parametrize("days_ago,status,completed", [
    (1, "up_to_date", True),
    (29, "up_to_date", True),
    (31, "due", True),
    (36, "due", True),
    (38, "overdue", False),
])
def test_test_comes_back_after_the_interval(client, student, days_ago, status, completed):
    _complete_test_days_ago(student, days_ago)

    me = _me(client)

    assert me["leveling_test"]["status"] == status
    assert me["leveling_test_completed"] is completed


def test_settings_change_the_schedule(client, login, student):
    _complete_test_days_ago(student, 20)
    login("admin-sub", ["admin"])
    client.patch(
        "/api/admin/settings/leveling-test",
        json={"interval_days": 14, "completion_window_days": 3},
        headers=HEADERS,
    )
    login("student-sub", ["student"])

    assert _me(client)["leveling_test"]["status"] == "overdue"


def test_admin_reads_default_settings(client, login, course):
    login("admin-sub", ["admin"])

    response = client.get("/api/admin/settings/leveling-test", headers=HEADERS)

    assert response.status_code == 200
    assert response.json == {
        "questions_per_section": 3,
        "interval_days": 30,
        "completion_window_days": 7,
        "section_count": 2,
        "options": {
            "questions_per_section": [3, 6, 9],
            "interval_days": [14, 30, 60, 90],
            "completion_window_days": {"min": 1, "max": 14},
        },
    }


@pytest.mark.parametrize("payload", [
    {"questions_per_section": 4},
    {"questions_per_section": True},
    {"interval_days": 31},
    {"interval_days": 30.0},
    {"completion_window_days": 0},
    {"completion_window_days": 15},
    {"completion_window_days": "7"},
])
def test_invalid_settings_are_rejected(client, login, payload):
    login("admin-sub", ["admin"])

    response = client.patch("/api/admin/settings/leveling-test", json=payload, headers=HEADERS)

    assert response.status_code == 400
    assert len(response.json["errors"]) == 1


def test_only_admin_can_change_settings(client, login):
    login("teacher-sub", ["ROLE_TEACHER"])

    response = client.patch("/api/admin/settings/leveling-test", json={"interval_days": 14}, headers=HEADERS)

    assert response.status_code == 403


def test_deleting_content_keeps_leveling_history(client, login, course, student):
    client.post("/api/student/leveling-test/submit", json={"answers": _correct_answers(client)}, headers=HEADERS)
    login("admin-sub", ["admin"])

    response = client.delete(f"/api/admin/sections/{course['partial'].id}", headers=HEADERS)

    assert response.status_code == 204
    assert LevelingTestAttempt.query.count() == 1
    assert LevelingTestAnswer.query.count() == 3
    orphaned = LevelingTestSectionResult.query.filter_by(section_title="Ułamki").one()
    assert orphaned.section_id is None


def _task_ids(test):
    return [q["task_id"] for section in test["sections"] for q in section["questions"]]


def _get_test(client):
    return client.get("/api/student/leveling-test", headers=HEADERS).json


def _submit(client, answers):
    return client.post("/api/student/leveling-test/submit", json={"answers": answers}, headers=HEADERS)


def test_reopening_the_test_returns_the_same_questions(client, course, student):
    first = _task_ids(_get_test(client))
    second = _task_ids(_get_test(client))

    assert first == second
    assert LevelingTestQuestionSet.query.count() == 1


def test_new_questions_are_drawn_after_submitting(client, course, student):
    _submit(client, _correct_answers(client))

    _get_test(client)

    assert LevelingTestQuestionSet.query.count() == 2
    assert LevelingTestQuestionSet.query.filter(LevelingTestQuestionSet.attempt_id.is_(None)).count() == 1


def test_expired_question_set_is_replaced(client, course, student):
    _get_test(client)
    question_set = LevelingTestQuestionSet.query.one()
    question_set.created_at = utc_now() - timedelta(hours=25)
    db.session.commit()

    _get_test(client)

    assert LevelingTestQuestionSet.query.count() == 2


def test_question_set_with_deleted_task_is_replaced(client, login, course, student):
    task_id = _task_ids(_get_test(client))[0]
    login("admin-sub", ["admin"])
    client.delete(f"/api/admin/tasks/{task_id}", headers=HEADERS)
    login("student-sub", ["student"])

    assert task_id not in _task_ids(_get_test(client))


def test_answers_to_an_older_open_test_are_accepted(client, course, student):
    answers = _correct_answers(client)
    older = LevelingTestQuestionSet.query.one()
    older.created_at = utc_now() - timedelta(hours=25)
    newer = LevelingTestQuestionSet(student_id=student.id, task_ids=older.task_ids[:-1])
    db.session.add(newer)
    db.session.commit()

    response = _submit(client, answers)

    assert response.status_code == 201
    assert db.session.get(LevelingTestQuestionSet, older.id).attempt_id == response.json["attempt_id"]
    assert db.session.get(LevelingTestQuestionSet, newer.id).attempt_id is None


@pytest.mark.parametrize("change,error", [
    (lambda answers: answers[:-1], "Answers do not match the current leveling test"),
    (lambda answers: answers[:1], "Answers do not match the current leveling test"),
    (lambda answers: answers + [answers[0]], "Each task can be answered only once"),
    (lambda answers: answers[:-1] + [{"task_id": 99999}], "Answers do not match the current leveling test"),
    (lambda answers: answers[:-1] + [{"task_id": "1"}], "Each answer must have an integer task_id"),
])
def test_incomplete_or_foreign_answers_are_rejected(client, course, student, change, error):
    answers = _correct_answers(client)

    response = _submit(client, change(answers))

    assert response.status_code == 400
    assert response.json == {"error": error}
    assert LevelingTestAttempt.query.count() == 0


def test_test_cannot_be_submitted_without_opening_it(client, course, student):
    task = Task.query.filter_by(type="single_choice").first()

    response = _submit(client, [{"task_id": task.id}])

    assert response.status_code == 400
    assert response.json == {"error": "Answers do not match the current leveling test"}


def test_submitted_test_cannot_be_submitted_again(client, course, student):
    answers = _correct_answers(client)
    _submit(client, answers)

    response = _submit(client, answers)

    assert response.status_code == 400
    assert LevelingTestAttempt.query.count() == 1

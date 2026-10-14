from datetime import timedelta

import pytest

from app.clock import utc_now
from app.extensions import db
from app.models.student_answers import StudentAnswer
from app.models.task_answer_options import TaskAnswerOption
from app.models.tasks import Task
from app.models.users import User

HEADERS = {"Authorization": "Bearer test-token"}


def _choice(key, level, prompt):
    return {
        "content_key": key,
        "type": "single_choice",
        "difficulty": level,
        "themes": {
            "default": {
                "prompt": prompt,
                "options": [{"text": "1", "correct": True}, {"text": "2"}, {"text": "3"}],
            },
        },
    }


CONTENT = [
    {
        "section": "Mnożenie",
        "subsections": [
            {
                "subsection": "Łatwe mnożenie",
                "tasks": [
                    _choice("m-1", 1, "Mnożenie 1"),
                    _choice("m-2", 2, "Mnożenie 2"),
                    _choice("m-3", 3, "Mnożenie 3"),
                ],
            },
            {
                "subsection": "Trudne mnożenie",
                "tasks": [_choice("m-4", 1, "Mnożenie 4")],
            },
        ],
    },
    {
        "section": "Ułamki",
        "subsections": [{"subsection": "Kawałki", "tasks": [_choice("u-1", 1, "Ułamki 1")]}],
    },
]

FINAL_TEST = [{
    "section": "Mnożenie",
    "questions": [{
        "content_key": "final-1",
        "type": "short_answer",
        "themes": {"default": {"prompt": "Ile to 2 · 3?", "answers": ["6"]}},
    }],
}]


def _answer(student, key, is_correct, attempt=1, days_ago=1):
    task = Task.query.filter_by(content_key=key).one()
    db.session.add(StudentAnswer(
        task_id=task.id,
        student_id=student.id,
        is_correct=is_correct,
        attempt_number=attempt,
        submitted_at=utc_now() - timedelta(days=days_ago),
    ))


@pytest.fixture
def report_data(client, login):
    login("admin-sub", ["admin"])
    client.post("/api/admin/tasks/import", json=CONTENT, headers=HEADERS)
    client.post("/api/admin/sections/1/final-test/import", json=FINAL_TEST, headers=HEADERS)

    login("teacher-sub", ["ROLE_TEACHER"])
    client.get("/api/admin/students", headers=HEADERS)
    teacher = User.query.filter_by(keycloak_sub="teacher-sub").one()
    teacher.first_name, teacher.last_name = "Anna", "Nowak"

    login("student-sub", ["student"])
    client.get("/api/student/me", headers=HEADERS)
    client.patch("/api/student/interest", json={"interest": "sport"}, headers=HEADERS)
    student = User.query.filter_by(keycloak_sub="student-sub").one()
    student.teacher_id = teacher.id
    db.session.commit()

    questions = client.get("/api/student/leveling-test", headers=HEADERS).json["sections"]
    answers = []
    for section in questions:
        for question in section["questions"]:
            wrong = TaskAnswerOption.query.filter_by(task_id=question["task_id"], is_correct=False).first()
            answers.append({"task_id": question["task_id"], "selected_option_id": wrong.id})
    attempt_id = client.post(
        "/api/student/leveling-test/submit", json={"answers": answers}, headers=HEADERS
    ).json["attempt_id"]
    client.post(
        "/api/student/sections/1/final-test/submit",
        json={"answers": [{"question_id": 1, "answer_text": "6"}]},
        headers=HEADERS,
    )

    _answer(student, "m-1", True, days_ago=40)
    _answer(student, "m-2", False, attempt=1, days_ago=10)
    _answer(student, "m-2", False, attempt=2, days_ago=2)
    _answer(student, "m-4", True, days_ago=1)
    db.session.commit()

    login("admin-sub", ["admin"])
    return {"student": student, "teacher": teacher, "attempt_id": attempt_id}


def _report(client, student_id):
    response = client.get(f"/api/admin/students/{student_id}", headers=HEADERS)
    assert response.status_code == 200
    return response.json


def test_summary_shows_profile_and_learning_results_only(client, report_data):
    summary = client.get("/api/admin/students", headers=HEADERS).json[0]

    assert summary["interest"] == "sport"
    assert summary["teacher_name"] == "Anna Nowak"
    assert summary["joined_at"] is not None
    assert summary["total_attempts"] == 4
    assert summary["solved_tasks"] == 2
    assert summary["accuracy"] == 50
    assert summary["leveling_test"]["status"] == "up_to_date"
    assert summary["last_leveling_test"]["score"] == 0


def test_report_shows_progress_per_section_and_subsection(client, report_data):
    sections = {section["section_title"]: section for section in _report(client, report_data["student"].id)["sections"]}

    multiplication = sections["Mnożenie"]
    assert (multiplication["solved_tasks"], multiplication["total_tasks"]) == (2, 4)
    easy, hard = multiplication["subsections"]
    assert (easy["subsection_title"], easy["solved_tasks"], easy["total_tasks"], easy["unlocked_level"]) == (
        "Łatwe mnożenie", 1, 3, 2,
    )
    assert (hard["solved_tasks"], hard["total_tasks"]) == (1, 1)
    final_test = multiplication["final_test"]
    summary_keys = ("question_count", "attempts", "best_score", "last_score", "max_score")
    assert {key: final_test[key] for key in summary_keys} == {
        "question_count": 1,
        "attempts": 1,
        "best_score": 1,
        "last_score": 1,
        "max_score": 1,
    }
    assert final_test["history"][0]["score"] == 1
    assert sections["Ułamki"]["final_test"] is None


def test_report_shows_activity_and_current_subsection(client, report_data):
    report = _report(client, report_data["student"].id)

    assert report["activity"] == {
        "answers_last_7_days": 2,
        "answers_last_30_days": 3,
        "active_days_last_30_days": 3,
    }
    assert report["current_subsection"]["subsection_title"] == "Łatwe mnożenie"


def test_report_describes_tasks_by_their_content(client, report_data):
    report = _report(client, report_data["student"].id)

    assert report["needs_practice"] == [{
        "task_id": Task.query.filter_by(content_key="m-2").one().id,
        "content_key": "m-2",
        "type": "single_choice",
        "prompt": "Mnożenie 2",
        "subsection_title": "Łatwe mnożenie",
        "section_title": "Mnożenie",
        "attempt_number": 2,
    }]
    assert [item["content_key"] for item in report["recent_activity"]] == ["m-4", "m-2", "m-2", "m-1"]
    assert report["recent_activity"][0]["prompt"] == "Mnożenie 4"


def test_report_lists_leveling_tests_with_section_results(client, report_data):
    leveling_tests = _report(client, report_data["student"].id)["leveling_tests"]

    assert len(leveling_tests) == 1
    assert leveling_tests[0]["id"] == report_data["attempt_id"]
    assert [result["section_title"] for result in leveling_tests[0]["per_section"]] == ["Mnożenie", "Ułamki"]


def test_leveling_test_detail_shows_given_and_correct_answers(client, report_data):
    student_id, attempt_id = report_data["student"].id, report_data["attempt_id"]

    response = client.get(f"/api/admin/students/{student_id}/leveling-tests/{attempt_id}", headers=HEADERS)

    assert response.status_code == 200
    detail = response.json
    assert detail["score"] == 0
    assert len(detail["answers"]) == detail["total"]
    first = detail["answers"][0]
    assert first["is_correct"] is False
    assert first["given_answer"] == "2"
    assert first["correct_answer"] == "1"
    assert first["prompt"].startswith(("Mnożenie", "Ułamki"))


def test_teacher_sees_only_own_students_tests(client, login, report_data):
    student_id, attempt_id = report_data["student"].id, report_data["attempt_id"]
    url = f"/api/admin/students/{student_id}/leveling-tests/{attempt_id}"

    login("teacher-sub", ["ROLE_TEACHER"])
    assert client.get(url, headers=HEADERS).status_code == 200

    login("other-teacher-sub", ["ROLE_TEACHER"])
    assert client.get(url, headers=HEADERS).status_code == 404


def test_attempt_of_another_student_is_not_found(client, report_data):
    other = User(keycloak_sub="other-student", role="student")
    db.session.add(other)
    db.session.commit()

    response = client.get(
        f"/api/admin/students/{other.id}/leveling-tests/{report_data['attempt_id']}", headers=HEADERS
    )

    assert response.status_code == 404
    assert response.json == {"error": "Leveling test not found"}


def test_final_test_detail_shows_given_and_correct_answers(client, report_data):
    student_id = report_data["student"].id
    report = _report(client, student_id)
    attempt_id = report["sections"][0]["final_test"]["history"][0]["id"]

    response = client.get(f"/api/admin/students/{student_id}/final-tests/{attempt_id}", headers=HEADERS)

    assert response.status_code == 200
    assert response.json["answers"] == [{
        "question_id": 1,
        "content_key": "final-1",
        "type": "short_answer",
        "prompt": "Ile to 2 · 3?",
        "is_correct": True,
        "given_answer": "6",
        "correct_answer": "6",
    }]


def test_final_test_of_another_student_is_not_found(client, report_data):
    other = User(keycloak_sub="other-student", role="student")
    db.session.add(other)
    db.session.commit()

    response = client.get(f"/api/admin/students/{other.id}/final-tests/1", headers=HEADERS)

    assert response.status_code == 404
    assert response.json == {"error": "Final test not found"}


def test_deleting_a_section_removes_its_final_test_answers(client, report_data):
    response = client.delete("/api/admin/sections/1", headers=HEADERS)

    assert response.status_code == 204
    assert _report(client, report_data["student"].id)["sections"][0]["section_title"] == "Ułamki"


def test_subsection_tasks_include_answer_statistics(client, report_data):
    subsection = client.get("/api/admin/subsections/1", headers=HEADERS).json
    tasks = {task["content_key"]: task for task in subsection["tasks"]}

    assert tasks["m-2"]["stats"] == {
        "attempts": 2,
        "correct_attempts": 0,
        "students_attempted": 1,
        "students_solved": 0,
        "accuracy": 0,
    }
    assert tasks["m-3"]["stats"]["accuracy"] is None

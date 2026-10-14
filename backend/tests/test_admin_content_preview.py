from datetime import datetime

import pytest

from app.extensions import db
from app.models.student_answers import StudentAnswer
from app.models.tasks import Task
from app.models.users import User

HEADERS = {"Authorization": "Bearer test-token"}

TASKS = [{
    "section": "Tabliczka mnożenia",
    "subsections": [{
        "subsection": "Łatwe mnożenie",
        "tasks": [
            {
                "content_key": "choice",
                "type": "single_choice",
                "difficulty": 1,
                "themes": {
                    "default": {
                        "prompt": "Ile to 2 · 2?",
                        "options": [{"text": "4", "correct": True}, {"text": "5"}, {"text": "6"}],
                    },
                    "sport": {"prompt": "Dwie drużyny po 2 zawodników?"},
                    "gry": {
                        "prompt": "Dwa poziomy po 2 monety?",
                        "options": [{"text": "4 monety", "correct": True}, {"text": "5 monet"}, {"text": "6 monet"}],
                    },
                },
            },
            {
                "content_key": "short",
                "type": "short_answer",
                "difficulty": 2,
                "themes": {"default": {"prompt": "Ile to 3 · 6?", "answers": ["18"]}},
            },
            {
                "content_key": "memory",
                "type": "memory",
                "themes": {
                    "default": {
                        "prompt": "Połącz w pary.",
                        "pairs": [{"a": "2 · 3", "b": "6"}, {"a": "4 · 2", "b": "8"}, {"a": "5 · 2", "b": "10"}],
                    },
                },
            },
        ],
    }],
}]

FINAL_TEST = [{
    "section": "Tabliczka mnożenia",
    "questions": [
        {
            "content_key": "final-1",
            "type": "single_choice",
            "themes": {
                "default": {
                    "prompt": "Ile to 7 · 8?",
                    "options": [{"text": "56", "correct": True}, {"text": "54"}, {"text": "58"}],
                },
                "lego": {"prompt": "7 wież po 8 klocków?"},
            },
        },
        {
            "content_key": "final-2",
            "type": "short_answer",
            "themes": {"default": {"prompt": "Ile to 9 · 9?", "answers": ["81"]}},
        },
    ],
}]


@pytest.fixture
def content(client, login):
    login("admin-sub", ["admin"])
    client.post("/api/admin/tasks/import", json=TASKS, headers=HEADERS)
    client.post("/api/admin/sections/1/final-test/import", json=FINAL_TEST, headers=HEADERS)


def _tasks_by_key(client):
    response = client.get("/api/admin/subsections/1", headers=HEADERS)
    assert response.status_code == 200
    return {task["content_key"]: task for task in response.json["tasks"]}


def test_subsection_lists_tasks_with_their_default_content(client, content):
    tasks = _tasks_by_key(client)

    choice = tasks["choice"]
    assert choice["type"] == "single_choice"
    assert choice["difficulty_level"] == 1
    assert choice["prompt"] == "Ile to 2 · 2?"
    assert [(o["text"], o["is_correct"]) for o in choice["options"]] == [("4", True), ("5", False), ("6", False)]
    assert choice["themes"] == ["gry", "sport"]

    short = tasks["short"]
    assert short["type"] == "short_answer"
    assert short["accepted_answers"] == ["18"]
    assert "options" not in short

    memory = tasks["memory"]
    assert memory["type"] == "memory"
    assert memory["difficulty_level"] == 2
    assert memory["memory_pairs"][0] == {"a": "2 · 3", "b": "6"}
    assert memory["themes"] == []


def test_task_detail_shows_every_theme_variant(client, content):
    task_id = _tasks_by_key(client)["choice"]["id"]

    response = client.get(f"/api/admin/tasks/{task_id}", headers=HEADERS)

    assert response.status_code == 200
    detail = response.json
    assert detail["section_title"] == "Tabliczka mnożenia"
    assert detail["subsection_title"] == "Łatwe mnożenie"
    variants = {variant["theme"]: variant for variant in detail["variants"]}
    assert variants["sport"]["prompt"] == "Dwie drużyny po 2 zawodników?"
    assert [o["text"] for o in variants["sport"]["options"]] == ["4", "5", "6"]
    assert [o["text"] for o in variants["gry"]["options"]] == ["4 monety", "5 monet", "6 monet"]


def test_task_detail_counts_learning_answers(client, content):
    task = Task.query.filter_by(content_key="choice").one()
    first, second = User(keycloak_sub="a", role="student"), User(keycloak_sub="b", role="student")
    db.session.add_all([first, second])
    db.session.flush()
    for student, is_correct, attempt in ((first, False, 1), (first, True, 2), (second, False, 1)):
        db.session.add(StudentAnswer(
            task_id=task.id, student_id=student.id, is_correct=is_correct,
            attempt_number=attempt, submitted_at=datetime(2026, 10, 1),
        ))
    db.session.commit()

    stats = client.get(f"/api/admin/tasks/{task.id}", headers=HEADERS).json["stats"]

    assert stats == {
        "attempts": 3,
        "correct_attempts": 1,
        "students_attempted": 2,
        "students_solved": 1,
        "accuracy": 33,
    }


def test_teacher_can_preview_tasks_but_not_delete_them(client, login, content):
    task_id = _tasks_by_key(client)["choice"]["id"]
    login("teacher-sub", ["ROLE_TEACHER"])

    assert client.get(f"/api/admin/tasks/{task_id}", headers=HEADERS).status_code == 200
    assert client.delete(f"/api/admin/tasks/{task_id}", headers=HEADERS).status_code == 403


def test_task_preview_requires_a_staff_role(client, login, content):
    login("student-sub", ["student"])

    assert client.get("/api/admin/tasks/1", headers=HEADERS).status_code == 403


def test_missing_task_returns_404(client, content):
    response = client.get("/api/admin/tasks/9999", headers=HEADERS)

    assert response.status_code == 404
    assert response.json == {"error": "Task not found"}


@pytest.mark.parametrize("method,url", [
    ("post", "/api/admin/subsections/1/tasks"),
    ("patch", "/api/admin/tasks/1"),
])
def test_tasks_cannot_be_created_or_edited_outside_import(client, content, method, url):
    response = getattr(client, method)(url, json={"title": "x"}, headers=HEADERS)

    assert response.status_code in (404, 405)
    assert Task.query.count() == 3


def test_final_test_preview_lists_questions_with_answers(client, content):
    response = client.get("/api/admin/sections/1/final-test", headers=HEADERS)

    assert response.status_code == 200
    preview = response.json
    assert preview["section_title"] == "Tabliczka mnożenia"
    assert preview["attempts"] == 0
    first, second = preview["questions"]
    assert first["prompt"] == "Ile to 7 · 8?"
    assert [(o["text"], o["is_correct"]) for o in first["options"]] == [("56", True), ("54", False), ("58", False)]
    assert first["themes"] == ["lego"]
    assert second["accepted_answers"] == ["81"]


def test_section_reports_final_test_question_count(client, content):
    sections = client.get("/api/admin/sections", headers=HEADERS).json

    assert sections[0]["final_test_question_count"] == 2


def test_final_test_preview_of_missing_section_returns_404(client, content):
    assert client.get("/api/admin/sections/9999/final-test", headers=HEADERS).status_code == 404

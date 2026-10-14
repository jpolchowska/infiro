import pytest

from app.models.task_answer_options import TaskAnswerOption
from app.models.tasks import Task

HEADERS = {"Authorization": "Bearer test-token"}

TASKS = [
    {
        "content_key": "choice",
        "type": "single_choice",
        "difficulty": 1,
        "themes": {
            "default": {
                "prompt": "Ile to 2 · 2?",
                "options": [{"text": "4", "correct": True}, {"text": "5"}, {"text": "6"}],
            },
            "gry": {
                "prompt": "Dwa poziomy po 2 monety?",
                "options": [{"text": "4 monety", "correct": True}, {"text": "5 monet"}, {"text": "6 monet"}],
            },
        },
    },
    {
        "content_key": "short",
        "type": "short_answer",
        "difficulty": 1,
        "themes": {"default": {"prompt": "Ile to 1,5 + 1?", "answers": ["2,5", "2.5"]}},
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
]


@pytest.fixture
def tasks(client, login):
    login("admin-sub", ["admin"])
    client.post(
        "/api/admin/tasks/import",
        json=[{"section": "Mnożenie", "subsections": [{"subsection": "Łatwe", "tasks": TASKS}]}],
        headers=HEADERS,
    )
    login("student-sub", ["student"])
    client.get("/api/student/me", headers=HEADERS)
    return {task.content_key: task.id for task in Task.query.all()}


def _view(client, task_id):
    response = client.get(f"/api/student/tasks/{task_id}", headers=HEADERS)
    assert response.status_code == 200
    return response.json


def _answer(client, task_id, payload):
    return client.post(f"/api/student/tasks/{task_id}/answers", json=payload, headers=HEADERS)


def _option_id(task_id, text_index):
    return TaskAnswerOption.query.filter_by(task_id=task_id, order_index=text_index).one().id


def test_choice_task_hides_the_correct_answer(client, tasks):
    view = _view(client, tasks["choice"])

    assert view["prompt"] == "Ile to 2 · 2?"
    assert sorted(option["text"] for option in view["options"]) == ["4", "5", "6"]
    assert all(set(option) == {"id", "text"} for option in view["options"])
    assert (view["attempts_used"], view["max_attempts"], view["solution"]) == (0, 3, None)


def test_task_is_shown_in_the_students_theme(client, tasks):
    client.patch("/api/student/interest", json={"interest": "gry"}, headers=HEADERS)

    view = _view(client, tasks["choice"])

    assert view["prompt"] == "Dwa poziomy po 2 monety?"
    assert sorted(option["text"] for option in view["options"]) == ["4 monety", "5 monet", "6 monet"]


def test_short_answer_and_memory_views(client, tasks):
    short = _view(client, tasks["short"])
    memory = _view(client, tasks["memory"])

    assert "options" not in short
    assert short["max_attempts"] == 3
    assert memory["pairs"][0] == {"id": 1, "a": "2 · 3", "b": "6"}
    assert "attempts_used" not in memory


def test_solution_is_revealed_after_three_wrong_choices(client, tasks):
    task_id = tasks["choice"]
    wrong = {"selected_option_id": _option_id(task_id, 2)}

    first = _answer(client, task_id, wrong).json
    second = _answer(client, task_id, wrong).json
    third = _answer(client, task_id, wrong).json

    assert (first["attempts_left"], first["solution"]) == (2, None)
    assert second["attempts_left"] == 1
    assert third["attempts_left"] == 0
    assert third["solution"] == {"correct_option_id": _option_id(task_id, 1)}
    assert _view(client, task_id)["attempts_used"] == 0


def test_short_answer_accepts_any_listed_notation(client, tasks):
    response = _answer(client, tasks["short"], {"answer_text": "  2.5 "})

    assert response.status_code == 200
    assert response.json["is_correct"] is True
    assert response.json["attempt_number"] == 1


def test_short_answer_solution_lists_accepted_answers(client, tasks):
    for _ in range(3):
        result = _answer(client, tasks["short"], {"answer_text": "3"}).json

    assert result["solution"] == {"accepted_answers": ["2,5", "2.5"]}


def test_memory_counts_as_solved_once_completed(client, tasks):
    response = _answer(client, tasks["memory"], {"completed": True})

    assert response.status_code == 200
    assert response.json == {"is_correct": True, "attempt_number": 1, "attempts_left": None, "solution": None}


@pytest.mark.parametrize("key,payload,error", [
    ("memory", {"completed": False}, "completed must be true"),
    ("choice", {}, "selected_option_id is required"),
    ("choice", {"selected_option_id": 99999}, "Invalid option"),
    ("short", {"answer_text": 5}, "answer_text is required"),
])
def test_invalid_answers_are_rejected(client, tasks, key, payload, error):
    response = _answer(client, tasks[key], payload)

    assert response.status_code == 400
    assert response.json == {"error": error}


def test_missing_task_returns_404(client, tasks):
    assert client.get("/api/student/tasks/99999", headers=HEADERS).status_code == 404
    assert _answer(client, 99999, {}).status_code == 404

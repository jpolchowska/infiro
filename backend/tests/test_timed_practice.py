import pytest

from app.models.task_answer_options import TaskAnswerOption
from app.models.tasks import Task

HEADERS = {"Authorization": "Bearer test-token"}


def _choice(index):
    return {
        "content_key": f"timed-{index}",
        "type": "single_choice",
        "difficulty": 1,
        "themes": {
            "default": {
                "prompt": f"Pytanie {index}",
                "options": [{"text": "1", "correct": True}, {"text": "2"}, {"text": "3"}],
            },
        },
    }


@pytest.fixture
def subsection(client, login):
    tasks = [_choice(index) for index in range(22)]
    tasks.append({
        "content_key": "timed-short",
        "type": "short_answer",
        "difficulty": 1,
        "themes": {"default": {"prompt": "Ile to 2 · 2?", "answers": ["4"]}},
    })
    login("admin-sub", ["admin"])
    client.post(
        "/api/admin/tasks/import",
        json=[{"section": "Mnożenie", "subsections": [{"subsection": "Na czas", "tasks": tasks}]}],
        headers=HEADERS,
    )
    login("student-sub", ["student"])
    client.get("/api/student/me", headers=HEADERS)
    return 1


def _option(task_id, is_correct):
    return TaskAnswerOption.query.filter_by(task_id=task_id, is_correct=is_correct).first().id


def test_timed_practice_draws_at_most_twenty_choice_questions(client, subsection):
    response = client.get(f"/api/student/subsections/{subsection}/timed", headers=HEADERS)

    assert response.status_code == 200
    assert response.json["duration_seconds"] == 60
    questions = response.json["questions"]
    assert len(questions) == 20
    assert len({question["task_id"] for question in questions}) == 20
    short_answer_id = Task.query.filter_by(content_key="timed-short").one().id
    assert short_answer_id not in {question["task_id"] for question in questions}
    assert all(set(option) == {"id", "text"} for question in questions for option in question["options"])


def test_timed_practice_scores_only_valid_first_answers(client, subsection):
    first, second, third = (Task.query.filter_by(content_key=f"timed-{index}").one().id for index in range(3))
    answers = [
        {"task_id": first, "selected_option_id": _option(first, True)},
        {"task_id": second, "selected_option_id": _option(second, False)},
        {"task_id": first, "selected_option_id": _option(first, False)},
        {"task_id": third, "selected_option_id": _option(first, True)},
        {"task_id": "x", "selected_option_id": 1},
        "not an object",
    ]

    response = client.post(
        f"/api/student/subsections/{subsection}/timed/submit",
        json={"answers": answers, "elapsed_seconds": 42.5},
        headers=HEADERS,
    )

    assert response.status_code == 200
    assert response.json == {"correct": 1, "answered": 2, "total": 20}


@pytest.mark.parametrize("payload,error", [
    ({"answers": "x", "elapsed_seconds": 1}, "answers must be a list"),
    ({"answers": [], "elapsed_seconds": -1}, "elapsed_seconds must be a non-negative number"),
    ({"answers": [], "elapsed_seconds": True}, "elapsed_seconds must be a non-negative number"),
    ({"answers": []}, "elapsed_seconds must be a non-negative number"),
])
def test_timed_practice_rejects_invalid_submissions(client, subsection, payload, error):
    response = client.post(f"/api/student/subsections/{subsection}/timed/submit", json=payload, headers=HEADERS)

    assert response.status_code == 400
    assert response.json == {"error": error}


@pytest.mark.parametrize("method,url", [
    ("get", "/api/student/subsections/999/timed"),
    ("post", "/api/student/subsections/999/timed/submit"),
])
def test_timed_practice_for_missing_subsection_returns_404(client, subsection, method, url):
    response = getattr(client, method)(url, json={"answers": [], "elapsed_seconds": 0}, headers=HEADERS)

    assert response.status_code == 404
    assert response.json == {"error": "Subsection not found"}

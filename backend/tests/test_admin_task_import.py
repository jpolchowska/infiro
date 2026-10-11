import copy
from types import SimpleNamespace

import pytest

from app import create_app
from app.extensions import db
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.task_answer_options import TaskAnswerOption
from app.models.tasks import Task


@pytest.fixture
def client(monkeypatch):
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite://",
    })
    monkeypatch.setattr(
        "app.middleware.auth.jwks_client.get_signing_key_from_jwt",
        lambda token: SimpleNamespace(key="test-key"),
    )
    monkeypatch.setattr(
        "app.middleware.auth.jwt.decode",
        lambda *args, **kwargs: {
            "iss": "http://keycloak:8080/realms/matematyka-app",
            "sub": "admin-sub",
            "realm_access": {"roles": ["admin"]},
        },
    )

    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def _payload():
    return [
        {
            "section": "Tabliczka mnożenia i dzielenia",
            "subsections": [
                {
                    "subsection": "Łatwe mnożenie",
                    "tasks": [
                        {
                            "content_key": "latwe-mnozenie-01",
                            "type": "single_choice",
                            "difficulty": 1,
                            "themes": {
                                "default": {
                                    "prompt": "Ile to 2 · 2?",
                                    "options": [
                                        {"text": "4", "correct": True},
                                        {"text": "2"},
                                        {"text": "6"},
                                    ],
                                },
                                "sport": {"prompt": "Dwie drużyny po 2 zawodników. Ilu ich jest?"},
                            },
                        },
                        {
                            "content_key": "latwe-mnozenie-02",
                            "type": "short_answer",
                            "difficulty": 2,
                            "themes": {
                                "default": {"prompt": "Ile to 3 · 6?", "answers": ["18"]},
                            },
                        },
                        {
                            "content_key": "latwe-mnozenie-03",
                            "type": "memory",
                            "themes": {
                                "default": {
                                    "prompt": "Połącz działania z wynikami.",
                                    "pairs": [
                                        {"a": "2 · 3", "b": "6"},
                                        {"a": "4 · 2", "b": "8"},
                                        {"a": "5 · 2", "b": "10"},
                                    ],
                                },
                            },
                        },
                    ],
                },
            ],
        },
    ]


def _first_task(payload):
    return payload[0]["subsections"][0]["tasks"][0]


def _import(client, payload):
    return client.post(
        "/api/admin/tasks/import",
        json=payload,
        headers={"Authorization": "Bearer test-token"},
    )


def test_import_creates_all_task_types(client):
    response = _import(client, _payload())

    assert response.status_code == 201
    assert response.get_json()["task_count"] == 3
    assert Section.query.count() == 1
    assert Subsection.query.count() == 1

    single_choice = Task.query.filter_by(content_key="latwe-mnozenie-01").one()
    assert single_choice.type == "single_choice"
    assert single_choice.difficulty_level == 1
    assert single_choice.order_index == 1
    assert single_choice.themes["sport"]["options"] == single_choice.themes["default"]["options"]
    options = TaskAnswerOption.query.filter_by(task_id=single_choice.id).order_by(
        TaskAnswerOption.order_index
    ).all()
    assert [(option.option_text, option.is_correct) for option in options] == [
        ("4", True), ("2", False), ("6", False),
    ]

    short_answer = Task.query.filter_by(content_key="latwe-mnozenie-02").one()
    assert short_answer.type == "short_answer"
    assert short_answer.accepted_answers == ["18"]
    assert TaskAnswerOption.query.filter_by(task_id=short_answer.id).count() == 0

    memory = Task.query.filter_by(content_key="latwe-mnozenie-03").one()
    assert memory.type == "memory"
    assert memory.difficulty_level == 2
    assert len(memory.memory_pairs) == 3


def test_reimport_updates_tasks_without_duplicating_them(client):
    _import(client, _payload())
    task_id = Task.query.filter_by(content_key="latwe-mnozenie-01").one().id

    payload = _payload()
    _first_task(payload)["themes"]["default"]["prompt"] = "Ile to 2 · 3?"
    _first_task(payload)["themes"]["default"]["options"] = [
        {"text": "5"},
        {"text": "6", "correct": True},
        {"text": "8"},
    ]
    payload[0]["subsections"][0]["tasks"].reverse()

    response = _import(client, payload)

    assert response.status_code == 201
    assert Task.query.count() == 3
    assert TaskAnswerOption.query.count() == 3

    task = Task.query.filter_by(content_key="latwe-mnozenie-01").one()
    assert task.id == task_id
    assert task.body_text == "Ile to 2 · 3?"
    assert task.order_index == 3
    correct = TaskAnswerOption.query.filter_by(task_id=task.id, is_correct=True).one()
    assert correct.option_text == "6"


def test_import_rejects_task_without_content_key(client):
    payload = _payload()
    del _first_task(payload)["content_key"]

    response = _import(client, payload)

    assert response.status_code == 400
    assert response.get_json()["errors"] == [
        "section #1 / subsection #1 / task #1: 'content_key' must be a non-empty string",
    ]
    assert Task.query.count() == 0


def test_import_rejects_duplicate_content_key(client):
    payload = _payload()
    tasks = payload[0]["subsections"][0]["tasks"]
    tasks[1]["content_key"] = tasks[0]["content_key"]

    response = _import(client, payload)

    assert response.status_code == 400
    assert response.get_json()["errors"] == [
        "section #1 / subsection #1 / task #2: duplicate content_key 'latwe-mnozenie-01'",
    ]


def test_import_reports_every_error_at_once(client):
    payload = _payload()
    tasks = payload[0]["subsections"][0]["tasks"]
    tasks[0]["difficulty"] = 7
    tasks[1]["themes"]["default"]["answers"] = []
    tasks[2]["themes"]["default"]["pairs"].pop()

    response = _import(client, payload)

    assert response.status_code == 400
    assert response.get_json()["errors"] == [
        "section #1 / subsection #1 / task #1: 'difficulty' must be an integer 1-3",
        "section #1 / subsection #1 / task #2 theme 'default': "
        "'answers' must be a non-empty list of non-empty strings",
        "section #1 / subsection #1 / task #3 theme 'default': 'pairs' must be a list of 3 or 6 items",
    ]
    assert Section.query.count() == 0


def _remove_options(task):
    del task["themes"]["default"]["options"]


def _remove_correct_flag(task):
    del task["themes"]["default"]["options"][0]["correct"]


def _mark_two_correct(task):
    task["themes"]["default"]["options"][1]["correct"] = True


def _add_fourth_option(task):
    task["themes"]["default"]["options"].append({"text": "8"})


def _set_unknown_type(task):
    task["type"] = "open_answer"


def _remove_difficulty(task):
    del task["difficulty"]


def _add_unknown_theme(task):
    task["themes"]["kosmos"] = {"prompt": "Ile to 2 · 2?"}


def _blank_prompt(task):
    task["themes"]["default"]["prompt"] = "  "


def _blank_theme_prompt(task):
    task["themes"]["sport"]["prompt"] = ""


def _remove_default_theme(task):
    del task["themes"]["default"]


def _blank_content_key(task):
    task["content_key"] = " "


def _switch_to_short_answer(task):
    task["type"] = "short_answer"


def _switch_to_memory(task):
    task["type"] = "memory"


@pytest.mark.parametrize("mutate", [
    _remove_options,
    _remove_correct_flag,
    _mark_two_correct,
    _add_fourth_option,
    _set_unknown_type,
    _remove_difficulty,
    _add_unknown_theme,
    _blank_prompt,
    _blank_theme_prompt,
    _remove_default_theme,
    _blank_content_key,
    _switch_to_short_answer,
    _switch_to_memory,
])
def test_import_rejects_malformed_task(client, mutate):
    payload = _payload()
    mutate(_first_task(payload))

    response = _import(client, payload)

    assert response.status_code == 400
    assert response.get_json()["errors"]
    assert Task.query.count() == 0


@pytest.mark.parametrize("payload", [
    {},
    [],
    ["section"],
    [{"section": "Ułamki"}],
    [{"section": "", "subsections": []}],
    [{"section": "Ułamki", "subsections": [{"subsection": "Kawałki całości"}]}],
    [{"section": "Ułamki", "subsections": [{"subsection": "Kawałki całości", "tasks": ["task"]}]}],
])
def test_import_rejects_malformed_structure(client, payload):
    response = _import(client, copy.deepcopy(payload))

    assert response.status_code == 400
    assert response.get_json()["errors"]
    assert Section.query.count() == 0

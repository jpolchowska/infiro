from types import SimpleNamespace

import pytest

from app import create_app
from app.extensions import db
from app.models.users import User
from app.models.sections import Section
from app.models.section_test_questions import SectionTestQuestion
from app.models.section_test_answer_options import SectionTestAnswerOption
from app.models.section_test_attempts import SectionTestAttempt
from app.models.student_answers import StudentAnswer


@pytest.fixture
def client():
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite://",
    })

    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def _mock_auth(monkeypatch, sub, roles):
    monkeypatch.setattr(
        "app.middleware.auth.jwks_client.get_signing_key_from_jwt",
        lambda token: SimpleNamespace(key="test-key"),
    )
    monkeypatch.setattr(
        "app.middleware.auth.jwt.decode",
        lambda *args, **kwargs: {
            "iss": "http://keycloak:8080/realms/matematyka-app",
            "sub": sub,
            "realm_access": {"roles": roles},
        },
    )


IMPORT_PAYLOAD = [
    {
        "section": "Ułamki",
        "questions": [
            {
                "type": "single_choice",
                "content_key": "final-ulamki-1",
                "themes": {
                    "default": {
                        "prompt": "Ile to 1/2 + 1/2?",
                        "options": [
                            {"text": "1", "correct": True},
                            {"text": "2", "correct": False},
                            {"text": "0", "correct": False},
                        ],
                    }
                },
            },
            {
                "type": "short_answer",
                "content_key": "final-ulamki-2",
                "themes": {
                    "default": {
                        "prompt": "Ile to połowa z 10?",
                        "answers": ["5"],
                    }
                },
            },
        ],
    }
]


def test_admin_import_creates_questions_and_options(client, monkeypatch):
    _mock_auth(monkeypatch, "admin-sub", ["admin"])

    admin = User(keycloak_sub="admin-sub", role="admin")
    section = Section(title="Ułamki", order_index=0)
    db.session.add_all([admin, section])
    db.session.commit()

    response = client.post(
        f"/api/admin/sections/{section.id}/final-test/import",
        json=IMPORT_PAYLOAD,
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 201
    assert response.json["question_count"] == 2

    questions = SectionTestQuestion.query.filter_by(section_id=section.id).all()
    assert len(questions) == 2

    choice_question = next(q for q in questions if q.type == "single_choice")
    options = SectionTestAnswerOption.query.filter_by(
        section_test_question_id=choice_question.id
    ).all()
    assert len(options) == 3
    assert sum(1 for o in options if o.is_correct) == 1


def test_admin_import_rejects_unknown_section_title(client, monkeypatch):
    _mock_auth(monkeypatch, "admin-sub", ["admin"])

    admin = User(keycloak_sub="admin-sub", role="admin")
    section = Section(title="Inny dział", order_index=0)
    db.session.add_all([admin, section])
    db.session.commit()

    response = client.post(
        f"/api/admin/sections/{section.id}/final-test/import",
        json=IMPORT_PAYLOAD,
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 400


def _seed_section_with_questions():
    section = Section(title="Ułamki", order_index=0)
    db.session.add(section)
    db.session.commit()

    choice_question = SectionTestQuestion(
        section_id=section.id,
        prompt="Ile to 1/2 + 1/2?",
        type="single_choice",
        order_index=1,
        content_key="final-ulamki-1",
        themes={"default": {"prompt": "Ile to 1/2 + 1/2?"}},
    )
    db.session.add(choice_question)
    db.session.commit()

    correct_option = SectionTestAnswerOption(
        section_test_question_id=choice_question.id,
        option_text="1",
        is_correct=True,
        order_index=1,
    )
    wrong_option = SectionTestAnswerOption(
        section_test_question_id=choice_question.id,
        option_text="2",
        is_correct=False,
        order_index=2,
    )
    db.session.add_all([correct_option, wrong_option])

    short_question = SectionTestQuestion(
        section_id=section.id,
        prompt="Ile to połowa z 10?",
        type="short_answer",
        order_index=2,
        content_key="final-ulamki-2",
        accepted_answers=["5"],
        themes={"default": {"prompt": "Ile to połowa z 10?", "answers": ["5"]}},
    )
    db.session.add(short_question)
    db.session.commit()

    return section, choice_question, correct_option, wrong_option, short_question


def test_get_final_test_returns_themed_questions(client, monkeypatch):
    _mock_auth(monkeypatch, "student-sub", ["student"])
    student = User(keycloak_sub="student-sub", role="student")
    db.session.add(student)
    db.session.commit()

    section, *_ = _seed_section_with_questions()

    response = client.get(
        f"/api/student/sections/{section.id}/final-test",
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 200
    assert response.json["section_id"] == section.id
    assert len(response.json["questions"]) == 2


def test_submit_scores_correctly_and_isolates_from_student_answers(client, monkeypatch):
    _mock_auth(monkeypatch, "student-sub", ["student"])
    student = User(keycloak_sub="student-sub", role="student")
    db.session.add(student)
    db.session.commit()

    section, choice_question, correct_option, wrong_option, short_question = (
        _seed_section_with_questions()
    )

    response = client.post(
        f"/api/student/sections/{section.id}/final-test/submit",
        json={
            "answers": [
                {"question_id": choice_question.id, "selected_option_id": correct_option.id},
                {"question_id": short_question.id, "answer_text": "5"},
            ]
        },
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 201
    assert response.json["score"] == 2
    assert response.json["max_score"] == 2

    attempts = SectionTestAttempt.query.filter_by(student_id=student.id).all()
    assert len(attempts) == 1
    assert attempts[0].score == 2

    # Test końcowy musi być izolowany od zwykłego postępu ucznia.
    assert StudentAnswer.query.count() == 0


def test_submit_with_wrong_answer_scores_zero(client, monkeypatch):
    _mock_auth(monkeypatch, "student-sub", ["student"])
    student = User(keycloak_sub="student-sub", role="student")
    db.session.add(student)
    db.session.commit()

    section, choice_question, correct_option, wrong_option, short_question = (
        _seed_section_with_questions()
    )

    response = client.post(
        f"/api/student/sections/{section.id}/final-test/submit",
        json={
            "answers": [
                {"question_id": choice_question.id, "selected_option_id": wrong_option.id},
                {"question_id": short_question.id, "answer_text": "nope"},
            ]
        },
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 201
    assert response.json["score"] == 0
    assert response.json["max_score"] == 2


def test_history_lists_past_attempts_newest_first(client, monkeypatch):
    _mock_auth(monkeypatch, "student-sub", ["student"])
    student = User(keycloak_sub="student-sub", role="student")
    db.session.add(student)
    db.session.commit()

    section, choice_question, correct_option, wrong_option, short_question = (
        _seed_section_with_questions()
    )

    for score in (1, 2):
        client.post(
            f"/api/student/sections/{section.id}/final-test/submit",
            json={
                "answers": [
                    {"question_id": choice_question.id, "selected_option_id": correct_option.id},
                    {
                        "question_id": short_question.id,
                        "answer_text": "5" if score == 2 else "nope",
                    },
                ]
            },
            headers={"Authorization": "Bearer test-token"},
        )

    response = client.get(
        f"/api/student/sections/{section.id}/final-test/history",
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 200
    assert len(response.json) == 2
    assert response.json[0]["score"] == 2
    assert response.json[1]["score"] == 1


def test_sections_list_surfaces_latest_final_test_score(client, monkeypatch):
    _mock_auth(monkeypatch, "student-sub", ["student"])
    student = User(keycloak_sub="student-sub", role="student")
    db.session.add(student)
    db.session.commit()

    section, choice_question, correct_option, wrong_option, short_question = (
        _seed_section_with_questions()
    )

    client.post(
        f"/api/student/sections/{section.id}/final-test/submit",
        json={
            "answers": [
                {"question_id": choice_question.id, "selected_option_id": correct_option.id},
                {"question_id": short_question.id, "answer_text": "5"},
            ]
        },
        headers={"Authorization": "Bearer test-token"},
    )

    response = client.get(
        "/api/student/sections",
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 200
    section_data = next(s for s in response.json if s["id"] == section.id)
    assert section_data["last_final_test_score"] == 2
    assert section_data["last_final_test_max_score"] == 2

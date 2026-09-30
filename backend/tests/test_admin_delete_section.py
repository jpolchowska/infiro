from types import SimpleNamespace

import pytest
from sqlalchemy import event

from app import create_app
from app.extensions import db
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.ebooks import ebooks
from app.models.section_test_questions import SectionTestQuestion
from app.models.section_test_answer_options import SectionTestAnswerOption
from app.models.section_test_attempts import SectionTestAttempt
from app.models.users import User


@pytest.fixture
def client():
    app = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite://",
    })

    with app.app_context():
        event.listen(
            db.engine,
            "connect",
            lambda connection, _: connection.execute("PRAGMA foreign_keys=ON"),
        )
        db.create_all()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


def _mock_auth(monkeypatch):
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


def _create_section_with_ebook_and_final_test():
    student = User(keycloak_sub="student-sub", role="student")
    section = Section(title="Tabliczka mnożenia", order_index=0)
    db.session.add_all([student, section])
    db.session.commit()

    subsection = Subsection(section_id=section.id, title="Mnożenie przez 2")
    question = SectionTestQuestion(section_id=section.id, prompt="Ile to 2 x 3?")
    db.session.add_all([subsection, question])
    db.session.commit()

    db.session.add_all([
        ebooks(subsection_id=subsection.id, title="Mnożenie przez 2", content=[]),
        SectionTestAnswerOption(
            section_test_question_id=question.id,
            option_text="6",
            is_correct=True,
            order_index=1,
        ),
        SectionTestAttempt(
            student_id=student.id,
            section_id=section.id,
            score=1,
            max_score=1,
        ),
    ])
    db.session.commit()

    return section, subsection


def test_delete_section_removes_ebooks_and_final_test(client, monkeypatch):
    _mock_auth(monkeypatch)
    section, _ = _create_section_with_ebook_and_final_test()

    response = client.delete(
        f"/api/admin/sections/{section.id}",
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 204
    assert Section.query.count() == 0
    assert Subsection.query.count() == 0
    assert ebooks.query.count() == 0
    assert SectionTestQuestion.query.count() == 0
    assert SectionTestAnswerOption.query.count() == 0
    assert SectionTestAttempt.query.count() == 0


def test_delete_subsection_removes_its_ebook(client, monkeypatch):
    _mock_auth(monkeypatch)
    section, subsection = _create_section_with_ebook_and_final_test()

    response = client.delete(
        f"/api/admin/subsections/{subsection.id}",
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 204
    assert Subsection.query.count() == 0
    assert ebooks.query.count() == 0
    assert db.session.get(Section, section.id) is not None
    assert SectionTestQuestion.query.count() == 1

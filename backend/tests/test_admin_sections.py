import pytest
from sqlalchemy import event

from app import create_app
from app.extensions import db
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.ebooks import Ebook
from app.models.section_test_questions import SectionTestQuestion
from app.models.section_test_answer_options import SectionTestAnswerOption
from app.models.section_test_attempts import SectionTestAttempt
from app.models.users import User

HEADERS = {"Authorization": "Bearer test-token"}


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
        db.engine.dispose()


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
        Ebook(subsection_id=subsection.id, title="Mnożenie przez 2", content=[]),
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


def test_delete_section_removes_ebooks_and_final_test(client, login):
    login("admin-sub", ["admin"])
    section, _ = _create_section_with_ebook_and_final_test()

    response = client.delete(
        f"/api/admin/sections/{section.id}",
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 204
    assert Section.query.count() == 0
    assert Subsection.query.count() == 0
    assert Ebook.query.count() == 0
    assert SectionTestQuestion.query.count() == 0
    assert SectionTestAnswerOption.query.count() == 0
    assert SectionTestAttempt.query.count() == 0


def test_delete_subsection_removes_its_ebook(client, login):
    login("admin-sub", ["admin"])
    section, subsection = _create_section_with_ebook_and_final_test()

    response = client.delete(
        f"/api/admin/subsections/{subsection.id}",
        headers={"Authorization": "Bearer test-token"},
    )

    assert response.status_code == 204
    assert Subsection.query.count() == 0
    assert Ebook.query.count() == 0
    assert db.session.get(Section, section.id) is not None
    assert SectionTestQuestion.query.count() == 1


def test_admin_creates_and_edits_sections_and_subsections(client, login):
    login("admin-sub", ["admin"])

    section = client.post(
        "/api/admin/sections", json={"title": " Ułamki ", "description": " Podstawy "}, headers=HEADERS
    ).json
    second = client.post("/api/admin/sections", json={"title": "Procenty"}, headers=HEADERS).json
    subsection = client.post(
        f"/api/admin/sections/{section['id']}/subsections", json={"title": "Kawałki"}, headers=HEADERS
    ).json

    assert (section["title"], section["description"], section["order_index"]) == ("Ułamki", "Podstawy", 1)
    assert second["order_index"] == 2
    assert (subsection["section_id"], subsection["order_index"], subsection["description"]) == (
        section["id"], 1, None,
    )

    updated = client.patch(
        f"/api/admin/sections/{section['id']}", json={"title": "Ułamki proste", "description": ""}, headers=HEADERS
    ).json
    renamed = client.patch(
        f"/api/admin/subsections/{subsection['id']}", json={"title": "Kawałki całości"}, headers=HEADERS
    ).json

    assert (updated["title"], updated["description"]) == ("Ułamki proste", None)
    assert renamed["title"] == "Kawałki całości"

    detail = client.get(f"/api/admin/sections/{section['id']}", headers=HEADERS).json
    assert [item["title"] for item in detail["subsections"]] == ["Kawałki całości"]
    assert client.get(f"/api/admin/subsections/{subsection['id']}", headers=HEADERS).json["tasks"] == []


@pytest.mark.parametrize("method,url,payload,status,error", [
    ("post", "/api/admin/sections", {"title": " "}, 400, "title is required"),
    ("patch", "/api/admin/sections/1", {"title": ""}, 400, "title cannot be empty"),
    ("patch", "/api/admin/sections/999", {"title": "x"}, 404, "Section not found"),
    ("post", "/api/admin/sections/1/subsections", {}, 400, "title is required"),
    ("post", "/api/admin/sections/999/subsections", {"title": "x"}, 404, "Section not found"),
    ("patch", "/api/admin/subsections/1", {"title": " "}, 400, "title cannot be empty"),
    ("patch", "/api/admin/subsections/999", {"title": "x"}, 404, "Subsection not found"),
])
def test_invalid_section_changes_are_rejected(client, login, method, url, payload, status, error):
    login("admin-sub", ["admin"])
    client.post("/api/admin/sections", json={"title": "Ułamki"}, headers=HEADERS)
    client.post("/api/admin/sections/1/subsections", json={"title": "Kawałki"}, headers=HEADERS)

    response = getattr(client, method)(url, json=payload, headers=HEADERS)

    assert response.status_code == status
    assert response.json == {"error": error}


@pytest.mark.parametrize("url", ["/api/admin/sections/999", "/api/admin/subsections/999"])
def test_missing_course_items_return_404(client, login, url):
    login("admin-sub", ["admin"])

    assert client.get(url, headers=HEADERS).status_code == 404
    assert client.delete(url, headers=HEADERS).status_code == 404


def test_teacher_can_browse_but_not_change_the_course(client, login):
    login("admin-sub", ["admin"])
    client.post("/api/admin/sections", json={"title": "Ułamki"}, headers=HEADERS)
    login("teacher-sub", ["ROLE_TEACHER"])

    assert client.get("/api/admin/sections", headers=HEADERS).status_code == 200
    assert client.get("/api/admin/sections/1", headers=HEADERS).status_code == 200
    assert client.post("/api/admin/sections", json={"title": "x"}, headers=HEADERS).status_code == 403
    assert client.patch("/api/admin/sections/1", json={"title": "x"}, headers=HEADERS).status_code == 403
    assert client.delete("/api/admin/sections/1", headers=HEADERS).status_code == 403

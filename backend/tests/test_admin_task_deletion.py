import pytest

from app.extensions import db
from app.models.sections import Section
from app.models.student_answers import StudentAnswer
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.models.users import User
from app.clock import utc_now
from tests.test_admin_task_import import _payload

HEADERS = {"Authorization": "Bearer test-token"}


@pytest.fixture
def task_ids(client, login):
    login("admin-sub", ["admin"])
    client.post("/api/admin/tasks/import", json=_payload(), headers=HEADERS)
    return [task.id for task in Task.query.order_by(Task.order_index).all()]


def _bulk_delete(client, body):
    return client.post("/api/admin/tasks/delete", json=body, headers=HEADERS)


def _order(model, **filters):
    return [item.order_index for item in model.query.filter_by(**filters).order_by(model.order_index).all()]


def test_admin_deletes_several_tasks_with_their_answers(client, task_ids):
    student = User(keycloak_sub="student-sub", role="student")
    db.session.add(student)
    db.session.flush()
    db.session.add(StudentAnswer(
        task_id=task_ids[0], student_id=student.id, is_correct=True, attempt_number=1, submitted_at=utc_now(),
    ))
    db.session.commit()

    response = _bulk_delete(client, {"task_ids": task_ids[:2]})

    assert response.status_code == 204
    assert [task.id for task in Task.query.all()] == task_ids[2:]
    assert StudentAnswer.query.count() == 0


def test_remaining_tasks_are_renumbered_after_deleting_one(client, task_ids):
    assert client.delete(f"/api/admin/tasks/{task_ids[1]}", headers=HEADERS).status_code == 204

    remaining = Task.query.order_by(Task.order_index).all()
    assert [task.id for task in remaining] == [task_ids[0], task_ids[2]]
    assert [task.order_index for task in remaining] == [1, 2]


def test_nothing_is_deleted_when_a_task_is_missing(client, task_ids):
    response = _bulk_delete(client, {"task_ids": [task_ids[0], 9999]})

    assert response.status_code == 404
    assert response.json == {"error": "Task not found", "missing_task_ids": [9999]}
    assert Task.query.count() == len(task_ids)


@pytest.mark.parametrize("body", [{}, {"task_ids": []}, {"task_ids": "1"}, {"task_ids": [1, "2"]}, {"task_ids": [True]}])
def test_task_ids_must_be_a_non_empty_list_of_integers(client, task_ids, body):
    response = _bulk_delete(client, body)

    assert response.status_code == 400
    assert response.json == {"error": "task_ids must be a non-empty list of integers"}
    assert Task.query.count() == len(task_ids)


def test_teacher_cannot_delete_tasks(client, login, task_ids):
    login("teacher-sub", ["teacher"])

    response = _bulk_delete(client, {"task_ids": task_ids})

    assert response.status_code == 403
    assert Task.query.count() == len(task_ids)


def test_subsections_and_sections_are_renumbered_after_deletion(client, login):
    login("admin-sub", ["admin"])
    sections = [Section(title=f"Dział {index}", order_index=index) for index in (1, 2, 3)]
    db.session.add_all(sections)
    db.session.flush()
    subsections = [Subsection(section_id=sections[0].id, title=f"Temat {index}", order_index=index) for index in (1, 2, 3)]
    db.session.add_all(subsections)
    db.session.commit()

    assert client.delete(f"/api/admin/subsections/{subsections[0].id}", headers=HEADERS).status_code == 204
    assert client.delete(f"/api/admin/sections/{sections[1].id}", headers=HEADERS).status_code == 204

    assert _order(Subsection, section_id=sections[0].id) == [1, 2]
    assert _order(Section) == [1, 2]

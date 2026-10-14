from app.extensions import db
from app.models.users import User

HEADERS = {"Authorization": "Bearer test-token"}


def test_admin_can_assign_student_to_teacher(client, login):
    login(roles=["admin"])

    teacher = User(keycloak_sub="teacher-sub", role="teacher")
    student = User(keycloak_sub="student-sub", role="student")
    db.session.add_all([teacher, student])
    db.session.commit()

    response = client.patch(
        f"/api/admin/students/{student.id}",
        headers={"Authorization": "Bearer test-token"},
        json={"teacher_id": teacher.id},
    )

    assert response.status_code == 200
    assert db.session.get(User, student.id).teacher_id == teacher.id


def test_admin_cannot_assign_nonexistent_teacher(client, login):
    login(roles=["admin"])

    student = User(keycloak_sub="student_sub", role="student")

    db.session.add(student)
    db.session.commit()

    response = client.patch(
        f"/api/admin/students/{student.id}",
        headers={"Authorization": "Bearer test-token"},
        json={"teacher_id": 9999},
    )
    assert response.status_code == 404


def test_admin_not_admin_tries_to_update_student(client, login):
    login(roles=["teacher"])

    teacher = User(keycloak_sub="teacher-sub", role="teacher")
    student = User(keycloak_sub="student-sub", role="student")
    db.session.add_all([teacher, student])
    db.session.commit()

    response = client.patch(
        f"/api/admin/students/{student.id}",
        headers={"Authorization": "Bearer test-token"},
        json={"teacher_id": teacher.id},
    )

    assert response.status_code == 403


def test_admin_student_doesnt_exist(client, login):
    login(roles=["admin"])

    teacher = User(keycloak_sub="teacher-sub", role="teacher")
    student = User(keycloak_sub="student-sub", role="student")
    db.session.add_all([teacher, student])
    db.session.commit()

    response = client.patch(
        f"/api/admin/students/{9999}",
        headers={"Authorization": "Bearer test-token"},
        json={"teacher_id": teacher.id},
    )

    assert response.status_code == 404


def test_admin_lists_teachers_by_name(client, login):
    login(roles=["admin"])
    db.session.add_all([
        User(keycloak_sub="t1", role="teacher", first_name="Zofia", last_name="Wójcik", email="z@example.com"),
        User(keycloak_sub="t2", role="teacher", first_name="Adam", last_name="Nowak"),
        User(keycloak_sub="s1", role="student", first_name="Ala"),
    ])
    db.session.commit()

    response = client.get("/api/admin/teachers", headers=HEADERS)

    assert response.status_code == 200
    assert [teacher["name"] for teacher in response.json] == ["Adam Nowak", "Zofia Wójcik"]


def test_admin_can_unassign_a_teacher(client, login):
    login(roles=["admin"])
    teacher = User(keycloak_sub="teacher-sub", role="teacher")
    db.session.add(teacher)
    db.session.flush()
    student = User(keycloak_sub="student-sub", role="student", teacher_id=teacher.id)
    db.session.add(student)
    db.session.commit()

    response = client.patch(f"/api/admin/students/{student.id}", json={"teacher_id": None}, headers=HEADERS)

    assert response.status_code == 200
    assert response.json["teacher_id"] is None


def test_teacher_id_must_be_an_integer(client, login):
    login(roles=["admin"])
    student = User(keycloak_sub="student-sub", role="student")
    db.session.add(student)
    db.session.commit()

    response = client.patch(f"/api/admin/students/{student.id}", json={"teacher_id": "1"}, headers=HEADERS)

    assert response.status_code == 400
    assert response.json == {"error": "teacher_id must be an integer or null"}


def test_teacher_sees_only_assigned_students(client, login):
    login("teacher-sub", ["ROLE_TEACHER"])
    client.get("/api/admin/students", headers=HEADERS)
    teacher = User.query.filter_by(keycloak_sub="teacher-sub").one()
    db.session.add_all([
        User(keycloak_sub="mine", role="student", teacher_id=teacher.id),
        User(keycloak_sub="other", role="student"),
    ])
    db.session.commit()

    students = client.get("/api/admin/students", headers=HEADERS).json

    assert len(students) == 1
    assert client.get(f"/api/admin/students/{students[0]['id'] + 1}", headers=HEADERS).status_code == 404


def test_user_without_staff_role_cannot_list_students(client, login):
    login("student-sub", ["student"])

    response = client.get("/api/admin/students", headers=HEADERS)

    assert response.status_code == 403

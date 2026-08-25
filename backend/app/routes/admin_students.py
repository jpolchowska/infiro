from flask import Blueprint, jsonify, request

from app.extensions import db
from app.middleware.auth import authenticate_token, require_realm_role
from app.models.users import User
from app.models.student_answers import StudentAnswer
from app.models.tasks import Task
from app.models.subsections import Subsection
from app.models.sections import Section
from app.services.users import get_or_create_user

admin_students_bp = Blueprint("admin_students", __name__)


def _current_role_and_user():
    """Sprawdza role realmowe z tokena. Dla admina zwraca ('admin', None) --
    admin nie potrzebuje własnego wiersza w users do przeglądania uczniów.
    Dla nauczyciela zwraca ('teacher', User) i przy pierwszym wejściu zakłada
    mu wiersz w users (tak jak _current_user()/me w student.py dla ucznia).
    Zwraca (None, None), jeśli użytkownik nie ma żadnej z tych ról.
    """
    realm_roles = request.user.get("realm_access", {}).get("roles", [])

    if "admin" in realm_roles:
        return "admin", None

    if "ROLE_TEACHER" in realm_roles:
        return "teacher", get_or_create_user("teacher")

    return None, None


def _student_json(student, total_tasks):
    answers = StudentAnswer.query.filter_by(student_id=student.id).all()
    solved_task_ids = {a.task_id for a in answers if a.is_correct}
    total_attempts = len(answers)
    correct_attempts = sum(1 for a in answers if a.is_correct)
    accuracy = round(100 * correct_attempts / total_attempts) if total_attempts else None
    last_activity = max((a.submitted_at for a in answers), default=None)
    name = f"{student.first_name or ''} {student.last_name or ''}".strip() or None

    return {
        "id": student.id,
        "name": name,
        "email": student.email,
        "solved_tasks": len(solved_task_ids),
        "total_tasks": total_tasks,
        "accuracy": accuracy,
        "total_attempts": total_attempts,
        "last_activity": last_activity.isoformat() if last_activity else None,
    }


def _section_progress(student):
    result = []
    for section in Section.query.order_by(Section.order_index).all():
        subsection_ids = [
            s.id for s in Subsection.query.filter_by(section_id=section.id).all()
        ]
        if not subsection_ids:
            continue

        task_ids = [
            t.id for t in Task.query.filter(Task.subsection_id.in_(subsection_ids)).all()
        ]
        if not task_ids:
            continue

        solved = db.session.query(StudentAnswer.task_id).filter(
            StudentAnswer.student_id == student.id,
            StudentAnswer.task_id.in_(task_ids),
            StudentAnswer.is_correct.is_(True),
        ).distinct().count()

        result.append({
            "section_title": section.title,
            "solved_tasks": solved,
            "total_tasks": len(task_ids),
        })
    return result


def _needs_practice(student):
    """Zadania, których ostatnia próba ucznia była błędna."""
    answers = StudentAnswer.query.filter_by(student_id=student.id).order_by(
        StudentAnswer.task_id, StudentAnswer.attempt_number.desc()
    ).all()

    latest_by_task = {}
    for answer in answers:
        latest_by_task.setdefault(answer.task_id, answer)

    items = []
    for task_id, answer in latest_by_task.items():
        if answer.is_correct:
            continue
        task = Task.query.get(task_id)
        if task is None:
            continue
        subsection = Subsection.query.get(task.subsection_id)
        items.append({
            "task_title": task.title,
            "subsection_title": subsection.title if subsection else None,
            "attempt_number": answer.attempt_number,
        })
    return items


def _recent_activity(student, limit=10):
    answers = StudentAnswer.query.filter_by(student_id=student.id).order_by(
        StudentAnswer.submitted_at.desc()
    ).limit(limit).all()

    items = []
    for answer in answers:
        task = Task.query.get(answer.task_id)
        subsection = Subsection.query.get(task.subsection_id) if task else None
        items.append({
            "task_title": task.title if task else None,
            "subsection_title": subsection.title if subsection else None,
            "is_correct": answer.is_correct,
            "attempt_number": answer.attempt_number,
            "submitted_at": answer.submitted_at.isoformat(),
        })
    return items


@admin_students_bp.route("/api/admin/students", methods=["GET"])
@authenticate_token
def list_students():
    role, current_user = _current_role_and_user()
    if role is None:
        return jsonify({"error": "Missing required role: admin or ROLE_TEACHER"}), 403

    query = User.query.filter_by(role="student")
    if role == "teacher":
        query = query.filter_by(teacher_id=current_user.id)

    total_tasks = Task.query.count()
    students = query.all()
    return jsonify([_student_json(s, total_tasks) for s in students]), 200


@admin_students_bp.route("/api/admin/students/<int:student_id>", methods=["GET"])
@authenticate_token
def get_student(student_id):
    role, current_user = _current_role_and_user()
    if role is None:
        return jsonify({"error": "Missing required role: admin or ROLE_TEACHER"}), 403

    student = User.query.filter_by(id=student_id, role="student").first()
    if student is None:
        return jsonify({"error": "student not found"}), 404

    # Nauczyciel nie widzi cudzych uczniów -- 404, nie 403, żeby nie zdradzać
    # że dany uczeń w ogóle istnieje w systemie.
    if role == "teacher" and student.teacher_id != current_user.id:
        return jsonify({"error": "student not found"}), 404

    total_tasks = Task.query.count()
    payload = _student_json(student, total_tasks)
    payload["section_progress"] = _section_progress(student)
    payload["needs_practice"] = _needs_practice(student)
    payload["recent_activity"] = _recent_activity(student)
    return jsonify(payload), 200


@admin_students_bp.route("/api/admin/students/<int:student_id>", methods=["PATCH"])
@authenticate_token
@require_realm_role("admin")
def update_student(student_id):
    student = User.query.filter_by(id=student_id, role="student").first()
    if student is None:
        return jsonify({"error": "student not found"}), 404

    data = request.get_json()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    if "teacher_id" in data:
        teacher_id = data.get("teacher_id")
        if not isinstance(teacher_id, int):
            return jsonify({"error": "teacher_id must be an integer"}), 400

        teacher = User.query.filter_by(id=teacher_id, role="teacher").first()
        if teacher is None:
            return jsonify({"error": "teacher not found"}), 404

        student.teacher_id = teacher.id

    db.session.commit()
    return jsonify(_student_json(student, Task.query.count())), 200

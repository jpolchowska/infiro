from flask import Blueprint, jsonify, request

from app.auth import authenticate_token, require_realm_role
from app.constants import RealmRole, UserRole
from app.extensions import db
from app.models.leveling_test_attempts import LevelingTestAttempt
from app.models.section_test_attempts import SectionTestAttempt
from app.models.users import User
from app.payload import json_object
from app.services.final_test import final_test_attempt_detail
from app.services.leveling_test_history import attempt_detail
from app.services.student_reports import student_report, student_summaries, student_summary, teacher_json
from app.services.users import get_or_create_user

bp = Blueprint("admin_students", __name__, url_prefix="/api/admin")

MISSING_ROLE = "Missing required role: admin or ROLE_TEACHER"


def _viewer():
    realm_roles = request.user.get("realm_access", {}).get("roles", [])

    if RealmRole.ADMIN in realm_roles:
        return RealmRole.ADMIN, None

    if RealmRole.TEACHER in realm_roles:
        return RealmRole.TEACHER, get_or_create_user(request.user, UserRole.TEACHER)

    return None, None


@bp.route("/teachers", methods=["GET"])
@authenticate_token
@require_realm_role(RealmRole.ADMIN)
def list_teachers():
    teachers = (
        User.query.filter_by(role=UserRole.TEACHER)
        .order_by(User.last_name, User.first_name, User.id)
        .all()
    )
    return jsonify([teacher_json(teacher) for teacher in teachers]), 200


@bp.route("/students", methods=["GET"])
@authenticate_token
def list_students():
    role, teacher = _viewer()
    if role is None:
        return jsonify({"error": MISSING_ROLE}), 403

    query = User.query.filter_by(role=UserRole.STUDENT)
    if role == RealmRole.TEACHER:
        query = query.filter_by(teacher_id=teacher.id)

    return jsonify(student_summaries(query.all())), 200


def _visible_student(student_id):
    role, teacher = _viewer()
    if role is None:
        return None, (jsonify({"error": MISSING_ROLE}), 403)

    student = User.query.filter_by(id=student_id, role=UserRole.STUDENT).first()
    if student is None or (role == RealmRole.TEACHER and student.teacher_id != teacher.id):
        return None, (jsonify({"error": "Student not found"}), 404)

    return student, None


@bp.route("/students/<int:student_id>", methods=["GET"])
@authenticate_token
def get_student(student_id):
    student, error = _visible_student(student_id)
    if error:
        return error

    return jsonify(student_report(student)), 200


@bp.route("/students/<int:student_id>/leveling-tests/<int:attempt_id>", methods=["GET"])
@authenticate_token
def get_student_leveling_test(student_id, attempt_id):
    student, error = _visible_student(student_id)
    if error:
        return error

    attempt = LevelingTestAttempt.query.filter_by(id=attempt_id, student_id=student.id).first()
    if attempt is None:
        return jsonify({"error": "Leveling test not found"}), 404

    return jsonify(attempt_detail(attempt)), 200


@bp.route("/students/<int:student_id>", methods=["PATCH"])
@authenticate_token
@require_realm_role(RealmRole.ADMIN)
def update_student(student_id):
    student = User.query.filter_by(id=student_id, role=UserRole.STUDENT).first()
    if student is None:
        return jsonify({"error": "Student not found"}), 404

    data = json_object()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    if "teacher_id" in data:
        teacher_id = data.get("teacher_id")

        if teacher_id is not None:
            if not isinstance(teacher_id, int):
                return jsonify({"error": "teacher_id must be an integer or null"}), 400

            teacher = User.query.filter_by(id=teacher_id, role=UserRole.TEACHER).first()
            if teacher is None:
                return jsonify({"error": "Teacher not found"}), 404

        student.teacher_id = teacher_id

    db.session.commit()

    return jsonify(student_summary(student)), 200


@bp.route("/students/<int:student_id>/final-tests/<int:attempt_id>", methods=["GET"])
@authenticate_token
def get_student_final_test(student_id, attempt_id):
    student, error = _visible_student(student_id)
    if error:
        return error

    attempt = SectionTestAttempt.query.filter_by(id=attempt_id, student_id=student.id).first()
    if attempt is None:
        return jsonify({"error": "Final test not found"}), 404

    return jsonify(final_test_attempt_detail(attempt)), 200

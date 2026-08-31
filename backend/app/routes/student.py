from flask import Blueprint, jsonify, request, redirect, url_for

from app.middleware.auth import authenticate_token
from app.middleware.auth import require_role
from app.models.users import User
from app.services.users import get_or_create_user, update_interest
from app.extensions import db
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.models.student_answers import StudentAnswer

student_bp = Blueprint("student", __name__)


@student_bp.route("/api/student", methods=["GET"])
@authenticate_token
@require_role("Uczeń")
def student():
    return jsonify({
        "message": "Hello"
    })


def _current_user():
    """Znajduje User po claimie 'sub' z JWT. Zwraca None, jeśli nie ma
    jeszcze lokalnego wiersza -- używane tam, gdzie brak wiersza ma być
    błędem (np. leveling-test wymaga wcześniejszego wywołania /me),
    w odróżnieniu od get_or_create_user(), który go zakłada.
    """
    sub = request.user.get("sub")
    return User.query.filter_by(keycloak_sub=sub).first()


@student_bp.route("/api/student/me", methods=["GET"])
@authenticate_token
def me():
    user = get_or_create_user("student")

    return jsonify({
        "id": user.id,
        "role": user.role,
        "leveling_test_completed": user.leveling_test_completed_at is not None,
        "interest": user.interest
    }), 200

@student_bp.route("/api/student/interest", methods=["PATCH"])
@authenticate_token
def add_interest():
    user = _current_user()
    if not user:
        return jsonify({"error": "User not found"}), 404

    update_interest()

    return "", 204

def _get_section_index(section_id):
    sections = (
        Section.query
        .order_by(Section.order_index, Section.id)
        .all()
    )

    for index, section in enumerate(sections):
        if section.id == section_id:
            return index

    return None

def _get_solved_task_ids(student_id, subsection_id=None):
    query = (
        db.session.query(StudentAnswer.task_id)
        .join(Task, StudentAnswer.task_id == Task.id)
        .filter(
            StudentAnswer.student_id == student_id,
            StudentAnswer.is_correct.is_(True),
        )
        .distinct()
    )

    if subsection_id is not None:
        query = query.filter(Task.subsection_id == subsection_id)

    return {task_id for (task_id,) in query.all()}

def _student_subsection_json(student_id, subsection):
    progress = _subsection_progress(student_id, subsection)

    return {
        "id": subsection.id,
        "title": subsection.title,
        "description": subsection.description,
        "solved_tasks": progress["solved_tasks"],
        "total_tasks": progress["total_tasks"],
    }

def _subsection_progress(student_id, subsection):
    total_tasks = (
        Task.query
        .filter_by(subsection_id=subsection.id)
        .count()
    )

    solved_task_ids = _get_solved_task_ids(
        student_id,
        subsection.id
    )

    return {
        "solved_tasks": len(solved_task_ids),
        "total_tasks": total_tasks,
    }

@student_bp.route("/api/student/sections")
@authenticate_token
def get_student_sections():
    student = _current_user()
    student_id = student.id
    sections = ( 
        Section.query 
        .order_by(Section.order_index) 
        .all()
          ) 
    
    result = [] 

    for index, section in enumerate(sections): 
        subsections = ( 
            Subsection.query 
            .filter_by(section_id=section.id) 
            .order_by(Subsection.order_index, Subsection.id) 
            .all() 
            ) 
        
        subsection_data = [] 

        for subsection in subsections:
             subsection_data.append( 
                _student_subsection_json( 
                    student_id, 
                    subsection )
             )
        result.append({ 
            "id": section.id, 
            "title": section.title, 
            "description": section.description, 
            "index": index, "subsections": subsection_data,
            })
    return jsonify(result), 200


@student_bp.route("/api/student/subsections/<int:subsection_id>/tasks")
def get_student_subsection_tasks(subsection_id):
    student = _current_user()
    student_id = student.id

    subsection = db.session.get(Subsection, subsection_id)

    if subsection is None:
        return jsonify({"message": "Subsection not found"}), 404

    section = db.session.get(Section, subsection.section_id)

    solved_task_ids = _get_solved_task_ids(
        student_id,
        subsection.id,
    )

    tasks = (
        Task.query
        .filter_by(subsection_id=subsection.id)
        .order_by(Task.difficulty_level, Task.id)
        .all()
    )

    first_unsolved_found = False
    task_data = []

    for task in tasks:
        if task.id in solved_task_ids:
            status = "done"
        elif not first_unsolved_found:
            status = "current"
            first_unsolved_found = True
        else:
            status = "todo"

        task_data.append(
            {
                "id": task.id,
                "title": task.title,
                "difficulty_level": task.difficulty_level,
                "status": status,
            }
        )

    next_subsection = (
        Subsection.query
        .filter(
            Subsection.section_id == subsection.section_id,
            Subsection.order_index > subsection.order_index,
        )
        .order_by(Subsection.order_index, Subsection.id)
        .first()
    )

    return jsonify(
        {
            "id": subsection.id,
            "title": subsection.title,
            "description": subsection.description,
            "section_id": section.id,
            "section_title": section.title,
            "section_index": _get_section_index(section.id),
            "next_subsection_id": (
                next_subsection.id
                if next_subsection is not None
                else None
            ),
            "tasks": task_data,
        }
    ), 200

@student_bp.route("/api/student/stats")
def get_student_stats():
    ...
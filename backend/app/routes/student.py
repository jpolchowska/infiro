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
from app.models.leveling_test_attempts import LevelingTestAttempt
from app.models.task_answer_options import TaskAnswerOption
student_bp = Blueprint("student", __name__)


@student_bp.route("/api/student", methods=["GET"])
@authenticate_token
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

    try:
        update_interest()
    except ValueError:
        return jsonify({"error": "Invalid interest"}), 400

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

@student_bp.route("/api/student/tasks/<int:task_id>", methods=["GET"])
@authenticate_token
def get_student_task(task_id):
    student = _current_user()

    if student is None:
        return jsonify({
            "error": "User not found"
        }), 404

    task = db.session.get(Task, task_id)

    if task is None:
        return jsonify({
            "error": "Task not found"
        }), 404

    options = (
        TaskAnswerOption.query
        .filter_by(task_id=task.id)
        .order_by(TaskAnswerOption.order_index)
        .all()
    )

    return jsonify({
        "id": task.id,
        "type": "single_choice",
        "difficulty_level": task.difficulty_level,
        "prompt": task.body_text,
        "options": [
            {
                "id": option.id,
                "text": option.option_text
            }
            for option in options
        ],
        "attempts_used": (
            StudentAnswer.query
            .filter_by(
                task_id=task.id,
                student_id=student.id
            )
            .count()
        ),
        "max_attempts": 3,
        "solution": None
    }), 200

@student_bp.route("/api/student/tasks/<int:task_id>/answers",methods=["POST"])
@authenticate_token
def submit_student_answer(task_id):
    student = _current_user()

    if student is None:
        return jsonify({
            "error": "User not found"
        }), 404

    task = db.session.get(Task, task_id)

    if task is None:
        return jsonify({
            "error": "Task not found"
        }), 404

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "Invalid JSON body"
        }), 400

    # ---------------------------------------------------------
    # MEMORY
    # ---------------------------------------------------------

    if task.type == "memory":
        if data.get("completed") is not True:
            return jsonify({
                "error": "completed must be true"
            }), 400

        answer = StudentAnswer(
            task_id=task.id,
            student_id=student.id,
            is_correct=True,
            attempt_number=1
        )

        db.session.add(answer)
        db.session.commit()

        return jsonify({
            "is_correct": True,
            "attempt_number": 1,
            "attempts_left": None,
            "solution": None
        }), 200

    # ---------------------------------------------------------
    # SINGLE CHOICE / SHORT ANSWER
    # ---------------------------------------------------------

    if task.type not in ("single_choice", "short_answer"):
        return jsonify({
            "error": "Unsupported task type"
        }), 400


    attempts_used = (
        StudentAnswer.query
        .filter_by(
            task_id=task.id,
            student_id=student.id
        )
        .count()
    )

    already_solved = (
        StudentAnswer.query
        .filter_by(
            task_id=task.id,
            student_id=student.id,
            is_correct=True
        )
        .first()
        is not None
    )

    if already_solved or attempts_used >= 3:
        return jsonify({
            "error": "Task is already closed"
        }), 409

    attempt_number = attempts_used + 1

    # ---------------------------------------------------------
    # SINGLE CHOICE
    # ---------------------------------------------------------

    if task.type == "single_choice":
        selected_option_id = data.get("selected_option_id")

        if not isinstance(selected_option_id, int):
            return jsonify({
                "error": "selected_option_id is required"
            }), 400

        option = (
            TaskAnswerOption.query
            .filter_by(
                id=selected_option_id,
                task_id=task.id
            )
            .first()
        )

        if option is None:
            return jsonify({
                "error": "Invalid option"
            }), 400

        is_correct = option.is_correct

        answer = StudentAnswer(
            task_id=task.id,
            student_id=student.id,
            selected_option_id=selected_option_id,
            is_correct=is_correct,
            attempt_number=attempt_number
        )

    # ---------------------------------------------------------
    # SHORT ANSWER
    # ---------------------------------------------------------

    else:
        answer_text = data.get("answer_text")

        if not isinstance(answer_text, str):
            return jsonify({
                "error": "answer_text is required"
            }), 400

        def normalize_answer(value):
            value = value.strip()
            value = re.sub(r"\s+", " ", value)
            value = value.lower()
            value = value.replace(",", ".")
            return value

        normalized_answer = normalize_answer(answer_text)

        accepted_answers = task.accepted_answers or []

        is_correct = any(
            normalized_answer == normalize_answer(accepted)
            for accepted in accepted_answers
        )

        answer = StudentAnswer(
            task_id=task.id,
            student_id=student.id,
            answer_text=answer_text,
            is_correct=is_correct,
            attempt_number=attempt_number
        )

    # ---------------------------------------------------------
    # SAVE
    # ---------------------------------------------------------

    db.session.add(answer)
    db.session.commit()

    attempts_left = 3 - attempt_number

    solution = None
    if not is_correct and attempts_left == 0:

        if task.type == "single_choice":
            correct_option = (
                TaskAnswerOption.query
                .filter_by(
                    task_id=task.id,
                    is_correct=True
                )
                .first()
            )

            solution = {
                "correct_option_id": correct_option.id
            }

        elif task.type == "short_answer":
            solution = {
                "accepted_answers": task.accepted_answers or []
            }

    return jsonify({
        "is_correct": is_correct,
        "attempt_number": attempt_number,
        "attempts_left": attempts_left,
        "solution": solution
    }), 200


@student_bp.route("/api/student/subsections/<int:subsection_id>/tasks")
@authenticate_token
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

def _get_section_progress(student_id, section):
    subsections = (
        Subsection.query
        .filter_by(section_id=section.id)
        .all()
    )

    solved_tasks = 0
    total_tasks = 0

    for subsection in subsections:
        progress = _subsection_progress(
            student_id,
            subsection,
        )

        solved_tasks += progress["solved_tasks"]
        total_tasks += progress["total_tasks"]

    return {
        "solved_tasks": solved_tasks,
        "total_tasks": total_tasks,
    }

def _get_current_subsection(student_id):
    answers = (
        db.session.query(
            StudentAnswer.submitted_at,
            Task.subsection_id,
        )
        .join(Task, StudentAnswer.task_id == Task.id)
        .filter(
            StudentAnswer.student_id == student_id,
        )
        .order_by(StudentAnswer.submitted_at.desc())
        .all()
    )

    checked_subsections = set()

    for submitted_at, subsection_id in answers:
        if subsection_id in checked_subsections:
            continue

        checked_subsections.add(subsection_id)

        subsection = db.session.get(
            Subsection,
            subsection_id,
        )

        if subsection is None:
            continue

        progress = _subsection_progress(
            student_id,
            subsection,
        )

        if progress["solved_tasks"] < progress["total_tasks"]:
            return subsection

    return None

def _get_recent_sections(student_id, limit=5):
    rows = (
        db.session.query(
            StudentAnswer.submitted_at,
            Section.id,
        )
        .join(Task, StudentAnswer.task_id == Task.id)
        .join(Subsection, Task.subsection_id == Subsection.id)
        .join(Section, Subsection.section_id == Section.id)
        .filter(
            StudentAnswer.student_id == student_id,
        )
        .order_by(StudentAnswer.submitted_at.desc())
        .all()
    )

    section_ids = []

    for submitted_at, section_id in rows:
        if section_id not in section_ids:
            section_ids.append(section_id)

        if len(section_ids) >= limit:
            break

    return [
        db.session.get(Section, section_id)
        for section_id in section_ids
    ]

def _current_subsection_json(student_id, subsection):
    if subsection is None:
        return None

    section = db.session.get(
        Section,
        subsection.section_id,
    )

    progress = _subsection_progress(
        student_id,
        subsection,
    )

    return {
        "subsection_id": subsection.id,
        "subsection_title": subsection.title,
        "section_title": section.title,
        "section_index": _get_section_index(section.id),
        "solved_tasks": progress["solved_tasks"],
        "total_tasks": progress["total_tasks"],
    }

@student_bp.route("/api/student/stats")
@authenticate_token
def get_student_stats():
    student = _current_user()
    student_id = student.id

    total_tasks = Task.query.count()

    solved_task_ids = _get_solved_task_ids(student_id)

    solved_tasks = len(solved_task_ids)

    total_attempts = (
        StudentAnswer.query
        .filter_by(student_id=student_id)
        .count()
    )

    correct_attempts = (
        StudentAnswer.query
        .filter_by(
            student_id=student_id,
            is_correct=True,
        )
        .count()
    )

    if total_attempts == 0:
        accuracy = None
    else:
        accuracy = round(
            100 * correct_attempts / total_attempts
        )

    started_sections = (
        db.session.query(Section.id)
        .join(Subsection, Subsection.section_id == Section.id)
        .join(Task, Task.subsection_id == Subsection.id)
        .join(StudentAnswer, StudentAnswer.task_id == Task.id)
        .filter(
            StudentAnswer.student_id == student_id,
            StudentAnswer.is_correct.is_(True),
        )
        .distinct()
        .count()
    )

    current_subsection = _get_current_subsection(
        student_id,
    )

    recent_sections = _get_recent_sections(
        student_id,
        limit=5,
    )

    recent_section_data = []

    for section in recent_sections:
        progress = _get_section_progress(
            student_id,
            section,
        )

        recent_section_data.append(
            {
                "section_id": section.id,
                "section_title": section.title,
                "section_index": _get_section_index(section.id),
                "solved_tasks": progress["solved_tasks"],
                "total_tasks": progress["total_tasks"],
            }
        )

    last_leveling_test = (
    LevelingTestAttempt.query
    .filter_by(student_id=student_id)
    .order_by(LevelingTestAttempt.completed_at.desc())
    .first()
)

    return jsonify(
        {
            "solved_tasks": solved_tasks,
            "total_tasks": total_tasks,
            "accuracy": accuracy,
            "started_sections": started_sections,
            "current": _current_subsection_json(
                student_id,
                current_subsection,
            ),
            "recent_sections": recent_section_data,
            "last_leveling_test": (
                {
                    "completed_at": last_leveling_test.completed_at.isoformat(),
                    "score": last_leveling_test.score,
                    "total": last_leveling_test.max_score,
                }
                if last_leveling_test is not None
                else None
            ),
        }
    ), 200
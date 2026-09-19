from datetime import datetime

from app.routes import student as student_routes
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
from app.models.ebooks import ebooks
from app.utills import _task_theme, _get_solved_task_ids, _get_section_index, _get_current_subsection, _get_recent_sections, _get_section_progress, _current_subsection_json, _timed_options, determine_student_difficulty_level_, _student_subsection_json
import random
import re

student_sections_and_subsections_bp = Blueprint("student_sections_and_subsections", __name__)

@student_sections_and_subsections_bp.route("/api/student/sections")
@authenticate_token
def get_student_sections():
    student = student_routes._current_user()
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

@student_sections_and_subsections_bp.route("/api/student/subsections/<int:subsection_id>/tasks")
@authenticate_token
def get_student_subsection_tasks(subsection_id):
    student = student_routes._current_user()
    student_id = student.id

    subsection = db.session.get(Subsection, subsection_id)

    if subsection is None:
        return jsonify({"message": "Subsection not found"}), 404

    section = db.session.get(Section, subsection.section_id)

    solved_task_ids = _get_solved_task_ids(
        student_id,
        subsection.id,
    )

    student_difficulty_level = determine_student_difficulty_level_(
        student_id,
        subsection.id
    )

    tasks = (
        Task.query
        .filter(
            Task.subsection_id == subsection.id,
            Task.difficulty_level <= student_difficulty_level
        )
        .order_by(Task.order_index, Task.id)
        .all()
    )

    first_unsolved_found = False
    task_data = []

    for position, task in enumerate(tasks, start=1):
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
                "position": task.order_index if task.order_index > 0 else position,
                "type": task.type,
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

@student_sections_and_subsections_bp.route("/api/student/subsections/<int:id>/ebook",methods=["GET"])
@authenticate_token
def get_student_ebook(id):
    ebook = ebooks.query.filter_by(subsection_id=id).first()

    if ebook is None:
        return jsonify({
            "error": "Ebook not found"
        }), 404
    else:
        return jsonify({
            "title": ebook.title,
            "intro": ebook.intro,
            "blocks": ebook.content
        }), 200
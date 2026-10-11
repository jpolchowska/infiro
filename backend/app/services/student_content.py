from app.extensions import db
from app.models.section_test_attempts import SectionTestAttempt
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.services.progress import (
    determine_student_difficulty_level,
    get_section_index,
    get_solved_task_ids,
    student_subsection_json,
)


def _last_final_test(student_id, section_id):
    return (
        SectionTestAttempt.query
        .filter_by(student_id=student_id, section_id=section_id)
        .order_by(SectionTestAttempt.completed_at.desc())
        .first()
    )


def list_sections(student_id):
    result = []
    for index, section in enumerate(Section.query.order_by(Section.order_index).all()):
        subsections = (
            Subsection.query
            .filter_by(section_id=section.id)
            .order_by(Subsection.order_index, Subsection.id)
            .all()
        )
        last_final_test = _last_final_test(student_id, section.id)
        result.append({
            "id": section.id,
            "title": section.title,
            "description": section.description,
            "index": index,
            "subsections": [
                student_subsection_json(student_id, subsection)
                for subsection in subsections
            ],
            "last_final_test_score": last_final_test.score if last_final_test else None,
            "last_final_test_max_score": last_final_test.max_score if last_final_test else None,
        })
    return result


def _task_statuses(tasks, solved_task_ids):
    current_assigned = False
    result = []
    for position, task in enumerate(tasks, start=1):
        if task.id in solved_task_ids:
            status = "done"
        elif not current_assigned:
            status = "current"
            current_assigned = True
        else:
            status = "todo"

        result.append({
            "id": task.id,
            "position": task.order_index if task.order_index > 0 else position,
            "type": task.type,
            "difficulty_level": task.difficulty_level,
            "status": status,
        })
    return result


def _next_subsection(subsection):
    return (
        Subsection.query
        .filter(
            Subsection.section_id == subsection.section_id,
            Subsection.order_index > subsection.order_index,
        )
        .order_by(Subsection.order_index, Subsection.id)
        .first()
    )


def subsection_overview(student_id, subsection):
    section = db.session.get(Section, subsection.section_id)
    unlocked_level = determine_student_difficulty_level(student_id, subsection.id)
    tasks = (
        Task.query
        .filter(
            Task.subsection_id == subsection.id,
            Task.difficulty_level <= unlocked_level,
        )
        .order_by(Task.order_index, Task.id)
        .all()
    )
    next_subsection = _next_subsection(subsection)

    return {
        "id": subsection.id,
        "title": subsection.title,
        "description": subsection.description,
        "section_id": section.id,
        "section_title": section.title,
        "section_index": get_section_index(section.id),
        "next_subsection_id": next_subsection.id if next_subsection is not None else None,
        "tasks": _task_statuses(tasks, get_solved_task_ids(student_id, subsection.id)),
    }

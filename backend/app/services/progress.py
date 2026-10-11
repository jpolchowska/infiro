from app.extensions import db
from app.models.sections import Section
from app.models.student_answers import StudentAnswer
from app.models.subsections import Subsection
from app.models.tasks import Task


def get_solved_task_ids(student_id, subsection_id=None):
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


def get_section_index(section_id):
    sections = (
        Section.query
        .order_by(Section.order_index, Section.id)
        .all()
    )

    for index, section in enumerate(sections):
        if section.id == section_id:
            return index

    return None


def get_subsection_progress(student_id, subsection):
    total_tasks = (
        Task.query
        .filter_by(subsection_id=subsection.id)
        .count()
    )

    solved_task_ids = get_solved_task_ids(
        student_id,
        subsection.id
    )

    return {
        "solved_tasks": len(solved_task_ids),
        "total_tasks": total_tasks,
    }


def get_section_progress(student_id, section):
    subsections = (
        Subsection.query
        .filter_by(section_id=section.id)
        .all()
    )

    solved_tasks = 0
    total_tasks = 0

    for subsection in subsections:
        progress = get_subsection_progress(
            student_id,
            subsection,
        )

        solved_tasks += progress["solved_tasks"]
        total_tasks += progress["total_tasks"]

    return {
        "solved_tasks": solved_tasks,
        "total_tasks": total_tasks,
    }


def get_current_subsection(student_id):
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

        progress = get_subsection_progress(
            student_id,
            subsection,
        )

        if progress["solved_tasks"] < progress["total_tasks"]:
            return subsection

    return None


def get_recent_sections(student_id, limit=5):
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


def determine_student_difficulty_level(student_id, subsection_id):
    tasks_done_by_student = (
        db.session.query(
            StudentAnswer.task_id,
            Task.difficulty_level,
            Task.subsection_id,
        )
        .join(Task, StudentAnswer.task_id == Task.id)
        .filter(
            StudentAnswer.student_id == student_id,
            StudentAnswer.is_correct.is_(True),
            Task.subsection_id == subsection_id,
        )
        .distinct()
        .all()
    )

    all_tasks_in_subsection = (
        db.session.query(Task.id, Task.difficulty_level, Task.subsection_id)
        .filter(Task.subsection_id == subsection_id)
        .all()
    )

    for i in range(1, 4, 1):
        remaining_tasks = 0

        for task in all_tasks_in_subsection:
            if task.difficulty_level == i:
                remaining_tasks += 1

        for task in tasks_done_by_student:
            if (
                task.subsection_id == subsection_id
                and task.difficulty_level == i
            ):
                remaining_tasks -= 1

        if remaining_tasks > 0:
            return i

    max_difficulty = (
        db.session.query(Task.difficulty_level)
        .filter(
            Task.subsection_id == subsection_id,
            Task.difficulty_level.isnot(None),
        )
        .order_by(Task.difficulty_level.desc())
        .first()
    )
    return max_difficulty.difficulty_level if max_difficulty else 3


def current_subsection_json(student_id, subsection):
    if subsection is None:
        return None

    section = db.session.get(
        Section,
        subsection.section_id,
    )

    progress = get_subsection_progress(
        student_id,
        subsection,
    )

    return {
        "subsection_id": subsection.id,
        "subsection_title": subsection.title,
        "section_title": section.title,
        "section_index": get_section_index(section.id),
        "solved_tasks": progress["solved_tasks"],
        "total_tasks": progress["total_tasks"],
    }


def student_subsection_json(student_id, subsection):
    progress = get_subsection_progress(student_id, subsection)

    return {
        "id": subsection.id,
        "title": subsection.title,
        "description": subsection.description,
        "solved_tasks": progress["solved_tasks"],
        "total_tasks": progress["total_tasks"],
    }

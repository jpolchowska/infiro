from app.extensions import db
from app.models.leveling_test_attempts import LevelingTestAttempt
from app.models.sections import Section
from app.models.student_answers import StudentAnswer
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.serializers import iso_utc
from app.services.progress import (
    current_subsection_json,
    get_current_subsection,
    get_recent_sections,
    get_section_index,
    get_section_progress,
    get_solved_task_ids,
)

RECENT_SECTIONS_LIMIT = 5


def _accuracy(student_id):
    attempts = StudentAnswer.query.filter_by(student_id=student_id)
    total = attempts.count()
    if total == 0:
        return None
    return round(100 * attempts.filter_by(is_correct=True).count() / total)


def _started_sections(student_id):
    return (
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


def _recent_sections(student_id):
    result = []
    for section in get_recent_sections(student_id, limit=RECENT_SECTIONS_LIMIT):
        progress = get_section_progress(student_id, section)
        result.append({
            "section_id": section.id,
            "section_title": section.title,
            "section_index": get_section_index(section.id),
            "solved_tasks": progress["solved_tasks"],
            "total_tasks": progress["total_tasks"],
        })
    return result


def _last_leveling_test(student_id):
    attempt = (
        LevelingTestAttempt.query
        .filter_by(student_id=student_id)
        .order_by(LevelingTestAttempt.completed_at.desc())
        .first()
    )
    if attempt is None:
        return None
    return {
        "completed_at": iso_utc(attempt.completed_at),
        "score": attempt.score,
        "total": attempt.max_score,
    }


def build_student_stats(student_id):
    return {
        "solved_tasks": len(get_solved_task_ids(student_id)),
        "total_tasks": Task.query.count(),
        "accuracy": _accuracy(student_id),
        "started_sections": _started_sections(student_id),
        "current": current_subsection_json(student_id, get_current_subsection(student_id)),
        "recent_sections": _recent_sections(student_id),
        "last_leveling_test": _last_leveling_test(student_id),
    }

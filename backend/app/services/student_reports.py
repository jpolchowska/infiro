from datetime import timedelta

from app.clock import utc_now
from app.extensions import db
from app.models.leveling_test_attempts import LevelingTestAttempt
from app.models.section_test_attempts import SectionTestAttempt
from app.models.section_test_questions import SectionTestQuestion
from app.models.sections import Section
from app.models.student_answers import StudentAnswer
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.models.users import User
from app.serializers import attempt_json, iso_utc
from app.services.content_preview import task_reference
from app.services.leveling_test_history import leveling_test_history
from app.services.leveling_test_settings import get_settings, leveling_test_state
from app.services.progress import (
    current_subsection_json,
    determine_student_difficulty_level,
    get_current_subsection,
    get_subsection_progress,
)

RECENT_ACTIVITY_LIMIT = 10
SHORT_ACTIVITY_WINDOW = timedelta(days=7)
LONG_ACTIVITY_WINDOW = timedelta(days=30)


def teacher_json(teacher):
    return {
        "id": teacher.id,
        "username": teacher.username,
        "name": teacher.name,
    }


def _last_leveling_test(student_id):
    attempt = (
        LevelingTestAttempt.query.filter_by(student_id=student_id)
        .order_by(LevelingTestAttempt.completed_at.desc())
        .first()
    )
    if attempt is None:
        return None
    return {
        "score": attempt.score,
        "total": attempt.max_score,
        "completed_at": iso_utc(attempt.completed_at),
    }


def _summary(student, total_tasks, settings):
    answers = StudentAnswer.query.filter_by(student_id=student.id).all()
    correct_attempts = sum(1 for answer in answers if answer.is_correct)
    last_activity = max((answer.submitted_at for answer in answers), default=None)
    teacher = db.session.get(User, student.teacher_id) if student.teacher_id else None

    return {
        "id": student.id,
        "username": student.username,
        "interest": student.interest,
        "joined_at": iso_utc(student.created_at),
        "teacher_id": student.teacher_id,
        "teacher_username": teacher.username if teacher else None,
        "teacher_name": teacher.name if teacher else None,
        "solved_tasks": len({answer.task_id for answer in answers if answer.is_correct}),
        "total_tasks": total_tasks,
        "accuracy": round(100 * correct_attempts / len(answers)) if answers else None,
        "total_attempts": len(answers),
        "correct_attempts": correct_attempts,
        "last_activity": iso_utc(last_activity),
        "leveling_test_completed_at": iso_utc(student.leveling_test_completed_at),
        "leveling_test": leveling_test_state(student, settings),
        "last_leveling_test": _last_leveling_test(student.id),
    }


def _activity(student_id):
    now = utc_now()
    recent = StudentAnswer.query.filter(
        StudentAnswer.student_id == student_id,
        StudentAnswer.submitted_at >= now - LONG_ACTIVITY_WINDOW,
    ).all()
    return {
        "answers_last_7_days": sum(1 for answer in recent if answer.submitted_at >= now - SHORT_ACTIVITY_WINDOW),
        "answers_last_30_days": len(recent),
        "active_days_last_30_days": len({answer.submitted_at.date() for answer in recent}),
    }


def _final_test_summary(student_id, section_id):
    question_count = SectionTestQuestion.query.filter_by(section_id=section_id).count()
    attempts = (
        SectionTestAttempt.query.filter_by(student_id=student_id, section_id=section_id)
        .order_by(SectionTestAttempt.completed_at.desc())
        .all()
    )
    if question_count == 0 and not attempts:
        return None

    last = attempts[0] if attempts else None
    return {
        "question_count": question_count,
        "attempts": len(attempts),
        "history": [{"id": attempt.id, **attempt_json(attempt)} for attempt in attempts],
        "best_score": max((attempt.score for attempt in attempts), default=None),
        "last_score": last.score if last else None,
        "max_score": last.max_score if last else None,
        "last_completed_at": iso_utc(last.completed_at) if last else None,
    }


def _subsection_progress(student_id, subsection):
    progress = get_subsection_progress(student_id, subsection)
    return {
        "subsection_id": subsection.id,
        "subsection_title": subsection.title,
        "solved_tasks": progress["solved_tasks"],
        "total_tasks": progress["total_tasks"],
        "unlocked_level": determine_student_difficulty_level(student_id, subsection.id),
    }


def _sections(student):
    result = []
    for section in Section.query.order_by(Section.order_index).all():
        subsections = (
            Subsection.query.filter_by(section_id=section.id)
            .order_by(Subsection.order_index, Subsection.id)
            .all()
        )
        subsection_rows = [_subsection_progress(student.id, subsection) for subsection in subsections]
        total_tasks = sum(row["total_tasks"] for row in subsection_rows)
        if total_tasks == 0:
            continue

        result.append({
            "section_id": section.id,
            "section_title": section.title,
            "solved_tasks": sum(row["solved_tasks"] for row in subsection_rows),
            "total_tasks": total_tasks,
            "subsections": subsection_rows,
            "final_test": _final_test_summary(student.id, section.id),
        })
    return result


def _needs_practice(student):
    answers = StudentAnswer.query.filter_by(student_id=student.id).order_by(
        StudentAnswer.task_id, StudentAnswer.id.desc()
    ).all()

    latest_by_task = {}
    for answer in answers:
        latest_by_task.setdefault(answer.task_id, answer)

    items = []
    for task_id, answer in latest_by_task.items():
        if answer.is_correct:
            continue
        task = db.session.get(Task, task_id)
        if task is None:
            continue
        items.append({**task_reference(task), "attempt_number": answer.attempt_number})
    return items


def _recent_activity(student, limit=RECENT_ACTIVITY_LIMIT):
    answers = StudentAnswer.query.filter_by(student_id=student.id).order_by(
        StudentAnswer.submitted_at.desc(), StudentAnswer.id.desc()
    ).limit(limit).all()

    items = []
    for answer in answers:
        task = db.session.get(Task, answer.task_id)
        if task is None:
            continue
        items.append({
            **task_reference(task),
            "is_correct": answer.is_correct,
            "attempt_number": answer.attempt_number,
            "submitted_at": iso_utc(answer.submitted_at),
        })
    return items


def student_summary(student):
    return _summary(student, Task.query.count(), get_settings())


def student_summaries(students):
    total_tasks = Task.query.count()
    settings = get_settings()
    return [_summary(student, total_tasks, settings) for student in students]


def student_report(student):
    return {
        **student_summary(student),
        "current_subsection": current_subsection_json(student.id, get_current_subsection(student.id)),
        "activity": _activity(student.id),
        "sections": _sections(student),
        "needs_practice": _needs_practice(student),
        "recent_activity": _recent_activity(student),
        "leveling_tests": leveling_test_history(student),
    }

from app.extensions import db
from app.models.sections import Section
from app.models.student_answers import StudentAnswer
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.serializers import iso_utc

RECENT_ACTIVITY_LIMIT = 10


def full_name(user):
    return f"{user.first_name or ''} {user.last_name or ''}".strip() or None


def teacher_json(teacher):
    return {
        "id": teacher.id,
        "name": full_name(teacher),
        "email": teacher.email,
    }


def _summary(student, total_tasks):
    answers = StudentAnswer.query.filter_by(student_id=student.id).all()
    correct_attempts = sum(1 for answer in answers if answer.is_correct)
    last_activity = max((answer.submitted_at for answer in answers), default=None)

    return {
        "id": student.id,
        "name": full_name(student),
        "email": student.email,
        "teacher_id": student.teacher_id,
        "solved_tasks": len({answer.task_id for answer in answers if answer.is_correct}),
        "total_tasks": total_tasks,
        "accuracy": round(100 * correct_attempts / len(answers)) if answers else None,
        "total_attempts": len(answers),
        "correct_attempts": correct_attempts,
        "last_activity": iso_utc(last_activity),
        "leveling_test_completed_at": iso_utc(student.leveling_test_completed_at),
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
        task = db.session.get(Task, task_id)
        if task is None:
            continue
        subsection = db.session.get(Subsection, task.subsection_id)
        items.append({
            "task_title": task.title,
            "subsection_title": subsection.title if subsection else None,
            "attempt_number": answer.attempt_number,
        })
    return items


def _recent_activity(student, limit=RECENT_ACTIVITY_LIMIT):
    answers = StudentAnswer.query.filter_by(student_id=student.id).order_by(
        StudentAnswer.submitted_at.desc()
    ).limit(limit).all()

    items = []
    for answer in answers:
        task = db.session.get(Task, answer.task_id)
        subsection = db.session.get(Subsection, task.subsection_id) if task else None
        items.append({
            "task_title": task.title if task else None,
            "subsection_title": subsection.title if subsection else None,
            "is_correct": answer.is_correct,
            "attempt_number": answer.attempt_number,
            "submitted_at": iso_utc(answer.submitted_at),
        })
    return items


def student_summary(student):
    return _summary(student, Task.query.count())


def student_summaries(students):
    total_tasks = Task.query.count()
    return [_summary(student, total_tasks) for student in students]


def student_report(student):
    return {
        **student_summary(student),
        "section_progress": _section_progress(student),
        "needs_practice": _needs_practice(student),
        "recent_activity": _recent_activity(student),
    }

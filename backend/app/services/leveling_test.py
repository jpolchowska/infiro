from app.clock import utc_now
from app.constants import TaskType
from app.extensions import db
from app.models.leveling_test_attempts import LevelingTestAttempt
from app.models.sections import Section
from app.models.student_answers import StudentAnswer
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.serializers import attempt_json
from app.services.answers import grade_answer
from app.services.themes import resolve_theme, shuffled_options, task_options

DIFFICULTY_LEVELS = (1, 2, 3)


def _pick_random_task(section_id, difficulty_level):
    return (
        Task.query.join(Subsection, Task.subsection_id == Subsection.id)
        .filter(
            Subsection.section_id == section_id,
            Task.difficulty_level == difficulty_level,
            Task.type.in_((TaskType.SINGLE_CHOICE, TaskType.SHORT_ANSWER)),
        )
        .order_by(db.func.random())
        .first()
    )


def _question_json(task, interest):
    theme = resolve_theme(task, interest)
    payload = {
        "task_id": task.id,
        "type": task.type,
        "difficulty_level": task.difficulty_level,
        "prompt": theme.get("prompt", task.body_text),
    }
    if task.type == TaskType.SINGLE_CHOICE:
        payload["options"] = shuffled_options(task_options(task, interest))
    return payload


def build_leveling_test(interest):
    sections = []
    for section in Section.query.order_by(Section.order_index).all():
        tasks = (_pick_random_task(section.id, level) for level in DIFFICULTY_LEVELS)
        questions = [_question_json(task, interest) for task in tasks if task is not None]
        if questions:
            sections.append({
                "section_id": section.id,
                "section_title": section.title,
                "questions": questions,
            })
    return {"sections": sections}


def _grade(answers, interest):
    graded = []
    for answer in answers:
        if not isinstance(answer, dict):
            return None, "each answer must be an object"

        task_id = answer.get("task_id")
        task = db.session.get(Task, task_id)
        if task is None:
            return None, f"task {task_id} not found"

        result, error = grade_answer(task, answer, interest, "task", task_options)
        if error:
            return None, error
        graded.append(result)
    return graded, None


def _score_per_section(graded):
    stats_by_section = {}
    for result in graded:
        subsection = db.session.get(Subsection, result.item.subsection_id)
        section = db.session.get(Section, subsection.section_id) if subsection else None
        if section is None:
            continue
        stats = stats_by_section.setdefault(section.id, {
            "section_id": section.id,
            "section_title": section.title,
            "order_index": section.order_index,
            "score": 0,
            "total": 0,
        })
        stats["total"] += 1
        if result.is_correct:
            stats["score"] += 1

    return [
        {
            "section_id": stats["section_id"],
            "section_title": stats["section_title"],
            "score": stats["score"],
            "total": stats["total"],
        }
        for stats in sorted(stats_by_section.values(), key=lambda stats: stats["order_index"])
    ]


def _save_answers(student, graded, submitted_at):
    for result in graded:
        last_attempt = (
            StudentAnswer.query.filter_by(task_id=result.item.id, student_id=student.id)
            .order_by(StudentAnswer.attempt_number.desc())
            .first()
        )
        db.session.add(StudentAnswer(
            task_id=result.item.id,
            student_id=student.id,
            selected_option_id=result.selected_option_id,
            answer_text=result.answer_text,
            is_correct=result.is_correct,
            attempt_number=last_attempt.attempt_number + 1 if last_attempt else 1,
            submitted_at=submitted_at,
        ))


def submit_leveling_test(student, answers):
    graded, error = _grade(answers, student.interest)
    if error:
        return None, error

    score = sum(1 for result in graded if result.is_correct)
    per_section = _score_per_section(graded)
    now = utc_now()

    _save_answers(student, graded, now)
    db.session.add(LevelingTestAttempt(
        student_id=student.id,
        score=score,
        max_score=len(graded),
        completed_at=now,
    ))
    student.leveling_test_completed_at = now
    db.session.commit()

    return {
        "saved": len(graded),
        "score": score,
        "max_score": len(graded),
        "per_section": per_section,
    }, None


def leveling_test_history(student):
    attempts = (
        LevelingTestAttempt.query.filter_by(student_id=student.id)
        .order_by(LevelingTestAttempt.completed_at.desc())
        .all()
    )
    return [attempt_json(attempt) for attempt in attempts]

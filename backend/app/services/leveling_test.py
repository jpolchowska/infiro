from app.clock import utc_now
from app.constants import TaskType
from app.extensions import db
from app.models.leveling_test_answers import LevelingTestAnswer
from app.models.leveling_test_attempts import LevelingTestAttempt
from app.models.leveling_test_section_results import LevelingTestSectionResult
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.serializers import attempt_json
from app.services.answers import grade_answer
from app.services.leveling_test_settings import get_settings
from app.services.themes import resolve_theme, shuffled_options, task_options

DIFFICULTY_LEVELS = (1, 2, 3)
QUESTION_TYPES = (TaskType.SINGLE_CHOICE, TaskType.SHORT_ANSWER)


def _levels_by_preference(level):
    return sorted(DIFFICULTY_LEVELS, key=lambda candidate: (abs(candidate - level), candidate))


def _pick_random_task(section_id, level, excluded_ids):
    for candidate_level in _levels_by_preference(level):
        query = (
            Task.query.join(Subsection, Task.subsection_id == Subsection.id)
            .filter(
                Subsection.section_id == section_id,
                Task.difficulty_level == candidate_level,
                Task.type.in_(QUESTION_TYPES),
            )
        )
        if excluded_ids:
            query = query.filter(Task.id.notin_(excluded_ids))
        task = query.order_by(db.func.random()).first()
        if task is not None:
            return task
    return None


def _pick_section_tasks(section_id, per_level):
    picked = []
    for level in DIFFICULTY_LEVELS:
        for _ in range(per_level):
            task = _pick_random_task(section_id, level, [task.id for task in picked])
            if task is None:
                return sorted(picked, key=lambda task: task.difficulty_level)
            picked.append(task)
    return sorted(picked, key=lambda task: task.difficulty_level)


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
    per_level = get_settings().questions_per_section // len(DIFFICULTY_LEVELS)
    sections = []
    for section in Section.query.order_by(Section.order_index).all():
        tasks = _pick_section_tasks(section.id, per_level)
        if tasks:
            sections.append({
                "section_id": section.id,
                "section_title": section.title,
                "questions": [_question_json(task, interest) for task in tasks],
            })
    return {"sections": sections}


def _grade(answers, interest):
    graded = []
    for answer in answers:
        if not isinstance(answer, dict):
            return None, "Each answer must be an object"

        task_id = answer.get("task_id")
        task = db.session.get(Task, task_id)
        if task is None:
            return None, f"Task {task_id} not found"

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


def submit_leveling_test(student, answers):
    graded, error = _grade(answers, student.interest)
    if error:
        return None, error

    score = sum(1 for result in graded if result.is_correct)
    per_section = _score_per_section(graded)
    now = utc_now()

    attempt = LevelingTestAttempt(
        student_id=student.id,
        score=score,
        max_score=len(graded),
        completed_at=now,
    )
    db.session.add(attempt)
    db.session.flush()

    for result in graded:
        db.session.add(LevelingTestAnswer(
            attempt_id=attempt.id,
            task_id=result.item.id,
            selected_option_id=result.selected_option_id,
            answer_text=result.answer_text,
            is_correct=result.is_correct,
        ))
    for section_result in per_section:
        db.session.add(LevelingTestSectionResult(attempt_id=attempt.id, **section_result))

    student.leveling_test_completed_at = now
    db.session.commit()

    return {
        "attempt_id": attempt.id,
        "saved": len(graded),
        "score": score,
        "max_score": len(graded),
        "per_section": per_section,
    }, None


def section_results_json(attempt_id):
    results = (
        LevelingTestSectionResult.query.filter_by(attempt_id=attempt_id)
        .order_by(LevelingTestSectionResult.id)
        .all()
    )
    return [
        {
            "section_id": result.section_id,
            "section_title": result.section_title,
            "score": result.score,
            "total": result.total,
        }
        for result in results
    ]


def leveling_test_history(student):
    attempts = (
        LevelingTestAttempt.query.filter_by(student_id=student.id)
        .order_by(LevelingTestAttempt.completed_at.desc())
        .all()
    )
    return [
        {
            "id": attempt.id,
            **attempt_json(attempt),
            "per_section": section_results_json(attempt.id),
        }
        for attempt in attempts
    ]

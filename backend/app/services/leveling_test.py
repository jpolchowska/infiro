from datetime import timedelta

from app.clock import utc_now
from app.constants import TaskType
from app.extensions import db
from app.models.leveling_test_answers import LevelingTestAnswer
from app.models.leveling_test_attempts import LevelingTestAttempt
from app.models.leveling_test_question_sets import LevelingTestQuestionSet
from app.models.leveling_test_section_results import LevelingTestSectionResult
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.services.answers import grade_answer
from app.services.leveling_test_settings import get_settings
from app.services.themes import resolve_theme, shuffled_options, task_options

DIFFICULTY_LEVELS = (1, 2, 3)
QUESTION_TYPES = (TaskType.SINGLE_CHOICE, TaskType.SHORT_ANSWER)
REUSE_QUESTION_SET_FOR = timedelta(hours=24)
MATCHED_QUESTION_SETS_LIMIT = 10


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


def _open_question_sets(student_id):
    return (
        LevelingTestQuestionSet.query
        .filter(
            LevelingTestQuestionSet.student_id == student_id,
            LevelingTestQuestionSet.attempt_id.is_(None),
        )
        .order_by(LevelingTestQuestionSet.created_at.desc(), LevelingTestQuestionSet.id.desc())
    )


def _reusable_tasks(student_id):
    question_set = _open_question_sets(student_id).first()
    if question_set is None or question_set.created_at < utc_now() - REUSE_QUESTION_SET_FOR:
        return None

    tasks = [db.session.get(Task, task_id) for task_id in question_set.task_ids]
    if any(task is None for task in tasks):
        return None
    return tasks


def _draw_question_set(student_id):
    per_level = get_settings().questions_per_section // len(DIFFICULTY_LEVELS)
    tasks = []
    for section in Section.query.order_by(Section.order_index).all():
        tasks.extend(_pick_section_tasks(section.id, per_level))

    db.session.add(LevelingTestQuestionSet(student_id=student_id, task_ids=[task.id for task in tasks]))
    db.session.commit()
    return tasks


def _group_by_section(tasks, interest):
    sections = {}
    for task in tasks:
        subsection = db.session.get(Subsection, task.subsection_id)
        section = db.session.get(Section, subsection.section_id)
        entry = sections.setdefault(section.id, {
            "section_id": section.id,
            "section_title": section.title,
            "questions": [],
        })
        entry["questions"].append(_question_json(task, interest))
    return list(sections.values())


def build_leveling_test(student):
    tasks = _reusable_tasks(student.id)
    if tasks is None:
        tasks = _draw_question_set(student.id)
    return {"sections": _group_by_section(tasks, student.interest)}


def _matching_question_set(student_id, answered_task_ids):
    expected = sorted(answered_task_ids)
    for question_set in _open_question_sets(student_id).limit(MATCHED_QUESTION_SETS_LIMIT):
        if sorted(question_set.task_ids) == expected:
            return question_set
    return None


def _check_answered_tasks(student_id, answers):
    if not all(isinstance(answer, dict) for answer in answers):
        return None, "Each answer must be an object"

    task_ids = [answer.get("task_id") for answer in answers]
    if not all(isinstance(task_id, int) and not isinstance(task_id, bool) for task_id in task_ids):
        return None, "Each answer must have an integer task_id"
    if len(set(task_ids)) != len(task_ids):
        return None, "Each task can be answered only once"

    question_set = _matching_question_set(student_id, task_ids)
    if question_set is None:
        return None, "Answers do not match the current leveling test"
    return question_set, None


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
    question_set, error = _check_answered_tasks(student.id, answers)
    if error:
        return None, error

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
    question_set.attempt_id = attempt.id

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

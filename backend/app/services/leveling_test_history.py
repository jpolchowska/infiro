from app.constants import TaskType
from app.extensions import db
from app.models.leveling_test_answers import LevelingTestAnswer
from app.models.leveling_test_attempts import LevelingTestAttempt
from app.models.leveling_test_section_results import LevelingTestSectionResult
from app.models.tasks import Task
from app.serializers import attempt_json
from app.services.content_preview import task_reference
from app.services.themes import resolve_theme, task_options


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


def _answer_detail(answer):
    task = db.session.get(Task, answer.task_id)
    detail = {**task_reference(task), "is_correct": answer.is_correct}

    if task.type == TaskType.SINGLE_CHOICE:
        options = task_options(task, None)
        selected = next((option for option in options if option["id"] == answer.selected_option_id), None)
        correct = next((option for option in options if option["is_correct"]), None)
        detail["given_answer"] = selected["text"] if selected else None
        detail["correct_answer"] = correct["text"] if correct else None
    else:
        accepted = resolve_theme(task, None).get("answers", task.accepted_answers or [])
        detail["given_answer"] = answer.answer_text
        detail["correct_answer"] = accepted[0] if accepted else None
    return detail


def attempt_detail(attempt):
    answers = (
        LevelingTestAnswer.query.filter_by(attempt_id=attempt.id)
        .order_by(LevelingTestAnswer.id)
        .all()
    )
    return {
        "id": attempt.id,
        **attempt_json(attempt),
        "per_section": section_results_json(attempt.id),
        "answers": [_answer_detail(answer) for answer in answers],
    }

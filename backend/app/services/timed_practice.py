import random

from app.constants import TaskType
from app.models.tasks import Task
from app.services.themes import resolve_theme, shuffled_options, task_options

DURATION_SECONDS = 60
MAX_QUESTIONS = 20


def _timed_tasks(subsection):
    return Task.query.filter_by(subsection_id=subsection.id, type=TaskType.SINGLE_CHOICE).all()


def build_timed_practice(subsection, interest):
    tasks = _timed_tasks(subsection)
    random.shuffle(tasks)

    questions = [
        {
            "task_id": task.id,
            "prompt": resolve_theme(task, interest).get("prompt", task.body_text),
            "options": shuffled_options(task_options(task, interest)),
        }
        for task in tasks[:MAX_QUESTIONS]
    ]
    return {"duration_seconds": DURATION_SECONDS, "questions": questions}


def score_timed_practice(subsection, interest, answers):
    tasks = _timed_tasks(subsection)
    tasks_by_id = {task.id: task for task in tasks}
    correct_by_task = {}

    for answer in answers:
        if not isinstance(answer, dict):
            continue

        task_id = answer.get("task_id")
        selected_option_id = answer.get("selected_option_id")
        if not isinstance(task_id, int) or not isinstance(selected_option_id, int):
            continue
        if task_id not in tasks_by_id or task_id in correct_by_task:
            continue

        selected = next(
            (
                option for option in task_options(tasks_by_id[task_id], interest)
                if option["id"] == selected_option_id
            ),
            None,
        )
        if selected is None:
            continue

        correct_by_task[task_id] = selected["is_correct"]

    return {
        "correct": sum(1 for is_correct in correct_by_task.values() if is_correct),
        "answered": len(correct_by_task),
        "total": len(tasks[:MAX_QUESTIONS]),
    }

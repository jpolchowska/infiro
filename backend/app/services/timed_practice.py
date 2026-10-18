import random

from app.constants import TaskType
from app.models.tasks import Task
from app.services.answers import accepted_answers, is_accepted_answer
from app.services.themes import resolve_theme, shuffled_options, task_options

DURATION_SECONDS = 60
MAX_QUESTIONS = 20
TIMED_TASK_TYPES = (TaskType.SINGLE_CHOICE, TaskType.SHORT_ANSWER)


def _timed_tasks(subsection):
    return Task.query.filter(
        Task.subsection_id == subsection.id,
        Task.type.in_(TIMED_TASK_TYPES),
    ).all()


def _question_json(task, interest):
    question = {
        "task_id": task.id,
        "type": task.type,
        "prompt": resolve_theme(task, interest).get("prompt", task.body_text),
    }
    if task.type == TaskType.SINGLE_CHOICE:
        question["options"] = shuffled_options(task_options(task, interest))
    return question


def build_timed_practice(subsection, interest):
    tasks = _timed_tasks(subsection)
    random.shuffle(tasks)

    questions = [_question_json(task, interest) for task in tasks[:MAX_QUESTIONS]]
    return {"duration_seconds": DURATION_SECONDS, "questions": questions}


def _grade(task, answer, interest):
    if task.type == TaskType.SHORT_ANSWER:
        answer_text = answer.get("answer_text")
        if not isinstance(answer_text, str) or not answer_text.strip():
            return None
        return is_accepted_answer(answer_text, accepted_answers(task, interest))

    selected_option_id = answer.get("selected_option_id")
    if not isinstance(selected_option_id, int):
        return None
    selected = next(
        (option for option in task_options(task, interest) if option["id"] == selected_option_id),
        None,
    )
    return None if selected is None else selected["is_correct"]


def score_timed_practice(subsection, interest, answers):
    tasks = _timed_tasks(subsection)
    tasks_by_id = {task.id: task for task in tasks}
    correct_by_task = {}

    for answer in answers:
        if not isinstance(answer, dict):
            continue

        task_id = answer.get("task_id")
        if not isinstance(task_id, int) or task_id not in tasks_by_id or task_id in correct_by_task:
            continue

        is_correct = _grade(tasks_by_id[task_id], answer, interest)
        if is_correct is not None:
            correct_by_task[task_id] = is_correct

    return {
        "correct": sum(1 for is_correct in correct_by_task.values() if is_correct),
        "answered": len(correct_by_task),
        "total": len(tasks[:MAX_QUESTIONS]),
    }

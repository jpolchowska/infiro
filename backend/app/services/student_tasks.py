from app.clock import utc_now
from app.constants import TaskType
from app.extensions import db
from app.models.student_answers import StudentAnswer
from app.models.task_answer_options import TaskAnswerOption
from app.services.answers import (
    MAX_ATTEMPTS,
    accepted_answers,
    attempts_used_in_current_cycle,
    is_accepted_answer,
    task_solution,
)
from app.services.progress import determine_student_difficulty_level
from app.services.themes import resolve_theme, shuffled_options, task_options

ANSWERABLE_TYPES = (TaskType.SINGLE_CHOICE, TaskType.SHORT_ANSWER)


def task_view(task, student):
    theme = resolve_theme(task, student.interest)
    view = {
        "id": task.id,
        "type": task.type,
        "difficulty_level": task.difficulty_level,
        "prompt": theme.get("prompt", task.body_text),
    }

    if task.type == TaskType.MEMORY:
        pairs = theme.get("pairs", task.memory_pairs or [])
        view["pairs"] = [
            {"id": index, "a": pair["a"], "b": pair["b"]}
            for index, pair in enumerate(pairs, start=1)
        ]
        return view, None

    if task.type not in ANSWERABLE_TYPES:
        return None, "Unsupported task type"

    if task.type == TaskType.SINGLE_CHOICE:
        view["options"] = shuffled_options(task_options(task, student.interest))
    view["attempts_used"] = attempts_used_in_current_cycle(task.id, student.id)
    view["max_attempts"] = MAX_ATTEMPTS
    view["solution"] = None
    return view, None


def _save_answer(task, student, is_correct, attempt_number, **fields):
    db.session.add(StudentAnswer(
        task_id=task.id,
        student_id=student.id,
        is_correct=is_correct,
        attempt_number=attempt_number,
        submitted_at=utc_now(),
        **fields,
    ))
    db.session.commit()


def _is_selected_option_correct(task, option, interest):
    theme_options = resolve_theme(task, interest).get("options")
    option_index = option.order_index - 1
    if isinstance(theme_options, list) and option_index < len(theme_options):
        return theme_options[option_index].get("correct") is True
    return option.is_correct


def _check_single_choice(task, student, data):
    selected_option_id = data.get("selected_option_id")
    if not isinstance(selected_option_id, int):
        return None, "selected_option_id is required"

    option = TaskAnswerOption.query.filter_by(id=selected_option_id, task_id=task.id).first()
    if option is None:
        return None, "Invalid option"

    is_correct = _is_selected_option_correct(task, option, student.interest)
    return (is_correct, {"selected_option_id": selected_option_id}), None


def _check_short_answer(task, student, data):
    answer_text = data.get("answer_text")
    if not isinstance(answer_text, str):
        return None, "answer_text is required"

    is_correct = is_accepted_answer(answer_text, accepted_answers(task, student.interest))
    return (is_correct, {"answer_text": answer_text}), None


def _submit_memory(task, student, data):
    if data.get("completed") is not True:
        return None, "completed must be true"

    _save_answer(task, student, is_correct=True, attempt_number=1)
    return {
        "is_correct": True,
        "attempt_number": 1,
        "attempts_left": None,
        "solution": None,
    }, None


def submit_task_answer(task, student, data):
    previous_level = determine_student_difficulty_level(student.id, task.subsection_id)

    if task.type == TaskType.MEMORY:
        return _submit_memory(task, student, data)

    if task.type not in ANSWERABLE_TYPES:
        return None, "Unsupported task type"

    attempt_number = attempts_used_in_current_cycle(task.id, student.id) + 1
    check = _check_single_choice if task.type == TaskType.SINGLE_CHOICE else _check_short_answer
    checked, error = check(task, student, data)
    if error:
        return None, error

    is_correct, answer_fields = checked
    _save_answer(task, student, is_correct, attempt_number, **answer_fields)

    attempts_left = MAX_ATTEMPTS - attempt_number
    solution = None
    if not is_correct and attempts_left == 0:
        solution = task_solution(task, student.interest)

    new_level = determine_student_difficulty_level(student.id, task.subsection_id)

    return {
        "is_correct": is_correct,
        "attempt_number": attempt_number,
        "attempts_left": attempts_left,
        "solution": solution,
        "unlocked_difficulty": new_level if new_level != previous_level else None,
    }, None

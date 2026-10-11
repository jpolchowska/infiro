import re
from collections import namedtuple

from app.constants import TaskType
from app.models.student_answers import StudentAnswer
from app.models.task_answer_options import TaskAnswerOption
from app.services.themes import resolve_theme

MAX_ATTEMPTS = 3

GradedAnswer = namedtuple("GradedAnswer", ["item", "is_correct", "selected_option_id", "answer_text"])


def normalize_answer(value):
    value = value.strip()
    value = re.sub(r"\s+", " ", value)
    value = value.lower()
    return value.replace(",", ".")


def is_accepted_answer(answer_text, accepted_answers):
    normalized_answer = normalize_answer(answer_text)
    return any(
        normalized_answer == normalize_answer(accepted)
        for accepted in accepted_answers
    )


def attempts_used_in_current_cycle(task_id, student_id):
    last_answer = (
        StudentAnswer.query
        .filter_by(task_id=task_id, student_id=student_id)
        .order_by(StudentAnswer.id.desc())
        .first()
    )

    if last_answer is None or last_answer.is_correct or last_answer.attempt_number >= MAX_ATTEMPTS:
        return 0

    return last_answer.attempt_number


def task_solution(task, interest=None):
    if task.type == TaskType.SINGLE_CHOICE:
        theme_options = resolve_theme(task, interest).get("options")
        if isinstance(theme_options, list):
            correct_indexes = [
                index for index, option in enumerate(theme_options)
                if isinstance(option, dict) and option.get("correct") is True
            ]
            if len(correct_indexes) == 1:
                option = TaskAnswerOption.query.filter_by(
                    task_id=task.id,
                    order_index=correct_indexes[0] + 1,
                ).first()
                return {"correct_option_id": option.id} if option else None

        correct_option = TaskAnswerOption.query.filter_by(
            task_id=task.id,
            is_correct=True,
        ).first()
        return {
            "correct_option_id": correct_option.id
        } if correct_option is not None else None

    if task.type == TaskType.SHORT_ANSWER:
        return {"accepted_answers": accepted_answers(task, interest)}

    return None


def accepted_answers(item, interest):
    return resolve_theme(item, interest).get("answers", item.accepted_answers or [])


def grade_answer(item, answer, interest, noun, load_options):
    label = f"{noun} {item.id}"
    selected_option_id = answer.get("selected_option_id")
    answer_text = answer.get("answer_text")

    if selected_option_id is None and answer_text is None:
        return GradedAnswer(item, False, None, None), None

    if item.type == TaskType.SINGLE_CHOICE:
        if not isinstance(selected_option_id, int):
            return None, f"selected_option_id is required for {label}"
        selected = next(
            (option for option in load_options(item, interest) if option["id"] == selected_option_id),
            None,
        )
        if selected is None:
            return None, f"option {selected_option_id} does not belong to {label}"
        return GradedAnswer(item, selected["is_correct"], selected["id"], None), None

    if item.type == TaskType.SHORT_ANSWER:
        if not isinstance(answer_text, str):
            return None, f"answer_text is required for {label}"
        is_correct = is_accepted_answer(answer_text, accepted_answers(item, interest))
        return GradedAnswer(item, is_correct, None, answer_text), None

    return None, f"unsupported {noun} type for {label}"

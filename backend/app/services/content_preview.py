from app.constants import DEFAULT_THEME, TaskType
from app.extensions import db
from app.models.section_test_attempts import SectionTestAttempt
from app.models.section_test_questions import SectionTestQuestion
from app.models.sections import Section
from app.models.student_answers import StudentAnswer
from app.models.subsections import Subsection
from app.services.themes import question_options, resolve_theme, task_options


def _theme_keys(item):
    themes = item.themes if isinstance(item.themes, dict) else {}
    return sorted(key for key in themes if key != DEFAULT_THEME)


def _content(item, theme, options, fallback_prompt, fallback_answers):
    content = {"prompt": theme.get("prompt", fallback_prompt)}
    if item.type == TaskType.SINGLE_CHOICE:
        content["options"] = options
    elif item.type == TaskType.SHORT_ANSWER:
        content["accepted_answers"] = theme.get("answers", fallback_answers or [])
    elif item.type == TaskType.MEMORY:
        content["memory_pairs"] = theme.get("pairs", getattr(item, "memory_pairs", None) or [])
    return content


def _task_content(task, interest):
    return _content(
        task,
        resolve_theme(task, interest),
        task_options(task, interest),
        task.body_text,
        task.accepted_answers,
    )


def _question_content(question, interest):
    return _content(
        question,
        resolve_theme(question, interest),
        question_options(question, interest),
        question.prompt,
        question.accepted_answers,
    )


def task_reference(task):
    subsection = db.session.get(Subsection, task.subsection_id)
    section = db.session.get(Section, subsection.section_id) if subsection else None
    return {
        "task_id": task.id,
        "content_key": task.content_key,
        "type": task.type,
        "prompt": resolve_theme(task, None).get("prompt", task.body_text),
        "subsection_title": subsection.title if subsection else None,
        "section_title": section.title if section else None,
    }


def task_summary(task):
    return {
        "id": task.id,
        "subsection_id": task.subsection_id,
        "content_key": task.content_key,
        "type": task.type,
        "difficulty_level": task.difficulty_level,
        "order_index": task.order_index,
        "themes": _theme_keys(task),
        **_task_content(task, None),
    }


def _task_stats(task):
    answers = StudentAnswer.query.filter_by(task_id=task.id).all()
    correct = sum(1 for answer in answers if answer.is_correct)
    return {
        "attempts": len(answers),
        "correct_attempts": correct,
        "students_attempted": len({answer.student_id for answer in answers}),
        "students_solved": len({answer.student_id for answer in answers if answer.is_correct}),
        "accuracy": round(100 * correct / len(answers)) if answers else None,
    }


def task_detail(task):
    subsection = db.session.get(Subsection, task.subsection_id)
    section = db.session.get(Section, subsection.section_id)
    return {
        **task_summary(task),
        "section_id": section.id,
        "section_title": section.title,
        "subsection_title": subsection.title,
        "variants": [
            {"theme": key, **_task_content(task, key)}
            for key in _theme_keys(task)
        ],
        "stats": _task_stats(task),
    }


def _question_summary(question):
    return {
        "id": question.id,
        "content_key": question.content_key,
        "type": question.type,
        "order_index": question.order_index,
        "themes": _theme_keys(question),
        **_question_content(question, None),
    }


def final_test_preview(section):
    questions = (
        SectionTestQuestion.query.filter_by(section_id=section.id)
        .order_by(SectionTestQuestion.order_index, SectionTestQuestion.id)
        .all()
    )
    attempts = SectionTestAttempt.query.filter_by(section_id=section.id).all()
    return {
        "section_id": section.id,
        "section_title": section.title,
        "questions": [_question_summary(question) for question in questions],
        "attempts": len(attempts),
        "students_attempted": len({attempt.student_id for attempt in attempts}),
    }

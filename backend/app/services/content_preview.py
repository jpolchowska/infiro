from app.constants import DEFAULT_THEME, TaskType, UserRole
from app.extensions import db
from app.models.section_test_answers import SectionTestAnswer
from app.models.section_test_attempts import SectionTestAttempt
from app.models.section_test_questions import SectionTestQuestion
from app.models.sections import Section
from app.models.student_answers import StudentAnswer
from app.models.subsections import Subsection
from app.models.users import User
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
        "stats": _task_stats(task),
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


def _correct_rates(attempt_ids, question_ids):
    answers = SectionTestAnswer.query.filter(
        SectionTestAnswer.attempt_id.in_(attempt_ids),
        SectionTestAnswer.question_id.in_(question_ids),
    ).all()
    totals = {}
    for answer in answers:
        correct, total = totals.get(answer.question_id, (0, 0))
        totals[answer.question_id] = (correct + answer.is_correct, total + 1)
    return {question_id: round(100 * correct / total) for question_id, (correct, total) in totals.items()}


def _questions_with_rate(question_ids, rates, rate):
    return {
        "question_ids": [question_id for question_id in question_ids if rates.get(question_id) == rate],
        "correct_rate": rate,
    }


def final_test_preview(section, teacher=None):
    questions = (
        SectionTestQuestion.query.filter_by(section_id=section.id)
        .order_by(SectionTestQuestion.order_index, SectionTestQuestion.id)
        .all()
    )
    students = User.query.filter_by(role=UserRole.STUDENT)
    if teacher is not None:
        students = students.filter_by(teacher_id=teacher.id)
    student_ids = [student.id for student in students.all()]
    attempts = SectionTestAttempt.query.filter(
        SectionTestAttempt.section_id == section.id,
        SectionTestAttempt.student_id.in_(student_ids),
    ).all()
    students_attempted = len({attempt.student_id for attempt in attempts})
    scores = [attempt.score / attempt.max_score for attempt in attempts if attempt.max_score]
    question_ids = [question.id for question in questions]
    rates = _correct_rates([attempt.id for attempt in attempts], question_ids)
    distinct_rates = set(rates.values())

    return {
        "section_id": section.id,
        "section_title": section.title,
        "questions": [_question_summary(question) for question in questions],
        "students_attempted": students_attempted,
        "students_total": len(student_ids),
        "average_attempts": round(len(attempts) / students_attempted, 1) if students_attempted else None,
        "average_score": round(100 * sum(scores) / len(scores)) if scores else None,
        "easiest": _questions_with_rate(question_ids, rates, max(distinct_rates)) if len(distinct_rates) > 1 else None,
        "hardest": _questions_with_rate(question_ids, rates, min(distinct_rates)) if len(distinct_rates) > 1 else None,
    }

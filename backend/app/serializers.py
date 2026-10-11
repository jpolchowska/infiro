from app.models.subsections import Subsection
from app.models.task_answer_options import TaskAnswerOption
from app.models.tasks import Task


def iso_utc(value):
    return value.isoformat() + "Z" if value else None


def attempt_json(attempt):
    return {
        "score": attempt.score,
        "total": attempt.max_score,
        "completedAt": iso_utc(attempt.completed_at),
    }


def section_json(section):
    return {
        "id": section.id,
        "title": section.title,
        "description": section.description,
        "order_index": section.order_index,
        "subsection_count": Subsection.query.filter_by(section_id=section.id).count(),
        "task_count": (
            Task.query.join(Subsection).filter(Subsection.section_id == section.id).count()
        ),
    }


def subsection_json(subsection):
    return {
        "id": subsection.id,
        "section_id": subsection.section_id,
        "title": subsection.title,
        "description": subsection.description,
        "order_index": subsection.order_index,
        "task_count": Task.query.filter_by(subsection_id=subsection.id).count(),
    }


def task_json(task):
    options = TaskAnswerOption.query.filter_by(task_id=task.id).order_by(
        TaskAnswerOption.order_index
    ).all()
    return {
        "id": task.id,
        "subsection_id": task.subsection_id,
        "title": task.title,
        "body_text": task.body_text,
        "image_url": task.image_url,
        "difficulty_level": task.difficulty_level,
        "options": [
            {
                "id": option.id,
                "option_text": option.option_text,
                "is_correct": option.is_correct,
                "order_index": option.order_index,
            }
            for option in options
        ],
    }

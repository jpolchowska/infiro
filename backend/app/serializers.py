from app.models.section_test_questions import SectionTestQuestion
from app.models.subsections import Subsection
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
        "final_test_question_count": SectionTestQuestion.query.filter_by(section_id=section.id).count(),
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

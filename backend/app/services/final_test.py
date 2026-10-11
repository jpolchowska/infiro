from app.clock import utc_now
from app.constants import TaskType
from app.extensions import db
from app.models.section_test_attempts import SectionTestAttempt
from app.models.section_test_questions import SectionTestQuestion
from app.serializers import attempt_json
from app.services.answers import grade_answer
from app.services.themes import question_options, resolve_theme, shuffled_options


def _question_json(question, interest):
    theme = resolve_theme(question, interest)
    payload = {
        "question_id": question.id,
        "type": question.type,
        "prompt": theme.get("prompt", question.prompt),
    }
    if question.type == TaskType.SINGLE_CHOICE:
        payload["options"] = shuffled_options(question_options(question, interest))
    return payload


def build_final_test(section, interest):
    questions = (
        SectionTestQuestion.query.filter_by(section_id=section.id)
        .order_by(SectionTestQuestion.order_index)
        .all()
    )
    return {
        "section_id": section.id,
        "section_title": section.title,
        "questions": [_question_json(question, interest) for question in questions],
    }


def submit_final_test(student, section, answers):
    graded = []
    for answer in answers:
        if not isinstance(answer, dict):
            return None, "each answer must be an object"

        question_id = answer.get("question_id")
        question = SectionTestQuestion.query.filter_by(
            id=question_id, section_id=section.id
        ).first()
        if question is None:
            return None, f"question {question_id} not found in this section"

        result, error = grade_answer(question, answer, student.interest, "question", question_options)
        if error:
            return None, error
        graded.append(result)

    score = sum(1 for result in graded if result.is_correct)
    db.session.add(SectionTestAttempt(
        student_id=student.id,
        section_id=section.id,
        score=score,
        max_score=len(graded),
        completed_at=utc_now(),
    ))
    db.session.commit()

    return {"score": score, "max_score": len(graded)}, None


def final_test_history(student, section_id):
    attempts = (
        SectionTestAttempt.query.filter_by(student_id=student.id, section_id=section_id)
        .order_by(SectionTestAttempt.completed_at.desc())
        .all()
    )
    return [attempt_json(attempt) for attempt in attempts]

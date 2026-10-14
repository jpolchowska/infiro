from app.clock import utc_now
from app.constants import TaskType
from app.extensions import db
from app.models.section_test_answers import SectionTestAnswer
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
            return None, "Each answer must be an object"

        question_id = answer.get("question_id")
        question = SectionTestQuestion.query.filter_by(
            id=question_id, section_id=section.id
        ).first()
        if question is None:
            return None, f"Question {question_id} not found in this section"

        result, error = grade_answer(question, answer, student.interest, "question", question_options)
        if error:
            return None, error
        graded.append(result)

    score = sum(1 for result in graded if result.is_correct)
    attempt = SectionTestAttempt(
        student_id=student.id,
        section_id=section.id,
        score=score,
        max_score=len(graded),
        completed_at=utc_now(),
    )
    db.session.add(attempt)
    db.session.flush()

    for result in graded:
        db.session.add(SectionTestAnswer(
            attempt_id=attempt.id,
            question_id=result.item.id,
            selected_option_id=result.selected_option_id,
            answer_text=result.answer_text,
            is_correct=result.is_correct,
        ))
    db.session.commit()

    return {"attempt_id": attempt.id, "score": score, "max_score": len(graded)}, None


def final_test_history(student, section_id):
    attempts = (
        SectionTestAttempt.query.filter_by(student_id=student.id, section_id=section_id)
        .order_by(SectionTestAttempt.completed_at.desc())
        .all()
    )
    return [attempt_json(attempt) for attempt in attempts]


def _answer_detail(answer):
    question = db.session.get(SectionTestQuestion, answer.question_id)
    detail = {
        "question_id": question.id,
        "content_key": question.content_key,
        "type": question.type,
        "prompt": resolve_theme(question, None).get("prompt", question.prompt),
        "is_correct": answer.is_correct,
    }

    if question.type == TaskType.SINGLE_CHOICE:
        options = question_options(question, None)
        selected = next((option for option in options if option["id"] == answer.selected_option_id), None)
        correct = next((option for option in options if option["is_correct"]), None)
        detail["given_answer"] = selected["text"] if selected else None
        detail["correct_answer"] = correct["text"] if correct else None
    else:
        accepted = resolve_theme(question, None).get("answers", question.accepted_answers or [])
        detail["given_answer"] = answer.answer_text
        detail["correct_answer"] = accepted[0] if accepted else None
    return detail


def final_test_attempt_detail(attempt):
    answers = (
        SectionTestAnswer.query.filter_by(attempt_id=attempt.id)
        .order_by(SectionTestAnswer.id)
        .all()
    )
    return {
        "id": attempt.id,
        "section_id": attempt.section_id,
        **attempt_json(attempt),
        "answers": [_answer_detail(answer) for answer in answers],
    }

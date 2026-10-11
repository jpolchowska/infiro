from uuid import uuid4

from app.constants import DEFAULT_THEME, TaskType
from app.extensions import db
from app.models.section_test_answer_options import SectionTestAnswerOption
from app.models.section_test_questions import SectionTestQuestion
from app.services.answer_options import sync_answer_options
from app.services.import_validation import validate_section_test_import
from app.services.themes import merge_theme_variants


def _question_output(question):
    return {
        "id": question.id,
        "content_key": question.content_key,
        "type": question.type,
        "themes": question.themes,
    }


def _upsert_question(section, question_data, content_key, order_index):
    themes = merge_theme_variants(question_data["themes"])
    question = SectionTestQuestion.query.filter_by(content_key=content_key).first()
    if question is None:
        question = SectionTestQuestion(
            section_id=section.id,
            prompt="",
            type=question_data["type"],
            order_index=order_index,
            content_key=content_key,
        )
        db.session.add(question)
        db.session.flush()

    default = themes[DEFAULT_THEME]
    question.section_id = section.id
    question.type = question_data["type"]
    question.order_index = order_index
    question.prompt = default["prompt"].strip()
    question.accepted_answers = default.get("answers")
    question.themes = themes
    question.content_key = content_key
    question_data["id"] = question.id
    question_data["content_key"] = content_key

    if question.type == TaskType.SINGLE_CHOICE:
        sync_answer_options(
            SectionTestAnswerOption,
            {"section_test_question_id": question.id},
            default["options"],
        )
    return question


def import_section_test(section, data):
    errors = validate_section_test_import(data)
    if errors:
        return None, errors

    section_entry = next(
        (entry for entry in data if entry["section"].strip() == section.title), None
    )
    if section_entry is None:
        return None, [f"payload does not contain a 'section' matching '{section.title}'"]

    imported_questions = []

    for question_order, question_data in enumerate(section_entry["questions"], start=1):
        content_key = question_data.get("content_key") or str(uuid4())
        question = _upsert_question(section, question_data, content_key, question_order)
        imported_questions.append(_question_output(question))

    db.session.commit()

    return {
        "question_count": len(imported_questions),
        "questions": imported_questions,
        "data": data,
    }, None

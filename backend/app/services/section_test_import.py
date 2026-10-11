from uuid import uuid4

from app.extensions import db
from app.models.section_test_answer_options import SectionTestAnswerOption
from app.models.section_test_questions import SectionTestQuestion
from app.schemas.section_test_import import SECTION_TEST_IMPORT_SCHEMA
from app.services.import_helpers import matches_schema, sync_answer_options
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

    default = themes["default"]
    question.section_id = section.id
    question.type = question_data["type"]
    question.order_index = order_index
    question.prompt = default["prompt"].strip()
    question.accepted_answers = default.get("answers")
    question.themes = themes
    question.content_key = content_key
    question_data["id"] = question.id
    question_data["content_key"] = content_key

    if question.type == "single_choice":
        sync_answer_options(
            SectionTestAnswerOption,
            {"section_test_question_id": question.id},
            default["options"],
        )
    return question


def import_section_test(section, data):
    if not matches_schema(data, SECTION_TEST_IMPORT_SCHEMA, "Section test import"):
        return None, ["Invalid JSON format"]

    section_entry = next(
        (entry for entry in data if entry["section"].strip() == section.title), None
    )
    if section_entry is None:
        return None, [f"payload does not contain a 'section' matching '{section.title}'"]

    content_keys = set()
    imported_questions = []

    for question_order, question_data in enumerate(section_entry["questions"], start=1):
        content_key = question_data.get("content_key") or str(uuid4())
        if content_key in content_keys:
            return None, [f"duplicate content_key: '{content_key}'"]
        content_keys.add(content_key)

        question = _upsert_question(section, question_data, content_key, question_order)
        imported_questions.append(_question_output(question))

    db.session.commit()

    return {
        "question_count": len(imported_questions),
        "questions": imported_questions,
        "data": data,
    }, None

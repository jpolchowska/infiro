from datetime import datetime
import random

from flask import Blueprint, jsonify, request

from app.extensions import db
from app.middleware.auth import authenticate_token
from app.models.sections import Section
from app.models.section_test_questions import SectionTestQuestion
from app.models.section_test_answer_options import SectionTestAnswerOption
from app.models.section_test_attempts import SectionTestAttempt
from app.routes.student import _current_user
from app.routes.leveling_test import _normalize_answer

section_test_bp = Blueprint("section_test", __name__)


def _question_theme(question, interest):
    themes = question.themes if isinstance(question.themes, dict) else {}
    default = themes.get("default", {})
    selected = themes.get(interest, {}) if interest else {}
    if not isinstance(default, dict):
        default = {}
    if not isinstance(selected, dict):
        selected = {}
    return {**default, **selected}


def _question_options(question, interest):
    options = (
        SectionTestAnswerOption.query.filter_by(section_test_question_id=question.id)
        .order_by(SectionTestAnswerOption.order_index)
        .all()
    )
    theme_options = _question_theme(question, interest).get("options")
    if isinstance(theme_options, list) and len(theme_options) == len(options):
        return [
            {
                "id": option.id,
                "text": option_data["text"],
                "is_correct": option_data.get("correct") is True,
            }
            for option, option_data in zip(options, theme_options)
        ]
    return [
        {
            "id": option.id,
            "text": option.option_text,
            "is_correct": option.is_correct,
        }
        for option in options
    ]


def _question_json(question, interest):
    theme = _question_theme(question, interest)
    payload = {
        "question_id": question.id,
        "type": question.type,
        "prompt": theme.get("prompt", question.prompt),
    }
    if question.type == "single_choice":
        options = _question_options(question, interest)
        random_options = list(options)
        random.shuffle(random_options)
        payload["options"] = [
            {"id": option["id"], "text": option["text"]}
            for option in random_options
        ]
    return payload


@section_test_bp.route("/api/student/sections/<int:section_id>/final-test", methods=["GET"])
@authenticate_token
def get_section_final_test(section_id):
    user = _current_user()
    if user is None:
        return jsonify({"error": "user not found, call /api/student/me first"}), 404

    section = db.session.get(Section, section_id)
    if section is None:
        return jsonify({"error": "section not found"}), 404

    questions = (
        SectionTestQuestion.query.filter_by(section_id=section.id)
        .order_by(SectionTestQuestion.order_index)
        .all()
    )

    return jsonify({
        "section_id": section.id,
        "section_title": section.title,
        "questions": [_question_json(question, user.interest) for question in questions],
    }), 200


@section_test_bp.route("/api/student/sections/<int:section_id>/final-test/submit", methods=["POST"])
@authenticate_token
def submit_section_final_test(section_id):
    user = _current_user()
    if user is None:
        return jsonify({"error": "user not found, call /api/student/me first"}), 404

    section = db.session.get(Section, section_id)
    if section is None:
        return jsonify({"error": "section not found"}), 404

    data = request.get_json()
    if data is None:
        return jsonify({"error": "JSON body is required"}), 400

    answers = data.get("answers")
    if not isinstance(answers, list) or len(answers) == 0:
        return jsonify({"error": "answers must be a non-empty list"}), 400

    # Walidacja wszystkich wpisów najpierw -- jeśli cokolwiek złe, nic się nie zapisuje.
    validated = []
    for answer in answers:
        if not isinstance(answer, dict):
            return jsonify({"error": "each answer must be an object"}), 400

        question_id = answer.get("question_id")

        question = SectionTestQuestion.query.filter_by(
            id=question_id, section_id=section.id
        ).first()
        if question is None:
            return jsonify({"error": f"question {question_id} not found in this section"}), 400

        selected_option_id = answer.get("selected_option_id")
        answer_text = answer.get("answer_text")

        # "Nie wiem" -- brak odpowiedzi, liczone jako błędne
        if selected_option_id is None and answer_text is None:
            validated.append((question, False))
            continue

        if question.type == "single_choice":
            if not isinstance(selected_option_id, int):
                return jsonify({
                    "error": f"selected_option_id is required for question {question_id}"
                }), 400
            option = SectionTestAnswerOption.query.filter_by(
                id=selected_option_id, section_test_question_id=question.id
            ).first()
            if option is None:
                return jsonify({
                    "error": f"option {selected_option_id} does not belong to question {question_id}"
                }), 400
            theme_options = _question_options(question, user.interest)
            selected = next(item for item in theme_options if item["id"] == option.id)
            validated.append((question, selected["is_correct"]))
        elif question.type == "short_answer":
            if not isinstance(answer_text, str):
                return jsonify({
                    "error": f"answer_text is required for question {question_id}"
                }), 400
            accepted_answers = _question_theme(question, user.interest).get(
                "answers",
                question.accepted_answers or [],
            )
            is_correct = any(
                _normalize_answer(answer_text) == _normalize_answer(accepted)
                for accepted in accepted_answers
            )
            validated.append((question, is_correct))
        else:
            return jsonify({
                "error": f"unsupported question type for question {question_id}"
            }), 400

    score = sum(1 for _, is_correct in validated if is_correct)
    max_score = len(validated)
    now = datetime.utcnow()

    # Test końcowy jest izolowany od zwykłego postępu -- w przeciwieństwie do
    # testu poziomującego, nic tu nie trafia do StudentAnswer.
    attempt = SectionTestAttempt(
        student_id=user.id,
        section_id=section.id,
        score=score,
        max_score=max_score,
        completed_at=now,
    )
    db.session.add(attempt)
    db.session.commit()

    return jsonify({
        "score": score,
        "max_score": max_score,
    }), 201


@section_test_bp.route("/api/student/sections/<int:section_id>/final-test/history", methods=["GET"])
@authenticate_token
def get_section_final_test_history(section_id):
    user = _current_user()
    if user is None:
        return jsonify({"error": "user not found, call /api/student/me first"}), 404

    attempts = (
        SectionTestAttempt.query.filter_by(student_id=user.id, section_id=section_id)
        .order_by(SectionTestAttempt.completed_at.desc())
        .all()
    )

    return jsonify([
        {
            "score": a.score,
            "total": a.max_score,
            "completedAt": a.completed_at.isoformat() + "Z" if a.completed_at else None,
        }
        for a in attempts
    ]), 200

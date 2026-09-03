from datetime import datetime

from app.models.leveling_test_attempts import LevelingTestAttempt
from flask import Blueprint, jsonify, request

from app.extensions import db
from app.middleware.auth import authenticate_token, require_role
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.models.task_answer_options import TaskAnswerOption
from app.models.student_answers import StudentAnswer
from app.routes.student import _current_user

LEVELING_TEST_DIFFICULTY_LEVELS = [1, 2, 3]

leveling_test_bp = Blueprint("leveling_test", __name__)


def _pick_random_task(section_id, difficulty_level):
    return (
        Task.query.join(Subsection, Task.subsection_id == Subsection.id)
        .filter(Subsection.section_id == section_id, Task.difficulty_level == difficulty_level)
        .order_by(db.func.random())
        .first()
    )


def _task_json(task):
    options = (
        TaskAnswerOption.query.filter_by(task_id=task.id)
        .order_by(db.func.random())
        .all()
    )
    return {
        "task_id": task.id,
        "difficulty_level": task.difficulty_level,
        "title": task.title,
        "body_text": task.body_text,
        "image_url": task.image_url,
        "options": [
            {"id": o.id, "option_text": o.option_text, "is_correct": o.is_correct}
            for o in options
        ],
    }


@leveling_test_bp.route("/api/student/leveling-test", methods=["GET"])
@authenticate_token
def get_leveling_test():
    user = _current_user()
    if user is None:
        return jsonify({"error": "user not found, call /api/student/me first"}), 404

    sections_payload = []
    for section in Section.query.order_by(Section.order_index).all():
        questions = []
        for level in LEVELING_TEST_DIFFICULTY_LEVELS:
            task = _pick_random_task(section.id, level)
            if task is not None:
                questions.append(_task_json(task))

        if questions:
            sections_payload.append({
                "section_id": section.id,
                "section_title": section.title,
                "questions": questions,
            })

    return jsonify({"sections": sections_payload}), 200


@leveling_test_bp.route("/api/student/leveling-test/submit", methods=["POST"])
@authenticate_token
def submit_leveling_test():
    user = _current_user()
    if user is None:
        return jsonify({"error": "user not found, call /api/student/me first"}), 404

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

        task_id = answer.get("task_id")
        selected_option_id = answer.get("selected_option_id")

        task = Task.query.get(task_id)
        if task is None:
            return jsonify({"error": f"task {task_id} not found"}), 400

        option = TaskAnswerOption.query.filter_by(
            id=selected_option_id, task_id=task_id
        ).first()
        if option is None:
            return jsonify({
                "error": f"option {selected_option_id} does not belong to task {task_id}"
            }), 400

        validated.append((task, option))

    # Obliczenie wyniku
    score = sum(1 for _, option in validated if option.is_correct)
    max_score = len(validated)
    now = datetime.utcnow()

    # Zapis odpowiedzi na poszczególne zadania
    saved = 0
    for task, option in validated:
        last_attempt = (
            StudentAnswer.query.filter_by(task_id=task.id, student_id=user.id)
            .order_by(StudentAnswer.attempt_number.desc())
            .first()
        )
        attempt_number = last_attempt.attempt_number + 1 if last_attempt else 1

        db.session.add(
            StudentAnswer(
                task_id=task.id,
                student_id=user.id,
                selected_option_id=option.id,
                is_correct=option.is_correct,
                attempt_number=attempt_number,
                submitted_at=now,
            )
        )
        saved += 1

    # Wstawienie rekordu podejścia do nowej tabeli
    attempt = LevelingTestAttempt(
        student_id=user.id,
        score=score,
        max_score=max_score,
        completed_at=now,
    )
    db.session.add(attempt)

    # Zachowanie dotychczasowej flagi w profilu
    user.leveling_test_completed_at = now
    db.session.commit()

    return jsonify({"saved": saved}), 201 

@leveling_test_bp.route("/api/student/leveling-test/history", methods=["GET"])
@authenticate_token
def get_leveling_test_history():
    user = _current_user()
    if user is None:
        return jsonify({"error": "user not found, call /api/student/me first"}), 404

    leveling_test_attempts = LevelingTestAttempt.query.filter_by(student_id=user.id).order_by(LevelingTestAttempt.completed_at.desc()).all()

    return jsonify([
        {
            "score": a.score,
            "total": a.max_score,
            "completedAt": a.completed_at.isoformat() if a.completed_at else None,
        }
        for a in leveling_test_attempts
    ]), 200
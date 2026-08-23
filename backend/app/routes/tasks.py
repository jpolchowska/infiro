from flask import Blueprint, jsonify, request
from datetime import datetime

from app.models.tasks import Task
from app.models.task_answer_options import TaskAnswerOption
from app.models.subsections import Subsection
# from app.models.student_answers import StudentAnswer

# from app.extensions import db

tasks_bp = Blueprint("tasks", __name__)


@tasks_bp.route("/api/tasks/<int:task_id>", methods=["GET"]) #Zwrócenie konkretnego zadaani np. task=15
def get_task(task_id):
    task = Task.query.get(task_id)

    if task is None: #Brak zadania w bazie
        return jsonify({
            "error": "Task not found"
        }), 404

    options = TaskAnswerOption.query.filter_by( #Łączenie z tabela opcji
        task_id=task.id
    ).order_by(
        TaskAnswerOption.order_index
    ).all()

    return jsonify({ #zwrócenie jsona do frontendu
        "id": task.id,
        "subsection_id": task.subsection_id,
        "title": task.title,
        "body_text": task.body_text,
        "image_url": task.image_url,
        "difficulty_level": task.difficulty_level,
        "theme": task.theme,
        "variant_group": task.variant_group,
        "options": [
            {
                "id": option.id,
                "option_text": option.option_text,
                "order_index": option.order_index
            }
            for option in options
        ]
    }), 200

@tasks_bp.route("/api/tasks", methods=["GET"]) #Zwrócenie wszystkich zadań z konkretnej podsekcji
def get_tasks():
    subsection_id = request.args.get("subsection_id", type=int)

    if subsection_id is None:
        return jsonify({
            "error": "subsection_id is required"
        }), 400

    subsection = Subsection.query.get(subsection_id)

    if subsection is None:
        return jsonify({
            "error": "subsection not found"
        }), 404

    tasks = Task.query.filter_by(
        subsection_id=subsection_id
    ).all()

    return jsonify([
        {
            "id": task.id,
            "subsection_id": task.subsection_id,
            "title": task.title,
            "body_text": task.body_text,
            "image_url": task.image_url,
            "difficulty_level": task.difficulty_level,
            "theme": task.theme,
            "variant_group": task.variant_group
        }
        for task in tasks
    ]), 200

# TODO: poniższe dwa endpointy (StudentAnswer) wracają razem z modelem User
# w rundzie prac nad Uczniami/Wynikami -- student_answers.student_id wskazuje
# dziś na nieistniejącą tabelę users, więc na razie zostają zakomentowane
# zamiast wpiąć nieistniejącą tabelę w migracje.

# @tasks_bp.route("/api/tasks/<int:task_id>/answers", methods=["POST"]) #wysyłanie odpowiedzi przez ucznia
# def submit_answer(task_id):
#     task = Task.query.get(task_id)
#
#     if task is None:
#         return jsonify({
#             "error": "task not found"
#         }), 404
#
#     data = request.get_json()
#
#     if data is None:
#         return jsonify({
#             "error": "JSON body is required"
#         }), 400
#
#     selected_option_id = data.get("selected_option_id")
#     answer_text = data.get("answer_text")
#
#     # TODO: student_id powinien pochodzić z uwierzytelnionego użytkownika
#     student_id = data.get("student_id")
#
#     if student_id is None:
#         return jsonify({
#             "error": "student_id is required"
#         }), 400
#
#     # Odpowiedź zamknięta
#     if selected_option_id is not None:
#         option = TaskAnswerOption.query.filter_by(
#             id=selected_option_id,
#             task_id=task_id
#         ).first()
#
#         if option is None:
#             return jsonify({
#                 "error": "option does not belong to this task"
#             }), 400
#
#         is_correct = option.is_correct
#
#     # Odpowiedź otwarta
#     elif answer_text is not None:
#         #TODO: dodać logikę odpowiedzi otwartrej
#         is_correct = False
#
#     else:
#         return jsonify({
#             "error": "selected_option_id or answer_text is required"
#         }), 400
#
#     last_attempt = StudentAnswer.query.filter_by(
#         task_id=task_id,
#         student_id=student_id
#     ).order_by(
#         StudentAnswer.attempt_number.desc()
#     ).first()
#
#     attempt_number = (
#         last_attempt.attempt_number + 1
#         if last_attempt
#         else 1
#     )
#
#     answer = StudentAnswer(
#         task_id=task_id,
#         student_id=student_id,
#         selected_option_id=selected_option_id,
#         answer_text=answer_text,
#         is_correct=is_correct,
#         attempt_number=attempt_number,
#         submitted_at=datetime.utcnow()
#     )
#
#     db.session.add(answer)
#     db.session.commit()
#
#     return jsonify({
#         "id": answer.id,
#         "task_id": answer.task_id,
#         "is_correct": answer.is_correct,
#         "attempt_number": answer.attempt_number,
#         "submitted_at": answer.submitted_at.isoformat()
#     }), 201

# @tasks_bp.route("/api/tasks/<int:task_id>/answers", methods=["GET"]) #pobieranie historii odpowiedzi
# def get_task_answers(task_id):
#     task = Task.query.get(task_id)
#
#     if task is None:
#         return jsonify({
#             "error": "task not found"
#         }), 404
#
#     student_id = request.args.get("student_id", type=int)
#
#     if student_id is None:
#         return jsonify({
#             "error": "student_id is required"
#         }), 400
#     #TODO : trzeba zmienic student_url na tego z keyklocka
#     answers = StudentAnswer.query.filter_by(
#         task_id=task_id,
#         student_id=student_id
#     ).order_by(
#         StudentAnswer.attempt_number
#     ).all()
#
#     return jsonify([
#         {
#             "id": answer.id,
#             "task_id": answer.task_id,
#             "student_id": answer.student_id,
#             "selected_option_id": answer.selected_option_id,
#             "answer_text": answer.answer_text,
#             "is_correct": answer.is_correct,
#             "attempt_number": answer.attempt_number,
#             "submitted_at": answer.submitted_at.isoformat()
#         }
#         for answer in answers
#     ]), 200

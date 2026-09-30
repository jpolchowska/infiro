from datetime import datetime

from flask import Blueprint, jsonify, request, redirect, url_for

from app.middleware.auth import authenticate_token
from app.middleware.auth import require_role
from app.models.users import User
from app.services.users import get_or_create_user, update_interest
from app.extensions import db
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.tasks import Task
from app.models.student_answers import StudentAnswer
from app.models.leveling_test_attempts import LevelingTestAttempt
from app.models.task_answer_options import TaskAnswerOption
from app.models.ebooks import ebooks
from app.middleware.auth import _current_user

import random

def _task_theme(task, interest):
    themes = task.themes if isinstance(task.themes, dict) else {}
    default = themes.get("default", {})
    selected = themes.get(interest, {}) if interest else {}

    if not isinstance(default, dict):
        default = {}
    if not isinstance(selected, dict):
        selected = {}

    return {**default, **selected}


def _get_solved_task_ids(student_id, subsection_id=None):
    query = (
        db.session.query(StudentAnswer.task_id)
        .join(Task, StudentAnswer.task_id == Task.id)
        .filter(
            StudentAnswer.student_id == student_id,
            StudentAnswer.is_correct.is_(True),
        )
        .distinct()
    )

    if subsection_id is not None:
        query = query.filter(Task.subsection_id == subsection_id)

    return {task_id for (task_id,) in query.all()}

def _get_section_index(section_id):
    sections = (
        Section.query
        .order_by(Section.order_index, Section.id)
        .all()
    )

    for index, section in enumerate(sections):
        if section.id == section_id:
            return index

    return None


def _get_solved_task_ids(student_id, subsection_id=None):
    query = (
        db.session.query(StudentAnswer.task_id)
        .join(Task, StudentAnswer.task_id == Task.id)
        .filter(
            StudentAnswer.student_id == student_id,
            StudentAnswer.is_correct.is_(True),
        )
        .distinct()
    )

    if subsection_id is not None:
        query = query.filter(Task.subsection_id == subsection_id)

    return {task_id for (task_id,) in query.all()}

def _subsection_progress(student_id, subsection):
    total_tasks = (
        Task.query
        .filter_by(subsection_id=subsection.id)
        .count()
    )

    solved_task_ids = _get_solved_task_ids(
        student_id,
        subsection.id
    )

    return {
        "solved_tasks": len(solved_task_ids),
        "total_tasks": total_tasks,
    }

def _attempts_used_in_current_cycle(task_id, student_id):
    last_answer = (
        StudentAnswer.query
        .filter_by(task_id=task_id, student_id=student_id)
        .order_by(StudentAnswer.id.desc())
        .first()
    )

    if last_answer is None or last_answer.is_correct or last_answer.attempt_number >= 3:
        return 0

    return last_answer.attempt_number


def _timed_options(task, interest):
    options = (
        TaskAnswerOption.query
        .filter_by(task_id=task.id)
        .order_by(TaskAnswerOption.order_index)
        .all()
    )
    theme_options = _task_theme(task, interest).get("options")
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

def _get_section_progress(student_id, section):
    subsections = (
        Subsection.query
        .filter_by(section_id=section.id)
        .all()
    )

    solved_tasks = 0
    total_tasks = 0

    for subsection in subsections:
        progress = _subsection_progress(
            student_id,
            subsection,
        )

        solved_tasks += progress["solved_tasks"]
        total_tasks += progress["total_tasks"]

    return {
        "solved_tasks": solved_tasks,
        "total_tasks": total_tasks,
    }

def _get_current_subsection(student_id):
    answers = (
        db.session.query(
            StudentAnswer.submitted_at,
            Task.subsection_id,
        )
        .join(Task, StudentAnswer.task_id == Task.id)
        .filter(
            StudentAnswer.student_id == student_id,
        )
        .order_by(StudentAnswer.submitted_at.desc())
        .all()
    )

    checked_subsections = set()

    for submitted_at, subsection_id in answers:
        if subsection_id in checked_subsections:
            continue

        checked_subsections.add(subsection_id)

        subsection = db.session.get(
            Subsection,
            subsection_id,
        )

        if subsection is None:
            continue

        progress = _subsection_progress(
            student_id,
            subsection,
        )

        if progress["solved_tasks"] < progress["total_tasks"]:
            return subsection

    return None

def _get_recent_sections(student_id, limit=5):
    rows = (
        db.session.query(
            StudentAnswer.submitted_at,
            Section.id,
        )
        .join(Task, StudentAnswer.task_id == Task.id)
        .join(Subsection, Task.subsection_id == Subsection.id)
        .join(Section, Subsection.section_id == Section.id)
        .filter(
            StudentAnswer.student_id == student_id,
        )
        .order_by(StudentAnswer.submitted_at.desc())
        .all()
    )

    section_ids = []

    for submitted_at, section_id in rows:
        if section_id not in section_ids:
            section_ids.append(section_id)

        if len(section_ids) >= limit:
            break

    return [
        db.session.get(Section, section_id)
        for section_id in section_ids
    ]

def _current_subsection_json(student_id, subsection):
    if subsection is None:
        return None

    section = db.session.get(
        Section,
        subsection.section_id,
    )

    progress = _subsection_progress(
        student_id,
        subsection,
    )

    return {
        "subsection_id": subsection.id,
        "subsection_title": subsection.title,
        "section_title": section.title,
        "section_index": _get_section_index(section.id),
        "solved_tasks": progress["solved_tasks"],
        "total_tasks": progress["total_tasks"],
    }

def determine_student_difficulty_level_(student_id, subsection_id):
    tasksDoneByStudent = (
        db.session.query(
            StudentAnswer.task_id,
            Task.difficulty_level,
            Task.subsection_id,
        )
        .join(Task, StudentAnswer.task_id == Task.id)
        .filter(
            StudentAnswer.student_id == student_id,
            StudentAnswer.is_correct.is_(True),
            Task.subsection_id == subsection_id,
        )
        .distinct()
        .all()
    )

    AllExercisesInSubsection = (
        db.session.query(Task.id, Task.difficulty_level, Task.subsection_id)
        .filter(Task.subsection_id == subsection_id)
        .all()
    )

    for i in range(1, 4, 1):
        countDifficultySub = 0

        for task in AllExercisesInSubsection:
            if task.difficulty_level == i:
                countDifficultySub += 1

        for task in tasksDoneByStudent:
            if (
                task.subsection_id == subsection_id
                and task.difficulty_level == i
            ):
                countDifficultySub -= 1

        if countDifficultySub > 0:
            return i

    return 3

def _task_solution(task, interest=None):
    if task.type == "single_choice":
        theme_options = _task_theme(task, interest).get("options")
        if isinstance(theme_options, list):
            correct_indexes = [
                index for index, option in enumerate(theme_options)
                if isinstance(option, dict) and option.get("correct") is True
            ]
            if len(correct_indexes) == 1:
                option = TaskAnswerOption.query.filter_by(
                    task_id=task.id,
                    order_index=correct_indexes[0] + 1,
                ).first()
                return {"correct_option_id": option.id} if option else None

        correct_option = TaskAnswerOption.query.filter_by(
            task_id=task.id,
            is_correct=True,
        ).first()
        return {
            "correct_option_id": correct_option.id
        } if correct_option is not None else None

    if task.type == "short_answer":
        theme = _task_theme(task, interest)
        return {
            "accepted_answers": theme.get("answers", task.accepted_answers or [])
        }

    return None

def determine_student_difficulty_level_(student_id, subsection_id):
    tasksDoneByStudent = (
        db.session.query(
            StudentAnswer.task_id,
            Task.difficulty_level,
            Task.subsection_id,
        )
        .join(Task, StudentAnswer.task_id == Task.id)
        .filter(
            StudentAnswer.student_id == student_id,
            StudentAnswer.is_correct.is_(True),
            Task.subsection_id == subsection_id,
        )
        .distinct()
        .all()
    )

    AllExercisesInSubsection = (
        db.session.query(Task.id, Task.difficulty_level, Task.subsection_id)
        .filter(Task.subsection_id == subsection_id)
        .all()
    )

    for i in range(1, 4, 1):
        countDifficultySub = 0

        for task in AllExercisesInSubsection:
            if task.difficulty_level == i:
                countDifficultySub += 1

        for task in tasksDoneByStudent:
            if (
                task.subsection_id == subsection_id
                and task.difficulty_level == i
            ):
                countDifficultySub -= 1

        if countDifficultySub > 0:
            return i

    # here we return exercise of maximum difficulty from a subsection
    maxDifficulty = (
        db.
        session.query(Task.difficulty_level)
        .filter(
            Task.subsection_id == subsection_id,
            Task.difficulty_level.isnot(None),
        )
        .order_by(Task.difficulty_level.desc())
        .first()
    )
    return maxDifficulty.difficulty_level if maxDifficulty else 3

def _attempts_used_in_current_cycle(task_id, student_id):
    last_answer = (
        StudentAnswer.query
        .filter_by(task_id=task_id, student_id=student_id)
        .order_by(StudentAnswer.id.desc())
        .first()
    )

    if last_answer is None or last_answer.is_correct or last_answer.attempt_number >= 3:
        return 0

    return last_answer.attempt_number

def _task_solution(task, interest=None):
    if task.type == "single_choice":
        theme_options = _task_theme(task, interest).get("options")
        if isinstance(theme_options, list):
            correct_indexes = [
                index for index, option in enumerate(theme_options)
                if isinstance(option, dict) and option.get("correct") is True
            ]
            if len(correct_indexes) == 1:
                option = TaskAnswerOption.query.filter_by(
                    task_id=task.id,
                    order_index=correct_indexes[0] + 1,
                ).first()
                return {"correct_option_id": option.id} if option else None

        correct_option = TaskAnswerOption.query.filter_by(
            task_id=task.id,
            is_correct=True,
        ).first()
        return {
            "correct_option_id": correct_option.id
        } if correct_option is not None else None

    if task.type == "short_answer":
        theme = _task_theme(task, interest)
        return {
            "accepted_answers": theme.get("answers", task.accepted_answers or [])
        }

    return None

def _student_subsection_json(student_id, subsection):
    progress = _subsection_progress(student_id, subsection)

    return {
        "id": subsection.id,
        "title": subsection.title,
        "description": subsection.description,
        "solved_tasks": progress["solved_tasks"],
        "total_tasks": progress["total_tasks"],
    }
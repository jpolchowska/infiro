from app.constants import DEFAULT_THEME, TaskType
from app.extensions import db
from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.task_answer_options import TaskAnswerOption
from app.models.tasks import Task
from app.services.answer_options import sync_answer_options
from app.services.import_validation import MEMORY_DIFFICULTY_BY_PAIRS, validate_task_import
from app.services.themes import merge_theme_variants


def _task_difficulty(task_data, default):
    if task_data["type"] != TaskType.MEMORY:
        return task_data.get("difficulty")
    return MEMORY_DIFFICULTY_BY_PAIRS.get(len(default.get("pairs") or []))


def _task_output(task):
    return {
        "id": task.id,
        "content_key": task.content_key,
        "type": task.type,
        "difficulty": task.difficulty_level,
        "themes": task.themes,
    }


def _upsert_section(title, order_index, cache):
    section = cache.get(title) or Section.query.filter_by(title=title).first()
    if section is None:
        section = Section(title=title)
        db.session.add(section)
        db.session.flush()
    section.order_index = order_index
    cache[title] = section
    return section


def _upsert_subsection(section, title, order_index, cache):
    key = (section.id, title)
    subsection = cache.get(key) or Subsection.query.filter_by(
        section_id=section.id, title=title
    ).first()
    if subsection is None:
        subsection = Subsection(section_id=section.id, title=title)
        db.session.add(subsection)
        db.session.flush()
    subsection.order_index = order_index
    cache[key] = subsection
    return subsection


def _upsert_task(subsection, task_data, order_index):
    themes = merge_theme_variants(task_data["themes"])
    default = themes[DEFAULT_THEME]
    content_key = task_data["content_key"]
    task = Task.query.filter_by(content_key=content_key).first()
    if task is None:
        task = Task(
            subsection_id=subsection.id,
            title="",
            body_text=default["prompt"].strip(),
            difficulty_level=_task_difficulty(task_data, default),
            type=task_data["type"],
            order_index=order_index,
            content_key=content_key,
        )
        db.session.add(task)
        db.session.flush()

    task.subsection_id = subsection.id
    task.type = task_data["type"]
    task.order_index = order_index
    task.title = None
    task.body_text = default["prompt"].strip()
    task.difficulty_level = _task_difficulty(task_data, default)
    task.accepted_answers = default.get("answers")
    task.memory_pairs = default.get("pairs")
    task.themes = themes
    task.content_key = content_key
    task_data["id"] = task.id

    if task.type == TaskType.SINGLE_CHOICE:
        sync_answer_options(TaskAnswerOption, {"task_id": task.id}, default["options"])
    return task


def import_tasks(data):
    errors = validate_task_import(data)
    if errors:
        return None, errors

    section_cache = {}
    subsection_cache = {}
    imported_tasks = []

    for section_order, section_data in enumerate(data, start=1):
        section = _upsert_section(section_data["section"].strip(), section_order, section_cache)

        for subsection_order, subsection_data in enumerate(section_data["subsections"], start=1):
            subsection = _upsert_subsection(
                section, subsection_data["subsection"].strip(), subsection_order, subsection_cache
            )

            for task_order, task_data in enumerate(subsection_data["tasks"], start=1):
                task = _upsert_task(subsection, task_data, task_order)
                imported_tasks.append(_task_output(task))

    db.session.commit()

    return {
        "task_count": len(imported_tasks),
        "tasks": imported_tasks,
        "data": data,
    }, None

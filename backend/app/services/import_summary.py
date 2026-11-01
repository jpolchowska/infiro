from collections import Counter

from app.extensions import db
from app.models.ebooks import Ebook
from app.models.section_test_questions import SectionTestQuestion
from app.models.sections import Section
from app.models.student_answers import StudentAnswer
from app.models.subsections import Subsection
from app.models.tasks import Task


def _file_contents(data):
    section_titles = []
    subsection_keys = []
    content_keys = set()
    for section_data in data:
        section_title = section_data["section"].strip()
        section_titles.append(section_title)
        for subsection_data in section_data["subsections"]:
            subsection_keys.append((section_title, subsection_data["subsection"].strip()))
            content_keys.update(task_data["content_key"] for task_data in subsection_data["tasks"])
    return section_titles, subsection_keys, content_keys


def _answer_counts(task_ids):
    if not task_ids:
        return Counter()
    rows = (
        db.session.query(StudentAnswer.task_id, db.func.count(StudentAnswer.id))
        .filter(StudentAnswer.task_id.in_(task_ids))
        .group_by(StudentAnswer.task_id)
    )
    return Counter(dict(rows.all()))


def summarize_task_import(data):
    section_titles, subsection_keys, content_keys = _file_contents(data)
    file_sections = set(section_titles)
    file_subsections = set(subsection_keys)

    sections = Section.query.order_by(Section.order_index, Section.id).all()
    sections_by_id = {section.id: section for section in sections}
    subsections = Subsection.query.order_by(Subsection.order_index, Subsection.id).all()
    subsections_by_id = {subsection.id: subsection for subsection in subsections}
    tasks = Task.query.order_by(Task.order_index, Task.id).all()

    def section_title_of(subsection):
        return sections_by_id[subsection.section_id].title

    deleted_section_ids = {section.id for section in sections if section.title not in file_sections}
    deleted_subsection_ids = {
        subsection.id
        for subsection in subsections
        if subsection.section_id not in deleted_section_ids
        and (section_title_of(subsection), subsection.title) not in file_subsections
    }
    removed_tasks = [task for task in tasks if task.content_key not in content_keys]
    answer_counts = _answer_counts([task.id for task in removed_tasks])

    removed_by_subsection = {}
    for task in removed_tasks:
        removed_by_subsection.setdefault(task.subsection_id, []).append(task)

    def removed_in(subsection_ids):
        return [task for subsection_id in subsection_ids for task in removed_by_subsection.get(subsection_id, [])]

    deleted_tasks = []
    for task in removed_tasks:
        subsection = subsections_by_id[task.subsection_id]
        if subsection.id in deleted_subsection_ids or subsection.section_id in deleted_section_ids:
            continue
        deleted_tasks.append({
            "id": task.id,
            "content_key": task.content_key,
            "prompt": task.body_text,
            "section_title": section_title_of(subsection),
            "subsection_title": subsection.title,
            "answer_count": answer_counts[task.id],
        })

    deleted_subsections = []
    for subsection in subsections:
        if subsection.id not in deleted_subsection_ids:
            continue
        removed = removed_in([subsection.id])
        deleted_subsections.append({
            "id": subsection.id,
            "section_title": section_title_of(subsection),
            "title": subsection.title,
            "task_count": len(removed),
            "answer_count": sum(answer_counts[task.id] for task in removed),
            "has_ebook": Ebook.query.filter_by(subsection_id=subsection.id).first() is not None,
        })

    deleted_sections = []
    for section in sections:
        if section.id not in deleted_section_ids:
            continue
        own_subsection_ids = [subsection.id for subsection in subsections if subsection.section_id == section.id]
        removed = removed_in(own_subsection_ids)
        deleted_sections.append({
            "id": section.id,
            "title": section.title,
            "subsection_count": len(own_subsection_ids),
            "task_count": len(removed),
            "answer_count": sum(answer_counts[task.id] for task in removed),
            "has_final_test": SectionTestQuestion.query.filter_by(section_id=section.id).first() is not None,
        })

    existing_keys = {task.content_key for task in tasks}
    existing_sections = {section.title for section in sections}
    existing_subsections = {(section_title_of(subsection), subsection.title) for subsection in subsections}

    return {
        "tasks": {
            "created": len(content_keys - existing_keys),
            "updated": len(content_keys & existing_keys),
            "deleted": deleted_tasks,
        },
        "subsections": {
            "created": [
                {"section_title": section_title, "title": title}
                for section_title, title in dict.fromkeys(subsection_keys)
                if (section_title, title) not in existing_subsections
            ],
            "deleted": deleted_subsections,
        },
        "sections": {
            "created": [title for title in dict.fromkeys(section_titles) if title not in existing_sections],
            "deleted": deleted_sections,
        },
    }

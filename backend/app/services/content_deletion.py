from app.extensions import db
from app.models.ebooks import Ebook
from app.models.leveling_test_answers import LevelingTestAnswer
from app.models.leveling_test_section_results import LevelingTestSectionResult
from app.models.section_test_answer_options import SectionTestAnswerOption
from app.models.section_test_answers import SectionTestAnswer
from app.models.section_test_attempts import SectionTestAttempt
from app.models.section_test_questions import SectionTestQuestion
from app.models.sections import Section
from app.models.student_answers import StudentAnswer
from app.models.subsections import Subsection
from app.models.task_answer_options import TaskAnswerOption
from app.models.tasks import Task
from app.services.ebook_images import image_directories, remove_image_directories


def _renumber(query):
    for position, item in enumerate(query.all(), start=1):
        item.order_index = position


def _renumber_tasks(subsection_ids):
    for subsection_id in subsection_ids:
        _renumber(Task.query.filter_by(subsection_id=subsection_id).order_by(Task.order_index, Task.id))


def _delete_tasks(task_ids):
    if not task_ids:
        return

    subsection_ids = {
        subsection_id
        for (subsection_id,) in db.session.query(Task.subsection_id).filter(Task.id.in_(task_ids)).distinct()
    }
    StudentAnswer.query.filter(StudentAnswer.task_id.in_(task_ids)).delete(synchronize_session=False)
    LevelingTestAnswer.query.filter(LevelingTestAnswer.task_id.in_(task_ids)).delete(synchronize_session=False)
    TaskAnswerOption.query.filter(TaskAnswerOption.task_id.in_(task_ids)).delete(synchronize_session=False)
    Task.query.filter(Task.id.in_(task_ids)).delete(synchronize_session=False)
    _renumber_tasks(subsection_ids)


def _delete_subsections(subsection_ids):
    if not subsection_ids:
        return

    task_ids = [
        task.id for task in Task.query.filter(Task.subsection_id.in_(subsection_ids)).all()
    ]
    _delete_tasks(task_ids)
    ebooks = Ebook.query.filter(Ebook.subsection_id.in_(subsection_ids)).all()
    remove_image_directories(set().union(*(image_directories(ebook.content) for ebook in ebooks)))
    Ebook.query.filter(Ebook.subsection_id.in_(subsection_ids)).delete(synchronize_session=False)
    Subsection.query.filter(Subsection.id.in_(subsection_ids)).delete(synchronize_session=False)


def _delete_section_test(section_id):
    attempt_ids = [
        attempt.id for attempt in SectionTestAttempt.query.filter_by(section_id=section_id).all()
    ]
    if attempt_ids:
        SectionTestAnswer.query.filter(
            SectionTestAnswer.attempt_id.in_(attempt_ids)
        ).delete(synchronize_session=False)
    question_ids = [
        question.id for question in SectionTestQuestion.query.filter_by(section_id=section_id).all()
    ]
    if question_ids:
        SectionTestAnswerOption.query.filter(
            SectionTestAnswerOption.section_test_question_id.in_(question_ids)
        ).delete(synchronize_session=False)
        SectionTestQuestion.query.filter(
            SectionTestQuestion.id.in_(question_ids)
        ).delete(synchronize_session=False)
    SectionTestAttempt.query.filter_by(section_id=section_id).delete(synchronize_session=False)


def delete_final_test_questions(question_ids):
    question_ids = list(question_ids)
    if not question_ids:
        return

    section_ids = {
        section_id
        for (section_id,) in db.session.query(SectionTestQuestion.section_id)
        .filter(SectionTestQuestion.id.in_(question_ids))
        .distinct()
    }
    SectionTestAnswer.query.filter(SectionTestAnswer.question_id.in_(question_ids)).delete(synchronize_session=False)
    SectionTestAnswerOption.query.filter(
        SectionTestAnswerOption.section_test_question_id.in_(question_ids)
    ).delete(synchronize_session=False)
    SectionTestQuestion.query.filter(SectionTestQuestion.id.in_(question_ids)).delete(synchronize_session=False)
    for section_id in section_ids:
        _renumber(
            SectionTestQuestion.query.filter_by(section_id=section_id).order_by(
                SectionTestQuestion.order_index, SectionTestQuestion.id
            )
        )


def delete_ebook(ebook):
    remove_image_directories(image_directories(ebook.content))
    db.session.delete(ebook)


def delete_task(task):
    _delete_tasks([task.id])


def delete_tasks(task_ids):
    _delete_tasks(list(task_ids))


def delete_subsection(subsection):
    section_id = subsection.section_id
    _delete_subsections([subsection.id])
    _renumber(Subsection.query.filter_by(section_id=section_id).order_by(Subsection.order_index, Subsection.id))


def delete_section(section):
    subsection_ids = [
        subsection.id for subsection in Subsection.query.filter_by(section_id=section.id).all()
    ]
    _delete_subsections(subsection_ids)
    _delete_section_test(section.id)
    LevelingTestSectionResult.query.filter_by(section_id=section.id).update(
        {"section_id": None}, synchronize_session=False
    )
    db.session.delete(section)
    db.session.flush()
    _renumber(Section.query.order_by(Section.order_index, Section.id))

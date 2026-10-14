from app.extensions import db
from app.models.ebooks import Ebook
from app.models.leveling_test_answers import LevelingTestAnswer
from app.models.leveling_test_section_results import LevelingTestSectionResult
from app.models.section_test_answer_options import SectionTestAnswerOption
from app.models.section_test_attempts import SectionTestAttempt
from app.models.section_test_questions import SectionTestQuestion
from app.models.student_answers import StudentAnswer
from app.models.subsections import Subsection
from app.models.task_answer_options import TaskAnswerOption
from app.models.tasks import Task


def _delete_tasks(task_ids):
    if not task_ids:
        return

    StudentAnswer.query.filter(StudentAnswer.task_id.in_(task_ids)).delete(synchronize_session=False)
    LevelingTestAnswer.query.filter(LevelingTestAnswer.task_id.in_(task_ids)).delete(synchronize_session=False)
    TaskAnswerOption.query.filter(TaskAnswerOption.task_id.in_(task_ids)).delete(synchronize_session=False)
    Task.query.filter(Task.id.in_(task_ids)).delete(synchronize_session=False)


def _delete_subsections(subsection_ids):
    if not subsection_ids:
        return

    task_ids = [
        task.id for task in Task.query.filter(Task.subsection_id.in_(subsection_ids)).all()
    ]
    _delete_tasks(task_ids)
    Ebook.query.filter(Ebook.subsection_id.in_(subsection_ids)).delete(synchronize_session=False)
    Subsection.query.filter(Subsection.id.in_(subsection_ids)).delete(synchronize_session=False)


def _delete_section_test(section_id):
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


def delete_task(task):
    _delete_tasks([task.id])


def delete_subsection(subsection):
    _delete_subsections([subsection.id])


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

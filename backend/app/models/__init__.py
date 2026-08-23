from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.knowledge_resources import KnowledgeResource
from app.models.tasks import Task
from app.models.task_answer_options import TaskAnswerOption

# StudentAnswer jest odłożony: jego student_id wskazuje FK na tabelę `users`,
# która jeszcze nie istnieje (model User nie powstał).
# Dodać ten import z powrotem przy pracach nad Uczniami/Nauczycielami.
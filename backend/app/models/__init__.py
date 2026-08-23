from app.models.sections import Section
from app.models.subsections import Subsection
from app.models.knowledge_resources import KnowledgeResource
from app.models.tasks import Task
from app.models.task_answer_options import TaskAnswerOption

# StudentAnswer is deferred: its student_id FK points at a `users` table that
# doesn't exist yet (User model isn't built in this round). Re-add the import
# once Users/Students backend work lands.
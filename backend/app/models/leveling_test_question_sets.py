from app.clock import utc_now
from app.extensions import db


class LevelingTestQuestionSet(db.Model):
    __tablename__ = "leveling_test_question_sets"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    task_ids = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)
    attempt_id = db.Column(db.Integer, db.ForeignKey("leveling_test_attempts.id"), nullable=True)

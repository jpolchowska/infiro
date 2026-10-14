from app.extensions import db


class LevelingTestAnswer(db.Model):
    __tablename__ = "leveling_test_answers"

    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(
        db.Integer, db.ForeignKey("leveling_test_attempts.id"), nullable=False, index=True
    )
    task_id = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False)
    selected_option_id = db.Column(
        db.Integer, db.ForeignKey("task_answer_options.id"), nullable=True
    )
    answer_text = db.Column(db.Text, nullable=True)
    is_correct = db.Column(db.Boolean, nullable=False)

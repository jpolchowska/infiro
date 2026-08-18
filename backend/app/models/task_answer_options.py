from app.extensions import db


class TaskAnswerOption(db.Model):
    __tablename__ = "task_answer_options"

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(
        db.Integer,
        db.ForeignKey("tasks.id"),
        nullable=False
    )
    option_text = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False)
    order_index = db.Column(db.Integer, nullable=False)
from app.extensions import db


class StudentAnswer(db.Model):
    __tablename__ = "student_answers"

    id = db.Column(db.Integer, primary_key=True)

    task_id = db.Column(
        db.Integer,
        db.ForeignKey("tasks.id"),
        nullable=False
    )

    student_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    selected_option_id = db.Column(
        db.Integer,
        db.ForeignKey("task_answer_options.id"),
        nullable=True
    )

    answer_text = db.Column(db.Text, nullable=True)
    is_correct = db.Column(db.Boolean, nullable=False)
    attempt_number = db.Column(db.Integer, nullable=False)
    submitted_at = db.Column(db.DateTime, nullable=False)
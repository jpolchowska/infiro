from app.extensions import db


class SectionTestAnswer(db.Model):
    __tablename__ = "section_test_answers"

    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(
        db.Integer, db.ForeignKey("section_test_attempts.id"), nullable=False, index=True
    )
    question_id = db.Column(db.Integer, db.ForeignKey("section_test_questions.id"), nullable=False)
    selected_option_id = db.Column(
        db.Integer, db.ForeignKey("section_test_answer_options.id"), nullable=True
    )
    answer_text = db.Column(db.Text, nullable=True)
    is_correct = db.Column(db.Boolean, nullable=False)

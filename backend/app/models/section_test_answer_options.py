from app.extensions import db


class SectionTestAnswerOption(db.Model):
    __tablename__ = "section_test_answer_options"

    id = db.Column(db.Integer, primary_key=True)
    section_test_question_id = db.Column(
        db.Integer,
        db.ForeignKey("section_test_questions.id"),
        nullable=False
    )
    option_text = db.Column(db.Text, nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False)
    order_index = db.Column(db.Integer, nullable=False)

from app.extensions import db


class SectionTestQuestion(db.Model):
    __tablename__ = "section_test_questions"

    id = db.Column(db.Integer, primary_key=True)
    section_id = db.Column(
        db.Integer,
        db.ForeignKey("sections.id"),
        nullable=False
    )
    prompt = db.Column(db.Text, nullable=False)
    type = db.Column(db.String, nullable=False, default="single_choice")
    order_index = db.Column(db.Integer, nullable=False, default=0)
    content_key = db.Column(db.String, unique=True, nullable=True)
    accepted_answers = db.Column(db.JSON, nullable=True)
    themes = db.Column(db.JSON, nullable=True)

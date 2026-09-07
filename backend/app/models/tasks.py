from app.extensions import db


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    subsection_id = db.Column(
        db.Integer,
        db.ForeignKey("subsections.id"),
        nullable=False
    )
    title = db.Column(db.Text, nullable=False)
    body_text = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.Text, nullable=True)
    difficulty_level = db.Column(db.Integer, nullable=False)
    type = db.Column(db.String,nullable=False,default="single_choice")
    order_index = db.Column(db.Integer,nullable=False,default=0)
    content_key = db.Column(db.String,unique=True,nullable=True)
    accepted_answers = db.Column(db.JSON,nullable=True)
    memory_pairs = db.Column(db.JSON,nullable=True)
    themes = db.Column(db.JSON,nullable=True)
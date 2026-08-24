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
from datetime import datetime

from app.extensions import db

class ebooks(db.Model):
    __tablename__ = "ebooks"
    id = db.Column(db.Integer, primary_key=True)
    subsection_id = db.Column(
        db.Integer,
        db.ForeignKey("subsections.id"),
        nullable=False
    )
    title = db.Column(db.Text, nullable=False)
    intro = db.Column(db.Text, nullable=True)
    content = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
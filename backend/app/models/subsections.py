from datetime import datetime

from app.extensions import db


class Subsection(db.Model):
    __tablename__ = "subsections"

    id = db.Column(db.Integer, primary_key=True)
    section_id = db.Column(
        db.Integer,
        db.ForeignKey("sections.id"),
        nullable=False
    )
    title = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text, nullable=True)
    order_index = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

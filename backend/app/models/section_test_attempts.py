from datetime import datetime

from app.extensions import db

class SectionTestAttempt(db.Model):
    __tablename__ = "section_test_attempts"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(
        db.Integer, db.ForeignKey("users.id"), nullable=False
    )
    section_id = db.Column(
        db.Integer, db.ForeignKey("sections.id"), nullable=False
    )
    score = db.Column(db.Integer, nullable=False)
    max_score = db.Column(db.Integer, nullable=False)
    completed_at = db.Column(
        db.DateTime, default=datetime.utcnow, nullable=False
    )

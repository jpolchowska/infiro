from app.clock import utc_now
from app.extensions import db


class LevelingTestSettings(db.Model):
    __tablename__ = "leveling_test_settings"

    id = db.Column(db.Integer, primary_key=True)
    questions_per_section = db.Column(db.Integer, nullable=False)
    interval_days = db.Column(db.Integer, nullable=False)
    completion_window_days = db.Column(db.Integer, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False, default=utc_now, onupdate=utc_now)

from app.clock import utc_now
from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    keycloak_sub = db.Column(db.String(255), unique=True, nullable=False, index=True)
    role = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utc_now)
    leveling_test_completed_at = db.Column(db.DateTime, nullable=True)
    username = db.Column(db.String(255), unique=True, nullable=True, index=True)
    name = db.Column(db.String(255), nullable=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    interest = db.Column(db.String(50), nullable=True)

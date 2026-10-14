from app.extensions import db


class LevelingTestSectionResult(db.Model):
    __tablename__ = "leveling_test_section_results"

    id = db.Column(db.Integer, primary_key=True)
    attempt_id = db.Column(
        db.Integer, db.ForeignKey("leveling_test_attempts.id"), nullable=False, index=True
    )
    section_id = db.Column(db.Integer, db.ForeignKey("sections.id"), nullable=True)
    section_title = db.Column(db.Text, nullable=False)
    score = db.Column(db.Integer, nullable=False)
    total = db.Column(db.Integer, nullable=False)

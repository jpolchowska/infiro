from datetime import datetime

from app.extensions import db


class KnowledgeResource(db.Model):
    __tablename__ = "knowledge_resources"
    __table_args__ = (
        db.CheckConstraint(
            "(section_id IS NOT NULL AND subsection_id IS NULL) OR "
            "(section_id IS NULL AND subsection_id IS NOT NULL)",
            name="knowledge_resources_exactly_one_parent"
        ),
    )

    id = db.Column(db.Integer, primary_key=True)

    section_id = db.Column(
        db.Integer,
        db.ForeignKey("sections.id"),
        nullable=True
    )

    subsection_id = db.Column(
        db.Integer,
        db.ForeignKey("subsections.id"),
        nullable=True
    )

    type = db.Column(db.Text, nullable=False)
    title = db.Column(db.Text, nullable=False)
    content_text = db.Column(db.Text, nullable=True)
    file_url = db.Column(db.Text, nullable=True)
    order_index = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

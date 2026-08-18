from app.extensions import db


class KnowledgeResource(db.Model):
    __tablename__ = "knowledge_resources"

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
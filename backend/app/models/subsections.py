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
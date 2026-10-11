"""drop knowledge resources

Revision ID: b3d9c41e7a52
Revises: a7e609d7da78
Create Date: 2026-10-11

"""
from alembic import op
import sqlalchemy as sa


revision = "b3d9c41e7a52"
down_revision = "a7e609d7da78"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_table("knowledge_resources")


def downgrade():
    op.create_table(
        "knowledge_resources",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("section_id", sa.Integer(), nullable=True),
        sa.Column("subsection_id", sa.Integer(), nullable=True),
        sa.Column("type", sa.Text(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("content_text", sa.Text(), nullable=True),
        sa.Column("file_url", sa.Text(), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.CheckConstraint(
            "(section_id IS NOT NULL AND subsection_id IS NULL) OR "
            "(section_id IS NULL AND subsection_id IS NOT NULL)",
            name="knowledge_resources_exactly_one_parent",
        ),
        sa.ForeignKeyConstraint(["section_id"], ["sections.id"]),
        sa.ForeignKeyConstraint(["subsection_id"], ["subsections.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

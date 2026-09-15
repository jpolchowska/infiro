"""add content to ebooks

Revision ID: 8a6f2d6f0f5c
Revises: ff3d1d2734b4
Create Date: 2026-09-14

"""
from alembic import op
import sqlalchemy as sa


revision = "8a6f2d6f0f5c"
down_revision = "ff3d1d2734b4"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("ebooks", sa.Column("content", sa.JSON(), nullable=True))
    op.execute("UPDATE ebooks SET content = '{}' WHERE content IS NULL")
    op.alter_column("ebooks", "content", nullable=False)


def downgrade():
    op.drop_column("ebooks", "content")
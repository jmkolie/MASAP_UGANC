"""add accepted_file_types to assignments

Revision ID: 002_add_assignment_file_types
Revises: 001_add_specialty_level
Create Date: 2026-03-18
"""
from alembic import op
import sqlalchemy as sa

revision = '002_add_assignment_file_types'
down_revision = '001_add_specialty_level'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('assignments', sa.Column('accepted_file_types', sa.String(200), nullable=True))


def downgrade():
    op.drop_column('assignments', 'accepted_file_types')

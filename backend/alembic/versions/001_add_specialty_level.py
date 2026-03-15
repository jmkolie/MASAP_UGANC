"""add specialty to modules and student_profiles, level to programs

Revision ID: 001_add_specialty_level
Revises:
Create Date: 2026-03-15
"""
from alembic import op
import sqlalchemy as sa

revision = '001_add_specialty_level'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('programs', sa.Column('level', sa.Integer(), nullable=True))
    op.add_column('modules', sa.Column('specialty', sa.String(100), nullable=True))
    op.add_column('student_profiles', sa.Column('specialty', sa.String(100), nullable=True))


def downgrade():
    op.drop_column('programs', 'level')
    op.drop_column('modules', 'specialty')
    op.drop_column('student_profiles', 'specialty')

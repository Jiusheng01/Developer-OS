"""Initial Dashboard schema.

Revision ID: 20260705_0001
Revises:
Create Date: 2026-07-05

"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260705_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "goals",
        sa.Column("id", sa.String(length=80), nullable=False),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("progress", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("target_year", sa.String(length=16), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "learning_items",
        sa.Column("id", sa.String(length=80), nullable=False),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("area", sa.String(length=160), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("progress", sa.Integer(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=False),
        sa.Column("tags", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "notes",
        sa.Column("id", sa.String(length=80), nullable=False),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=120), nullable=False),
        sa.Column("tags", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "todos",
        sa.Column("id", sa.String(length=80), nullable=False),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("done", sa.Boolean(), nullable=False),
        sa.Column("priority", sa.String(length=20), nullable=False),
        sa.Column("tags", sa.Text(), nullable=False),
        sa.Column("due_date", sa.String(length=32), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "goal_tasks",
        sa.Column("id", sa.String(length=80), nullable=False),
        sa.Column("goal_id", sa.String(length=80), nullable=False),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("done", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["goal_id"], ["goals.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("goal_tasks")
    op.drop_table("todos")
    op.drop_table("notes")
    op.drop_table("learning_items")
    op.drop_table("goals")

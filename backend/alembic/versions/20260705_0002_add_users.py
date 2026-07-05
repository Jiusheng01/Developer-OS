"""Add users.

Revision ID: 20260705_0002
Revises: 20260705_0001
Create Date: 2026-07-05

"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260705_0002"
down_revision: str | None = "20260705_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=80), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("username", sa.String(length=40), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("password_hash", sa.String(length=260), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")

"""Add Dashboard user ownership.

Revision ID: 20260705_0003
Revises: 20260705_0002
Create Date: 2026-07-05

"""
from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260705_0003"
down_revision: str | None = "20260705_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

OWNER_TABLES = ("todos", "learning_items", "notes", "goals")


def upgrade() -> None:
    for table_name in OWNER_TABLES:
        with op.batch_alter_table(table_name) as batch_op:
            batch_op.add_column(sa.Column("user_id", sa.String(length=80), nullable=True))
            batch_op.create_index(batch_op.f(f"ix_{table_name}_user_id"), ["user_id"])
            batch_op.create_foreign_key(
                batch_op.f(f"fk_{table_name}_user_id_users"),
                "users",
                ["user_id"],
                ["id"],
                ondelete="CASCADE",
            )


def downgrade() -> None:
    for table_name in reversed(OWNER_TABLES):
        with op.batch_alter_table(table_name) as batch_op:
            batch_op.drop_constraint(batch_op.f(f"fk_{table_name}_user_id_users"), type_="foreignkey")
            batch_op.drop_index(batch_op.f(f"ix_{table_name}_user_id"))
            batch_op.drop_column("user_id")

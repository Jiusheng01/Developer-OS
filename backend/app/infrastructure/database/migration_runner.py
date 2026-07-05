from __future__ import annotations

import argparse
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect, text

from app.core.config import get_settings

BASELINE_DASHBOARD_REVISION = "20260705_0001"
USER_OWNERSHIP_REVISION = "20260705_0003"
LEGACY_DASHBOARD_TABLES = {"goal_tasks", "goals", "learning_items", "notes", "todos"}
AI_TABLES = {"ai_plan_drafts", "ai_providers"}
USER_OWNED_SCHEMA_TABLES = LEGACY_DASHBOARD_TABLES | {"users"}
CURRENT_SCHEMA_TABLES = USER_OWNED_SCHEMA_TABLES | AI_TABLES
OWNER_TABLES = {"goals", "learning_items", "notes", "todos"}


def _table_names(database_url: str) -> set[str]:
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    engine = create_engine(database_url, connect_args=connect_args)
    try:
        return set(inspect(engine).get_table_names())
    finally:
        engine.dispose()


def _owner_tables_have_user_id(database_url: str) -> bool:
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    engine = create_engine(database_url, connect_args=connect_args)
    try:
        inspector = inspect(engine)
        return all("user_id" in {column["name"] for column in inspector.get_columns(table)} for table in OWNER_TABLES)
    finally:
        engine.dispose()


def _current_alembic_revision(database_url: str, table_names: set[str]) -> str | None:
    if "alembic_version" not in table_names:
        return None

    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    engine = create_engine(database_url, connect_args=connect_args)
    try:
        with engine.connect() as connection:
            value = connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one_or_none()
            return value if isinstance(value, str) and value else None
    finally:
        engine.dispose()


def _detect_bootstrap_revision(database_url: str) -> str | None:
    if not database_url.startswith("sqlite"):
        return None

    table_names = _table_names(database_url)
    if _current_alembic_revision(database_url, table_names) is not None:
        return None

    if CURRENT_SCHEMA_TABLES.issubset(table_names) and _owner_tables_have_user_id(database_url):
        return "head"

    if USER_OWNED_SCHEMA_TABLES.issubset(table_names) and _owner_tables_have_user_id(database_url):
        return USER_OWNERSHIP_REVISION

    if LEGACY_DASHBOARD_TABLES.issubset(table_names):
        return BASELINE_DASHBOARD_REVISION

    return None


def run_migrations(config_path: Path, revision: str) -> None:
    config = Config(str(config_path))
    database_url = get_settings().database_url
    bootstrap_revision = _detect_bootstrap_revision(database_url)
    if bootstrap_revision is not None:
        print(
            f"Detected an existing SQLite schema without alembic_version; "
            f"stamping {bootstrap_revision} before upgrade."
        )
        command.stamp(config, bootstrap_revision)

    command.upgrade(config, revision)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run Developer OS API database migrations.")
    parser.add_argument("--config", required=True, type=Path)
    parser.add_argument("--revision", default="head")
    args = parser.parse_args()

    run_migrations(config_path=args.config, revision=args.revision)


if __name__ == "__main__":
    main()

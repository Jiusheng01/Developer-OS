from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect, text

from app.core.config import get_settings
from app.infrastructure.database import models  # noqa: F401
from app.infrastructure.database.base import Base
from app.infrastructure.database.migration_runner import run_migrations


BACKEND_ROOT = Path(__file__).resolve().parents[1]


def test_alembic_initial_migration_creates_dashboard_tables(tmp_path: Path, monkeypatch) -> None:
    database_url = f"sqlite:///{tmp_path / 'migration.db'}"
    monkeypatch.setenv("DEVELOPER_OS_DATABASE_URL", database_url)
    get_settings.cache_clear()

    try:
        config = Config(str(BACKEND_ROOT / "alembic.ini"))
        command.upgrade(config, "head")

        engine = create_engine(database_url)
        try:
            inspector = inspect(engine)

            assert {
                "alembic_version",
                "goal_tasks",
                "goals",
                "learning_items",
                "notes",
                "todos",
                "users",
                "ai_providers",
                "ai_plan_drafts",
            }.issubset(set(inspector.get_table_names()))

            user_indexes = {index["name"] for index in inspector.get_indexes("users")}
            assert {"ix_users_email", "ix_users_username"}.issubset(user_indexes)

            for table_name in ("todos", "learning_items", "notes", "goals"):
                column_names = {column["name"] for column in inspector.get_columns(table_name)}
                assert "user_id" in column_names
        finally:
            engine.dispose()
    finally:
        get_settings.cache_clear()


def test_migration_runner_upgrades_legacy_sqlite_without_alembic_version(
    tmp_path: Path, monkeypatch
) -> None:
    database_url = f"sqlite:///{tmp_path / 'legacy.db'}"
    monkeypatch.setenv("DEVELOPER_OS_DATABASE_URL", database_url)
    get_settings.cache_clear()

    try:
        config = Config(str(BACKEND_ROOT / "alembic.ini"))
        command.upgrade(config, "20260705_0001")

        engine = create_engine(database_url)
        try:
            with engine.begin() as connection:
                connection.execute(text("DELETE FROM alembic_version"))
        finally:
            engine.dispose()

        run_migrations(BACKEND_ROOT / "alembic.ini", "head")

        engine = create_engine(database_url)
        try:
            inspector = inspect(engine)
            table_names = set(inspector.get_table_names())
            assert {"users", "ai_providers", "ai_plan_drafts"}.issubset(table_names)
            with engine.connect() as connection:
                version = connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one()
            assert version == "20260705_0004"
            for table_name in ("todos", "learning_items", "notes", "goals"):
                column_names = {column["name"] for column in inspector.get_columns(table_name)}
                assert "user_id" in column_names
        finally:
            engine.dispose()
    finally:
        get_settings.cache_clear()


def test_migration_runner_stamps_current_sqlite_without_alembic_version(
    tmp_path: Path, monkeypatch
) -> None:
    database_url = f"sqlite:///{tmp_path / 'current.db'}"
    monkeypatch.setenv("DEVELOPER_OS_DATABASE_URL", database_url)
    get_settings.cache_clear()

    try:
        engine = create_engine(database_url)
        try:
            Base.metadata.create_all(bind=engine)
        finally:
            engine.dispose()

        run_migrations(BACKEND_ROOT / "alembic.ini", "head")

        engine = create_engine(database_url)
        try:
            inspector = inspect(engine)
            assert "alembic_version" in inspector.get_table_names()
            with engine.connect() as connection:
                version = connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one()
            assert version == "20260705_0004"
        finally:
            engine.dispose()
    finally:
        get_settings.cache_clear()


def test_migration_runner_upgrades_user_owned_sqlite_without_alembic_version(
    tmp_path: Path, monkeypatch
) -> None:
    database_url = f"sqlite:///{tmp_path / 'user-owned.db'}"
    monkeypatch.setenv("DEVELOPER_OS_DATABASE_URL", database_url)
    get_settings.cache_clear()

    try:
        config = Config(str(BACKEND_ROOT / "alembic.ini"))
        command.upgrade(config, "20260705_0003")

        engine = create_engine(database_url)
        try:
            with engine.begin() as connection:
                connection.execute(text("DELETE FROM alembic_version"))
        finally:
            engine.dispose()

        run_migrations(BACKEND_ROOT / "alembic.ini", "head")

        engine = create_engine(database_url)
        try:
            inspector = inspect(engine)
            assert {"ai_providers", "ai_plan_drafts"}.issubset(set(inspector.get_table_names()))
            with engine.connect() as connection:
                version = connection.execute(text("SELECT version_num FROM alembic_version")).scalar_one()
            assert version == "20260705_0004"
        finally:
            engine.dispose()
    finally:
        get_settings.cache_clear()

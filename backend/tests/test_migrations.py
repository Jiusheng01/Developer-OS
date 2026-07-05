from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect

from app.core.config import get_settings


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
            }.issubset(set(inspector.get_table_names()))
        finally:
            engine.dispose()
    finally:
        get_settings.cache_clear()

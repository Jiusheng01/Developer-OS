from collections.abc import Generator
from pathlib import Path
import sys

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.api.deps import get_db_session  # noqa: E402
from app.core.config import get_settings  # noqa: E402
from app.infrastructure.database.base import Base  # noqa: E402
from app.infrastructure.database import models  # noqa: F401,E402
from app.main import create_app  # noqa: E402


@pytest.fixture(autouse=True)
def clear_settings_cache() -> Generator[None, None, None]:
    get_settings.cache_clear()
    try:
        yield
    finally:
        get_settings.cache_clear()


@pytest.fixture
def client(tmp_path: Path) -> Generator[TestClient, None, None]:
    engine = create_engine(
        f"sqlite:///{tmp_path / 'test.db'}",
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_db_session() -> Generator[Session, None, None]:
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app = create_app(init_db_on_startup=False)
    app.dependency_overrides[get_db_session] = override_db_session

    with TestClient(app) as test_client:
        yield test_client

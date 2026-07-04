from collections.abc import Generator

from fastapi import Depends
from sqlalchemy.orm import Session

from app.domain.dashboard.services import DashboardService
from app.infrastructure.database.session import get_db_session
from app.infrastructure.repositories.sqlalchemy_dashboard_repository import SQLAlchemyDashboardRepository


def get_dashboard_service(
    session: Session = Depends(get_db_session),
) -> DashboardService:
    repository = SQLAlchemyDashboardRepository(session)
    return DashboardService(repository, repository, repository, repository)
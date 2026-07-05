from collections.abc import Generator

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import AuthenticationError
from app.domain.auth.entities import User
from app.domain.auth.services import AuthService
from app.domain.ai.services import AIPlannerService, AIProviderService
from app.domain.dashboard.services import DashboardService
from app.infrastructure.ai.openai_compatible import OpenAICompatibleProviderFactory
from app.infrastructure.database.session import get_db_session
from app.infrastructure.database.unit_of_work import SQLAlchemyUnitOfWork
from app.infrastructure.repositories.sqlalchemy_ai_repository import SQLAlchemyAIRepository
from app.infrastructure.repositories.sqlalchemy_auth_repository import SQLAlchemyAuthRepository
from app.infrastructure.repositories.sqlalchemy_dashboard_repository import SQLAlchemyDashboardRepository

bearer_scheme = HTTPBearer(auto_error=False)


def get_dashboard_service(
    session: Session = Depends(get_db_session),
) -> DashboardService:
    repository = SQLAlchemyDashboardRepository(session)
    return DashboardService(repository, repository, repository, repository)


def get_auth_service(
    session: Session = Depends(get_db_session),
) -> AuthService:
    repository = SQLAlchemyAuthRepository(session)
    return AuthService(repository, get_settings())


def get_ai_provider_service(
    session: Session = Depends(get_db_session),
) -> AIProviderService:
    repository = SQLAlchemyAIRepository(session)
    return AIProviderService(repository, OpenAICompatibleProviderFactory())


def get_ai_planner_service(
    session: Session = Depends(get_db_session),
) -> AIPlannerService:
    ai_repository = SQLAlchemyAIRepository(session, auto_commit=False)
    dashboard_repository = SQLAlchemyDashboardRepository(session, auto_commit=False)
    dashboard_service = DashboardService(
        dashboard_repository,
        dashboard_repository,
        dashboard_repository,
        dashboard_repository,
    )
    return AIPlannerService(
        ai_repository,
        OpenAICompatibleProviderFactory(),
        dashboard_service,
        SQLAlchemyUnitOfWork(session),
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    service: AuthService = Depends(get_auth_service),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise AuthenticationError()
    return service.get_user_from_token(credentials.credentials)

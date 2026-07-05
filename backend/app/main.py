from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.errors import (
    AuthenticationError,
    ConflictError,
    PermissionDeniedError,
    ResourceNotFoundError,
    ValidationError,
)
from app.core.logging import configure_logging
from app.infrastructure.database.session import init_database


def create_lifespan(init_db_on_startup: bool) -> object:
    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        configure_logging()
        if init_db_on_startup:
            init_database()
        yield

    return lifespan


def create_app(init_db_on_startup: bool = True) -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        lifespan=create_lifespan(init_db_on_startup),
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(ValidationError)
    async def validation_error_handler(_: Request, exc: ValidationError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"detail": exc.message})

    @app.exception_handler(ResourceNotFoundError)
    async def not_found_handler(_: Request, exc: ResourceNotFoundError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"detail": {"resource": exc.resource, "id": exc.resource_id}},
        )

    @app.exception_handler(AuthenticationError)
    async def authentication_error_handler(_: Request, exc: AuthenticationError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": exc.message},
            headers={"WWW-Authenticate": "Bearer"},
        )

    @app.exception_handler(ConflictError)
    async def conflict_error_handler(_: Request, exc: ConflictError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_409_CONFLICT, content={"detail": exc.message})

    @app.exception_handler(PermissionDeniedError)
    async def permission_denied_handler(_: Request, exc: PermissionDeniedError) -> JSONResponse:
        return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content={"detail": exc.message})

    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


app = create_app()

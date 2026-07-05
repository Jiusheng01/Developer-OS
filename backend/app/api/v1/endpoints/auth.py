from fastapi import APIRouter, Depends, status

from app.api.deps import get_auth_service, get_current_user
from app.domain.auth.entities import User
from app.domain.auth.services import AuthService
from app.schemas.auth import AuthTokenRead, RegistrationStatusRead, UserLogin, UserRead, UserRegister

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/registration-status", response_model=RegistrationStatusRead)
def registration_status(service: AuthService = Depends(get_auth_service)) -> RegistrationStatusRead:
    return RegistrationStatusRead(public_registration_enabled=service.registration_status())


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, service: AuthService = Depends(get_auth_service)) -> UserRead:
    user = service.register(payload.model_dump(by_alias=False, exclude_unset=True))
    return UserRead.from_entity(user)


@router.post("/login", response_model=AuthTokenRead)
def login(payload: UserLogin, service: AuthService = Depends(get_auth_service)) -> AuthTokenRead:
    token = service.login(payload.model_dump(exclude_unset=True))
    return AuthTokenRead.from_entity(token)


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.from_entity(current_user)

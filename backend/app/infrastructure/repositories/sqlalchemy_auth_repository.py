from sqlalchemy import select
from sqlalchemy.orm import Session

from app.domain.auth.entities import User
from app.infrastructure.database.models import UserModel


class SQLAlchemyAuthRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def create_user(self, user: User) -> User:
        model = UserModel(
            id=user.id,
            email=user.email,
            username=user.username,
            display_name=user.display_name,
            password_hash=user.password_hash,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )
        self._session.add(model)
        self._session.commit()
        self._session.refresh(model)
        return self._user_from_model(model)

    def get_user_by_id(self, user_id: str) -> User | None:
        model = self._session.get(UserModel, user_id)
        return self._user_from_model(model) if model is not None else None

    def get_user_by_email(self, email: str) -> User | None:
        model = self._session.scalar(select(UserModel).where(UserModel.email == email))
        return self._user_from_model(model) if model is not None else None

    def get_user_by_username(self, username: str) -> User | None:
        model = self._session.scalar(select(UserModel).where(UserModel.username == username))
        return self._user_from_model(model) if model is not None else None

    @staticmethod
    def _user_from_model(model: UserModel) -> User:
        return User(
            id=model.id,
            email=model.email,
            username=model.username,
            display_name=model.display_name,
            password_hash=model.password_hash,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

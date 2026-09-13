from typing import List, Optional
from sqlalchemy.orm import Session

from backend.app.core.security import hash_password
from backend.app.core.exceptions import NotFoundError, InvalidInputError
from backend.app.models.user import User
from backend.app.models.audit_log import AuditLog
from backend.app.schemas.user import UserUpdate

class UserService:
    @staticmethod
    def get_by_id(db: Session, user_id: str) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundError("User not found")
        return user

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def update(db: Session, target_user_id: str, update_data: UserUpdate, actor_user: User) -> User:
        user = UserService.get_by_id(db, target_user_id)

        if update_data.email and update_data.email.lower() != user.email:
            existing = db.query(User).filter(User.email == update_data.email.lower()).first()
            if existing:
                raise InvalidInputError("Email is already in use by another user")
            user.email = update_data.email.lower()

        if update_data.username and update_data.username != user.username:
            existing = db.query(User).filter(User.username == update_data.username).first()
            if existing:
                raise InvalidInputError("Username is already taken")
            user.username = update_data.username

        if update_data.role is not None:
            user.role = update_data.role.upper()

        if update_data.is_active is not None:
            user.is_active = update_data.is_active

        if update_data.password:
            user.password_hash = hash_password(update_data.password)

        audit = AuditLog(
            user_id=actor_user.id,
            action="USER_UPDATE",
            resource_type="user",
            resource_id=user.id,
            details={"updated_fields": list(update_data.model_dump(exclude_unset=True).keys())}
        )
        db.add(audit)
        db.commit()
        db.refresh(user)
        return user

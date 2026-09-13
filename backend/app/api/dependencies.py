from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import decode_token, UserRole
from backend.app.core.exceptions import AuthenticationError, PermissionDeniedError
from backend.app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login",
    auto_error=False
)

def get_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> User:
    """Validate bearer token and return authenticated User."""
    if not token:
        raise AuthenticationError("Authentication credentials were not provided")

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise AuthenticationError("Invalid or expired authentication token")

    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Malformed authentication token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise AuthenticationError("User associated with token not found")

    if not user.is_active:
        raise AuthenticationError("User account has been deactivated")

    return user

def get_optional_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[User]:
    """Retrieve user if token provided, otherwise return None."""
    if not token:
        return None
    try:
        return get_current_user(db=db, token=token)
    except AuthenticationError:
        return None

class RequireRoles:
    """Dependency for Role-Based Access Control (RBAC)."""
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.role == UserRole.ADMIN.value:
            return user  # Admin always passes
        if user.role not in self.allowed_roles:
            raise PermissionDeniedError(
                f"Role '{user.role}' does not have sufficient permissions. Required: {', '.join(self.allowed_roles)}"
            )
        return user

# Helper role dependencies
require_admin = RequireRoles([UserRole.ADMIN.value])
require_operator = RequireRoles([UserRole.ADMIN.value, UserRole.OPERATOR.value])
require_viewer = RequireRoles([UserRole.ADMIN.value, UserRole.OPERATOR.value, UserRole.VIEWER.value])

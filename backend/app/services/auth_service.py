from datetime import datetime, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session

from backend.app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    hash_token_string,
    decode_token,
    UserRole
)
from backend.app.core.config import settings
from backend.app.core.exceptions import (
    AuthenticationError,
    InvalidInputError,
    NotFoundError
)
from backend.app.models.user import User
from backend.app.models.refresh_token import RefreshToken
from backend.app.models.audit_log import AuditLog
from backend.app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse

class AuthService:
    @staticmethod
    def register(db: Session, request: RegisterRequest, ip_address: Optional[str] = None) -> User:
        """Register a new user account."""
        # Check existing email
        if db.query(User).filter(User.email == request.email.lower()).first():
            raise InvalidInputError("An account with this email address already exists")

        # Check existing username
        if db.query(User).filter(User.username == request.username).first():
            raise InvalidInputError("This username is already taken")

        # Role assignment safety: default to VIEWER unless specified as OPERATOR
        assigned_role = UserRole.VIEWER.value
        if request.role and request.role.upper() in [UserRole.OPERATOR.value, UserRole.VIEWER.value]:
            assigned_role = request.role.upper()

        # If it's the very first user in the entire database, automatically promote to ADMIN
        total_users = db.query(User).count()
        if total_users == 0:
            assigned_role = UserRole.ADMIN.value

        user = User(
            email=request.email.lower(),
            username=request.username,
            password_hash=hash_password(request.password),
            role=assigned_role,
            is_active=True
        )
        db.add(user)
        db.flush()

        # Audit log
        audit = AuditLog(
            user_id=user.id,
            action="USER_REGISTER",
            resource_type="user",
            resource_id=user.id,
            ip_address=ip_address,
            details={"email": user.email, "role": user.role}
        )
        db.add(audit)
        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def login(db: Session, request: LoginRequest, ip_address: Optional[str] = None) -> TokenResponse:
        """Authenticate user and issue token pair."""
        user = db.query(User).filter(User.email == request.email.lower()).first()
        if not user or not verify_password(request.password, user.password_hash):
            raise AuthenticationError("Invalid email or password")

        if not user.is_active:
            raise AuthenticationError("This account is currently deactivated")

        # Generate tokens
        access_token = create_access_token(subject=user.id, role=user.role)
        raw_refresh, refresh_hash, refresh_expires_at = create_refresh_token(subject=user.id)

        # Store refresh token record
        db_refresh = RefreshToken(
            user_id=user.id,
            token_hash=refresh_hash,
            expires_at=refresh_expires_at,
            is_revoked=False
        )
        db.add(db_refresh)

        # Audit log
        audit = AuditLog(
            user_id=user.id,
            action="USER_LOGIN",
            resource_type="auth",
            resource_id=user.id,
            ip_address=ip_address,
            details={"email": user.email}
        )
        db.add(audit)
        db.commit()

        return TokenResponse(
            access_token=access_token,
            refresh_token=raw_refresh,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user={
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "role": user.role
            }
        )

    @staticmethod
    def refresh_access_token(db: Session, raw_refresh_token: str) -> Tuple[str, str]:
        """Validate refresh token and issue a fresh access token (and rotating refresh token)."""
        payload = decode_token(raw_refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise AuthenticationError("Invalid refresh token")

        user_id = payload.get("sub")
        token_hash = hash_token_string(raw_refresh_token)

        db_token = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
        if not db_token:
            raise AuthenticationError("Refresh token not recognized")

        if db_token.is_revoked:
            raise AuthenticationError("Refresh token has been revoked")

        if db_token.expires_at < datetime.now(timezone.utc):
            raise AuthenticationError("Refresh token has expired")

        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise AuthenticationError("User is invalid or inactive")

        # Revoke old refresh token for rotation
        db_token.is_revoked = True

        # Generate new token pair
        new_access_token = create_access_token(subject=user.id, role=user.role)
        new_raw_refresh, new_refresh_hash, new_refresh_expires = create_refresh_token(subject=user.id)

        new_db_refresh = RefreshToken(
            user_id=user.id,
            token_hash=new_refresh_hash,
            expires_at=new_refresh_expires,
            is_revoked=False
        )
        db.add(new_db_refresh)
        db.commit()

        return new_access_token, new_raw_refresh

    @staticmethod
    def logout(db: Session, user: User, raw_refresh_token: Optional[str] = None, ip_address: Optional[str] = None):
        """Revoke active refresh token on logout."""
        if raw_refresh_token:
            token_hash = hash_token_string(raw_refresh_token)
            db_token = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
            if db_token:
                db_token.is_revoked = True

        audit = AuditLog(
            user_id=user.id,
            action="USER_LOGOUT",
            resource_type="auth",
            resource_id=user.id,
            ip_address=ip_address,
            details={"email": user.email}
        )
        db.add(audit)
        db.commit()

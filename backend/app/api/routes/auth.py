from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.api.dependencies import get_current_user
from backend.app.models.user import User
from backend.app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    LogoutRequest
)
from backend.app.schemas.user import UserResponse
from backend.app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, req: Request, db: Session = Depends(get_db)):
    """Register a new user account."""
    ip_address = req.client.host if req.client else None
    user = AuthService.register(db=db, request=request, ip_address=ip_address)
    return {
        "success": True,
        "data": UserResponse.model_validate(user),
        "error": None
    }

@router.post("/login")
def login(request: LoginRequest, req: Request, db: Session = Depends(get_db)):
    """Authenticate and receive access + refresh token pair."""
    ip_address = req.client.host if req.client else None
    token_response = AuthService.login(db=db, request=request, ip_address=ip_address)
    return {
        "success": True,
        "data": token_response,
        "error": None
    }

@router.post("/refresh")
def refresh_token(request: RefreshRequest, db: Session = Depends(get_db)):
    """Refresh access token using valid refresh token."""
    new_access, new_refresh = AuthService.refresh_access_token(
        db=db,
        raw_refresh_token=request.refresh_token
    )
    return {
        "success": True,
        "data": {
            "access_token": new_access,
            "refresh_token": new_refresh,
            "token_type": "bearer"
        },
        "error": None
    }

@router.post("/logout")
def logout(
    request: LogoutRequest,
    req: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout current user session and revoke refresh token."""
    ip_address = req.client.host if req.client else None
    AuthService.logout(
        db=db,
        user=current_user,
        raw_refresh_token=request.refresh_token,
        ip_address=ip_address
    )
    return {
        "success": True,
        "data": {"message": "Logged out successfully"},
        "error": None
    }

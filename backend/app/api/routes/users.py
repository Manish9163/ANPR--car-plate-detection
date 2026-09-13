from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.api.dependencies import get_current_user, require_admin
from backend.app.models.user import User
from backend.app.schemas.user import UserResponse, UserUpdate
from backend.app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me")
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Get authenticated user profile."""
    return {
        "success": True,
        "data": UserResponse.model_validate(current_user),
        "error": None
    }

@router.get("")
def list_users(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin only: list all platform users."""
    users = UserService.get_all(db=db, skip=skip, limit=limit)
    return {
        "success": True,
        "data": [UserResponse.model_validate(u) for u in users],
        "meta": {"skip": skip, "limit": limit, "count": len(users)},
        "error": None
    }

@router.patch("/{user_id}")
def update_user(
    user_id: str,
    update_data: UserUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin only: update user role, status or details."""
    updated = UserService.update(
        db=db,
        target_user_id=user_id,
        update_data=update_data,
        actor_user=current_user
    )
    return {
        "success": True,
        "data": UserResponse.model_validate(updated),
        "error": None
    }

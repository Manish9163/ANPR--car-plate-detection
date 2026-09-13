"""
PlateVision — Analytics API Routes

Provides aggregated metrics and insights on platform performance,
throughput, recognition accuracy, and state distribution.
"""

from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.api.dependencies import get_optional_user
from backend.app.models.user import User
from backend.app.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview", response_model=Dict[str, Any])
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Get high-level overview metrics: total scans, success rates,
    7-day daily trends, Indian state distribution, and average CV/OCR performance.
    """
    overview = analytics_service.get_overview(db)
    return {
        "success": True,
        "data": overview.model_dump(),
    }

"""
PlateVision — Recognition History API Routes

Endpoints for viewing, searching, paginating, and exporting
historical number plate recognitions.
"""

from typing import Any, Dict, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.api.dependencies import get_current_user, require_admin, get_optional_user
from backend.app.models.user import User
from backend.app.services.recognition_service import recognition_service
from backend.app.schemas.recognition import PaginatedRecognitionResponse, RecognitionResponse

router = APIRouter(prefix="/recognitions", tags=["Recognitions"])


@router.get("", response_model=Dict[str, Any])
def list_recognitions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    List historical plate recognitions with filtering and pagination.
    """
    items, total = recognition_service.list_recognitions(
        db=db,
        page=page,
        per_page=per_page,
        status=status,
        search=search,
        start_date=start_date,
        end_date=end_date,
    )

    return {
        "success": True,
        "data": [item.model_dump() for item in items],
        "meta": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page if per_page > 0 else 1,
        },
    }


@router.get("/export/csv")
def export_recognitions_csv(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Export recognition records as a downloadable CSV spreadsheet.
    """
    csv_data = recognition_service.export_csv(db=db, status=status, search=search)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"platevision_recognitions_{timestamp}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/{recognition_id}", response_model=Dict[str, Any])
def get_recognition_detail(
    recognition_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Get full recognition details including all intermediate CV stages.
    """
    rec: RecognitionResponse = recognition_service.get_recognition_by_id(
        db=db, recognition_id=recognition_id
    )
    return {
        "success": True,
        "data": rec.model_dump(),
    }


@router.delete("/{recognition_id}", response_model=Dict[str, Any])
def delete_recognition(
    recognition_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """
    Delete a recognition record and associated image artifacts (Admin only).
    """
    client_ip = request.client.host if request.client else None
    recognition_service.delete_recognition(
        db=db,
        recognition_id=recognition_id,
        user_id=current_user.id,
        client_ip=client_ip,
    )
    return {
        "success": True,
        "message": f"Recognition {recognition_id} deleted successfully",
    }

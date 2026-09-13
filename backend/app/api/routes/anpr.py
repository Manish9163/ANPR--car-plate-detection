"""
PlateVision — ANPR API Routes

Endpoints for vehicle license plate recognition:
  - POST /api/anpr/image: Process single uploaded image
  - POST /api/anpr/webcam-frame: Process webcam stream frame
  - POST /api/anpr/video: Process uploaded video file
"""

import base64
import os
import tempfile
from typing import Any, Dict, List, Optional
import cv2
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.config import settings
from backend.app.core.exceptions import ValidationException
from backend.app.api.dependencies import get_optional_user
from backend.app.models.user import User
from backend.app.services.anpr_service import anpr_service
from backend.app.schemas.recognition import RecognitionResponse

router = APIRouter(prefix="/anpr", tags=["ANPR"])


class WebcamFrameRequest(BaseModel):
    image_base64: str
    source: str = "WEBCAM"


def _validate_image_file(file: UploadFile) -> None:
    """Validate image file extension and MIME type."""
    ext = os.path.splitext(file.filename or "")[1].lower()
    allowed_exts = [".jpg", ".jpeg", ".png", ".webp"]
    if ext not in allowed_exts:
        raise ValidationException(
            f"Unsupported file format '{ext}'. Allowed extensions: {', '.join(allowed_exts)}"
        )


@router.post("/image", response_model=Dict[str, Any])
async def recognize_image(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Process a single vehicle image through the full ANPR pipeline.
    Returns detected plate number, confidence scores, validation details,
    and all intermediate CV pipeline stages for visualization.
    """
    _validate_image_file(file)

    raw_bytes = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(raw_bytes) > max_bytes:
        raise ValidationException(
            f"File size exceeds maximum limit of {settings.MAX_UPLOAD_SIZE_MB}MB"
        )

    client_ip = request.client.host if request.client else None
    user_id = current_user.id if current_user else None

    result: RecognitionResponse = anpr_service.process_image(
        db=db,
        raw_bytes=raw_bytes,
        filename=file.filename or "upload.jpg",
        source_type="IMAGE",
        user_id=user_id,
        client_ip=client_ip,
    )

    return {
        "success": True,
        "data": result.model_dump(),
    }


@router.post("/webcam-frame", response_model=Dict[str, Any])
async def recognize_webcam_frame(
    request: Request,
    payload: WebcamFrameRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Process a single frame from the live browser webcam feed.
    Accepts a base64 encoded data URI.
    """
    b64_str = payload.image_base64
    if "," in b64_str:
        b64_str = b64_str.split(",", 1)[1]

    try:
        raw_bytes = base64.b64decode(b64_str)
    except Exception as e:
        raise ValidationException(f"Invalid base64 image data: {e}")

    client_ip = request.client.host if request.client else None
    user_id = current_user.id if current_user else None

    result: RecognitionResponse = anpr_service.process_image(
        db=db,
        raw_bytes=raw_bytes,
        filename="webcam_frame.jpg",
        source_type="WEBCAM",
        user_id=user_id,
        client_ip=client_ip,
    )

    return {
        "success": True,
        "data": result.model_dump(),
    }


@router.post("/video", response_model=Dict[str, Any])
async def recognize_video(
    request: Request,
    file: UploadFile = File(...),
    frame_sample_rate: int = Form(10),  # sample every 10th frame
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Process an uploaded vehicle video file.
    Samples frames periodically, runs ANPR on frames with vehicle/plate detections,
    and returns list of recognized plates.
    """
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in [".mp4", ".avi", ".mov", ".mkv"]:
        raise ValidationException(f"Unsupported video format '{ext}'. Allowed: .mp4, .avi, .mov, .mkv")

    client_ip = request.client.host if request.client else None
    user_id = current_user.id if current_user else None

    # Write video to temporary file for OpenCV VideoCapture
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as temp_video:
        content = await file.read()
        temp_video.write(content)
        temp_path = temp_video.name

    try:
        cap = cv2.VideoCapture(temp_path)
        if not cap.isOpened():
            raise ValidationException("Failed to open video file")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

        recognitions: List[Dict[str, Any]] = []
        seen_plates = set()

        frame_idx = 0
        sample_step = max(1, frame_sample_rate)

        while cap.isOpened() and frame_idx < 1000:  # Safety cap at 1000 frames
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % sample_step == 0:
                success, encoded_frame = cv2.imencode(".jpg", frame)
                if success:
                    frame_bytes = encoded_frame.tobytes()
                    res = anpr_service.process_image(
                        db=db,
                        raw_bytes=frame_bytes,
                        filename=f"video_f{frame_idx}.jpg",
                        source_type="VIDEO",
                        user_id=user_id,
                        client_ip=client_ip,
                    )

                    plate = res.plate_text_normalized
                    if plate and plate not in seen_plates and res.processing_status == "SUCCESS":
                        seen_plates.add(plate)
                        rec_dict = res.model_dump()
                        rec_dict["timestamp_seconds"] = round(frame_idx / fps, 2)
                        recognitions.append(rec_dict)

            frame_idx += 1

        cap.release()

        return {
            "success": True,
            "data": {
                "total_frames_analyzed": frame_idx,
                "video_duration_seconds": round(frame_idx / fps, 2),
                "unique_plates_detected": len(seen_plates),
                "recognitions": recognitions,
            },
        }

    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

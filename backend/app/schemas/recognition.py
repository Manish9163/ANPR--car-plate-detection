from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    xmin: int
    ymin: int
    xmax: int
    ymax: int
    confidence: float

class ValidationResult(BaseModel):
    is_valid: bool
    state_code: Optional[str] = None
    state_name: Optional[str] = None
    rto_code: Optional[str] = None
    series: Optional[str] = None
    vehicle_number: Optional[str] = None
    format_type: Optional[str] = None
    validation_notes: List[str] = []

class PipelineStageInfo(BaseModel):
    id: str
    title: str
    stage_number: int
    description: str
    algorithm: str
    parameters: Dict[str, Any] = {}
    metrics: Dict[str, Any] = {}
    image_url: Optional[str] = None
    base64_preview: Optional[str] = None

class RecognitionResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    plate_text_raw: Optional[str] = None
    plate_text_normalized: Optional[str] = None
    overall_confidence: float = 0.0
    detector_confidence: float = 0.0
    ocr_confidence: float = 0.0
    processing_status: str
    processing_duration_ms: float
    source_type: str
    original_filename: Optional[str] = None
    original_image_url: Optional[str] = None
    plate_crop_url: Optional[str] = None
    enhanced_plate_url: Optional[str] = None
    pipeline_stages: List[PipelineStageInfo] = []
    validation: Optional[ValidationResult] = None
    bounding_box: Optional[BoundingBox] = None
    extra_metadata: Dict[str, Any] = {}
    created_at: datetime

    class Config:
        from_attributes = True

class RecognitionListItem(BaseModel):
    id: str
    plate_text_raw: Optional[str] = None
    plate_text_normalized: Optional[str] = None
    overall_confidence: float
    processing_status: str
    processing_duration_ms: float
    source_type: str
    original_filename: Optional[str] = None
    original_image_url: Optional[str] = None
    plate_crop_url: Optional[str] = None
    state_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PaginatedRecognitionResponse(BaseModel):
    success: bool = True
    data: List[RecognitionListItem]
    meta: Dict[str, Any]

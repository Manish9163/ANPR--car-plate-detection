import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from backend.app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Recognition(Base):
    __tablename__ = "recognitions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    # Text results
    plate_text_raw = Column(String(50), nullable=True)
    plate_text_normalized = Column(String(50), nullable=True, index=True)
    
    # Confidence metrics
    overall_confidence = Column(Float, default=0.0)
    detector_confidence = Column(Float, default=0.0)
    ocr_confidence = Column(Float, default=0.0)
    
    # Status & performance
    processing_status = Column(String(50), default="SUCCESS", index=True) # SUCCESS, NO_PLATE, LOW_CONFIDENCE, OCR_FAILED, INVALID_FORMAT, PROCESSING_ERROR
    processing_duration_ms = Column(Float, default=0.0)
    source_type = Column(String(50), default="IMAGE") # IMAGE, VIDEO, WEBCAM
    
    # Artifact file paths
    original_filename = Column(String(255), nullable=True)
    original_image_path = Column(String(500), nullable=True)
    plate_crop_path = Column(String(500), nullable=True)
    enhanced_plate_path = Column(String(500), nullable=True)
    
    # Structured pipeline visualizer data & vehicle metadata
    pipeline_images = Column(JSON, default=dict)
    extra_metadata = Column(JSON, default=dict)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True, nullable=False)

    user = relationship("User", back_populates="recognitions")

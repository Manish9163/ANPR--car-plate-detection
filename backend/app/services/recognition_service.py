"""
PlateVision — Recognition History Service

Handles querying, filtering, pagination, deletion, and CSV export
of vehicle plate recognition records.
"""

import io
import csv
import logging
from typing import Any, Dict, List, Optional, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from backend.app.models.recognition import Recognition
from backend.app.models.audit_log import AuditLog
from backend.app.schemas.recognition import (
    RecognitionResponse,
    RecognitionListItem,
    PipelineStageInfo,
    ValidationResult,
    BoundingBox,
)
from backend.app.storage.file_storage import storage_manager
from backend.app.core.exceptions import NotFoundException

logger = logging.getLogger("platevision.recognition_service")


class RecognitionService:
    """Service for managing historical plate recognition records."""

    def list_recognitions(
        self,
        db: Session,
        page: int = 1,
        per_page: int = 20,
        status: Optional[str] = None,
        search: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> Tuple[List[RecognitionListItem], int]:
        """
        Queries recognitions with search, filtering, and pagination.
        Returns: (items, total_count)
        """
        query = db.query(Recognition)

        if status and status.upper() != "ALL":
            query = query.filter(Recognition.processing_status == status.upper())

        if search:
            search_clean = f"%{search.strip().upper()}%"
            query = query.filter(
                or_(
                    Recognition.plate_text_normalized.ilike(search_clean),
                    Recognition.plate_text_raw.ilike(search_clean),
                    Recognition.original_filename.ilike(search_clean),
                )
            )

        if start_date:
            query = query.filter(Recognition.created_at >= start_date)
        if end_date:
            query = query.filter(Recognition.created_at <= end_date)

        total_count = query.count()

        offset = (page - 1) * per_page
        records = (
            query.order_by(desc(Recognition.created_at))
            .offset(offset)
            .limit(per_page)
            .all()
        )

        items: List[RecognitionListItem] = []
        for r in records:
            state_name = None
            if r.extra_metadata and "validation" in r.extra_metadata:
                val = r.extra_metadata.get("validation")
                if isinstance(val, dict):
                    state_name = val.get("state_name")

            items.append(
                RecognitionListItem(
                    id=r.id,
                    plate_text_raw=r.plate_text_raw,
                    plate_text_normalized=r.plate_text_normalized,
                    overall_confidence=round(r.overall_confidence or 0.0, 4),
                    processing_status=r.processing_status,
                    processing_duration_ms=round(r.processing_duration_ms or 0.0, 2),
                    source_type=r.source_type,
                    original_filename=r.original_filename,
                    original_image_url=r.original_image_path,
                    plate_crop_url=r.plate_crop_path,
                    state_name=state_name,
                    created_at=r.created_at,
                )
            )

        return items, total_count

    def get_recognition_by_id(self, db: Session, recognition_id: str) -> RecognitionResponse:
        """Fetches full recognition details including all pipeline stages."""
        rec = db.query(Recognition).filter(Recognition.id == recognition_id).first()
        if not rec:
            raise NotFoundException(f"Recognition with ID {recognition_id} not found")

        # Parse pipeline stages from JSON
        stages_data = []
        if rec.pipeline_images and "stages" in rec.pipeline_images:
            for s in rec.pipeline_images["stages"]:
                stages_data.append(
                    PipelineStageInfo(
                        id=s.get("id", ""),
                        title=s.get("title", ""),
                        stage_number=s.get("stage_number", 0),
                        description=s.get("description", ""),
                        algorithm=s.get("algorithm", ""),
                        parameters=s.get("parameters", {}),
                        metrics=s.get("metrics", {}),
                        image_url=s.get("image_url"),
                        base64_preview=s.get("base64_preview"),
                    )
                )

        val_obj = None
        bbox_obj = None
        if rec.extra_metadata:
            val_data = rec.extra_metadata.get("validation")
            if val_data and isinstance(val_data, dict):
                val_obj = ValidationResult(**val_data)

            bbox_data = rec.extra_metadata.get("bounding_box")
            if bbox_data and isinstance(bbox_data, dict):
                bbox_obj = BoundingBox(**bbox_data)

        return RecognitionResponse(
            id=rec.id,
            user_id=rec.user_id,
            plate_text_raw=rec.plate_text_raw,
            plate_text_normalized=rec.plate_text_normalized,
            overall_confidence=rec.overall_confidence,
            detector_confidence=rec.detector_confidence,
            ocr_confidence=rec.ocr_confidence,
            processing_status=rec.processing_status,
            processing_duration_ms=rec.processing_duration_ms,
            source_type=rec.source_type,
            original_filename=rec.original_filename,
            original_image_url=rec.original_image_path,
            plate_crop_url=rec.plate_crop_path,
            enhanced_plate_url=rec.enhanced_plate_path,
            pipeline_stages=stages_data,
            validation=val_obj,
            bounding_box=bbox_obj,
            extra_metadata=rec.extra_metadata or {},
            created_at=rec.created_at,
        )

    def delete_recognition(
        self,
        db: Session,
        recognition_id: str,
        user_id: Optional[str] = None,
        client_ip: Optional[str] = None,
    ) -> bool:
        """Deletes a recognition and cleans up its stored image files."""
        rec = db.query(Recognition).filter(Recognition.id == recognition_id).first()
        if not rec:
            raise NotFoundException(f"Recognition with ID {recognition_id} not found")

        # Delete image files on disk
        storage_manager.delete_recognition_files(
            original_path=rec.original_image_path,
            crop_path=rec.plate_crop_path,
            enhanced_path=rec.enhanced_plate_path,
        )

        db.delete(rec)

        # Audit log
        audit = AuditLog(
            user_id=user_id,
            action="DELETE_RECOGNITION",
            resource_type="recognition",
            resource_id=recognition_id,
            ip_address=client_ip,
            details={"plate": rec.plate_text_normalized},
        )
        db.add(audit)
        db.commit()
        return True

    def export_csv(
        self,
        db: Session,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> str:
        """Exports recognition records as CSV string."""
        query = db.query(Recognition)

        if status and status.upper() != "ALL":
            query = query.filter(Recognition.processing_status == status.upper())

        if search:
            search_clean = f"%{search.strip().upper()}%"
            query = query.filter(
                or_(
                    Recognition.plate_text_normalized.ilike(search_clean),
                    Recognition.plate_text_raw.ilike(search_clean),
                )
            )

        records = query.order_by(desc(Recognition.created_at)).all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Recognition ID",
            "Plate Text (Normalized)",
            "Plate Text (Raw)",
            "State",
            "Status",
            "Confidence",
            "Processing Time (ms)",
            "Source",
            "Timestamp",
        ])

        for r in records:
            state_name = ""
            if r.extra_metadata and "validation" in r.extra_metadata:
                val = r.extra_metadata.get("validation")
                if isinstance(val, dict):
                    state_name = val.get("state_name", "")

            writer.writerow([
                r.id,
                r.plate_text_normalized or "N/A",
                r.plate_text_raw or "N/A",
                state_name,
                r.processing_status,
                f"{(r.overall_confidence or 0.0) * 100:.1f}%",
                f"{r.processing_duration_ms or 0.0:.1f}",
                r.source_type,
                r.created_at.strftime("%Y-%m-%d %H:%M:%S") if r.created_at else "",
            ])

        return output.getvalue()


recognition_service = RecognitionService()

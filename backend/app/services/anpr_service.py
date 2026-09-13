"""
PlateVision — ANPR Orchestration Service

Orchestrates the entire end-to-end Automated Number Plate Recognition workflow:
  1. Image ingestion & file storage
  2. Computer Vision Pipeline (Preprocessing -> YOLOv8 Detection -> Perspective -> Enhancement)
  3. Optical Character Recognition (EasyOCR / PP-OCR)
  4. OCR Post-Processing (Confusion Matrix resolution, syntax correction)
  5. Indian Vehicle Registration Number Validation
  6. Database persistence & Audit Logging
"""

import time
import logging
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.cv.pipeline import cv_pipeline
from backend.app.ocr.engine import OCREngine
from backend.app.ocr.postprocessor import PostProcessor
from backend.app.ocr.validator import validate_plate
from backend.app.storage.file_storage import storage_manager
from backend.app.models.recognition import Recognition
from backend.app.models.audit_log import AuditLog
from backend.app.schemas.recognition import (
    RecognitionResponse,
    PipelineStageInfo,
    ValidationResult,
    BoundingBox,
)

logger = logging.getLogger("platevision.anpr_service")


class ANPRService:
    """End-to-end ANPR orchestration service."""

    def __init__(self):
        self.ocr_engine = OCREngine()
        self.postprocessor = PostProcessor()

    def process_image(
        self,
        db: Session,
        raw_bytes: bytes,
        filename: str = "upload.jpg",
        source_type: str = "IMAGE",
        user_id: Optional[str] = None,
        client_ip: Optional[str] = None,
    ) -> RecognitionResponse:
        """
        Processes a vehicle image through the full ANPR pipeline and persists the result.
        """
        start_time = time.perf_counter()

        # 1. Save original image to disk
        orig_abs_path, orig_rel_url = storage_manager.save_original(raw_bytes, filename)

        # 2. Execute Computer Vision Pipeline
        cv_result = cv_pipeline.process(raw_bytes)

        # 3. OCR & Post-Processing
        raw_plate_text = None
        normalized_text = None
        ocr_confidence = 0.0
        validation_res = None
        status = "SUCCESS"

        if cv_result.plate_detected and cv_result.plate_crop is not None:
            t_ocr_start = time.perf_counter()
            
            # Run OCR on enhanced color crop
            raw_text, ocr_conf, ocr_stage = self.ocr_engine.read_plate(
                cv_result.plate_crop,
                stage_offset=len(cv_result.stages),
            )
            cv_result.timings_ms["ocr_ms"] = round((time.perf_counter() - t_ocr_start) * 1000, 2)

            if ocr_stage:
                cv_result.stages.append(ocr_stage)

            if raw_text:
                raw_plate_text = raw_text
                ocr_confidence = round(ocr_conf, 4)

                # Post-process text
                norm_str, resolved_str = self.postprocessor.process(raw_text)
                normalized_text = resolved_str or norm_str

                # Validate against Indian registration formats
                validation_res = validate_plate(normalized_text)

                # Calculate overall confidence
                overall_confidence = round(
                    (0.35 * cv_result.detector_confidence) + (0.65 * ocr_confidence), 4
                )

                # Determine status
                if not validation_res.is_valid:
                    status = "INVALID_FORMAT" if validation_res.format_type != "PARTIAL" else "LOW_CONFIDENCE"
                elif overall_confidence < 0.45:
                    status = "LOW_CONFIDENCE"
                else:
                    status = "SUCCESS"
            else:
                status = "OCR_FAILED"
                overall_confidence = round(cv_result.detector_confidence * 0.5, 4)
                validation_res = ValidationResult(
                    is_valid=False,
                    validation_notes=["Plate detected but OCR could not recognize legible characters."]
                )
        else:
            status = "NO_PLATE"
            overall_confidence = 0.0
            validation_res = ValidationResult(
                is_valid=False,
                validation_notes=["No license plate detected in image."]
            )

        # 4. Save crop and pipeline stages to storage
        _, crop_url, enh_url, stages_meta = cv_pipeline.persist_stages_and_get_metadata(cv_result)

        # 5. Measure total execution duration
        total_duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        cv_result.timings_ms["total_ms"] = total_duration_ms

        bbox_dict = None
        if cv_result.bounding_box and "bbox" in cv_result.bounding_box:
            b = cv_result.bounding_box["bbox"]
            bbox_dict = {
                "xmin": b[0],
                "ymin": b[1],
                "xmax": b[2],
                "ymax": b[3],
                "confidence": cv_result.detector_confidence,
            }

        # 6. Persist to Database
        rec = Recognition(
            user_id=user_id,
            plate_text_raw=raw_plate_text,
            plate_text_normalized=normalized_text,
            overall_confidence=overall_confidence,
            detector_confidence=cv_result.detector_confidence,
            ocr_confidence=ocr_confidence,
            processing_status=status,
            processing_duration_ms=total_duration_ms,
            source_type=source_type,
            original_filename=filename,
            original_image_path=orig_rel_url,
            plate_crop_path=crop_url,
            enhanced_plate_path=enh_url,
            pipeline_images={"stages": stages_meta},
            extra_metadata={
                "timings": cv_result.timings_ms,
                "bounding_box": bbox_dict,
                "validation": validation_res.model_dump() if validation_res else None,
            },
        )
        db.add(rec)

        # Add Audit Log
        audit = AuditLog(
            user_id=user_id,
            action="ANPR_PROCESS",
            resource_type="recognition",
            resource_id=rec.id,
            ip_address=client_ip,
            details={
                "status": status,
                "plate": normalized_text,
                "confidence": overall_confidence,
                "duration_ms": total_duration_ms,
                "source": source_type,
            },
        )
        db.add(audit)
        db.commit()
        db.refresh(rec)

        # 7. Convert stages metadata to Pydantic objects
        stage_infos = [
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
            for s in stages_meta
        ]

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
            pipeline_stages=stage_infos,
            validation=validation_res,
            bounding_box=BoundingBox(**bbox_dict) if bbox_dict else None,
            extra_metadata=rec.extra_metadata or {},
            created_at=rec.created_at,
        )


anpr_service = ANPRService()

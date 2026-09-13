"""
PlateVision — End-to-End Computer Vision Pipeline

Orchestrates all CV modules:
  1. Preprocessing (Validation, Resize, Noise Analysis, Denoising, Color Spaces, CLAHE)
  2. Plate Detection (YOLOv8 deep learning with contour fallback)
  3. Perspective Correction (4-point transform on skewed plates)
  4. Crop Enhancement (Plate-level CLAHE, Adaptive Binarization, Morphological Filtering, Edge Detection)
Records all intermediate stages for real-time visualization in the frontend.
"""

import time
import logging
from typing import Any, Dict, List, Optional, Tuple
import numpy as np

from backend.app.core.config import settings
from backend.app.cv.preprocessor import Preprocessor, PipelineStage
from backend.app.cv.detector import PlateDetector
from backend.app.cv.perspective import try_perspective_correction
from backend.app.cv.enhancer import PlateEnhancer
from backend.app.storage.file_storage import storage_manager

logger = logging.getLogger("platevision.pipeline")


class CVPipelineResult:
    """Encapsulates the complete output of the CV processing pipeline."""

    def __init__(
        self,
        original_image: np.ndarray,
        preprocessed_image: np.ndarray,
        plate_crop: Optional[np.ndarray],
        enhanced_crop: Optional[np.ndarray],
        bounding_box: Optional[Dict[str, Any]],
        stages: List[PipelineStage],
        timings_ms: Dict[str, float],
        detector_confidence: float = 0.0,
        plate_detected: bool = False,
    ):
        self.original_image = original_image
        self.preprocessed_image = preprocessed_image
        self.plate_crop = plate_crop
        self.enhanced_crop = enhanced_crop
        self.bounding_box = bounding_box
        self.stages = stages
        self.timings_ms = timings_ms
        self.detector_confidence = detector_confidence
        self.plate_detected = plate_detected


class CVPipeline:
    """Full Computer Vision orchestration pipeline."""

    def __init__(self):
        self.preprocessor = Preprocessor()
        self.detector = PlateDetector(
            confidence_threshold=settings.CONFIDENCE_THRESHOLD,
            iou_threshold=settings.IOU_THRESHOLD,
        )
        self.enhancer = PlateEnhancer()

    def process(self, raw_bytes: bytes) -> CVPipelineResult:
        """
        Executes the complete CV pipeline on raw image bytes.
        """
        timings: Dict[str, float] = {}
        all_stages: List[PipelineStage] = []

        # ── 1. Preprocessing ─────────────────────────────────────────────
        t0 = time.perf_counter()
        preprocessed_img, prep_stages = self.preprocessor.preprocess(raw_bytes)
        t_prep = (time.perf_counter() - t0) * 1000
        timings["preprocessing_ms"] = round(t_prep, 2)
        all_stages.extend(prep_stages)

        original_img = prep_stages[0].image if prep_stages else preprocessed_img

        # ── 2. Plate Detection ───────────────────────────────────────────
        t0 = time.perf_counter()
        plate_crop, det_info, det_stage = self.detector.detect(
            preprocessed_img,
            model_path=settings.YOLO_MODEL_PATH,
            stage_offset=len(all_stages),
        )
        t_det = (time.perf_counter() - t0) * 1000
        timings["detection_ms"] = round(t_det, 2)

        if det_stage:
            all_stages.append(det_stage)

        if plate_crop is None or plate_crop.size == 0:
            logger.warning("No license plate detected in image.")
            return CVPipelineResult(
                original_image=original_img,
                preprocessed_image=preprocessed_img,
                plate_crop=None,
                enhanced_crop=None,
                bounding_box=None,
                stages=all_stages,
                timings_ms=timings,
                detector_confidence=0.0,
                plate_detected=False,
            )

        det_conf = det_info.get("confidence", 0.0) if det_info else 0.0

        # ── 3. Perspective Correction ────────────────────────────────────
        t0 = time.perf_counter()
        rectified_crop, persp_stage = try_perspective_correction(
            plate_crop,
            skew_threshold=5.0,
            stage_offset=len(all_stages),
        )
        t_persp = (time.perf_counter() - t0) * 1000
        timings["perspective_correction_ms"] = round(t_persp, 2)

        if persp_stage:
            all_stages.append(persp_stage)

        # ── 4. Plate Enhancement ─────────────────────────────────────────
        t0 = time.perf_counter()
        enhanced_color, enhanced_binary, enh_stages = self.enhancer.enhance(
            rectified_crop,
            stage_offset=len(all_stages),
        )
        t_enh = (time.perf_counter() - t0) * 1000
        timings["enhancement_ms"] = round(t_enh, 2)
        all_stages.extend(enh_stages)

        return CVPipelineResult(
            original_image=original_img,
            preprocessed_image=preprocessed_img,
            plate_crop=rectified_crop,
            enhanced_crop=enhanced_color,
            bounding_box=det_info,
            stages=all_stages,
            timings_ms=timings,
            detector_confidence=det_conf,
            plate_detected=True,
        )

    def persist_stages_and_get_metadata(
        self,
        result: CVPipelineResult,
    ) -> Tuple[str, Optional[str], Optional[str], List[Dict[str, Any]]]:
        """
        Saves crops and pipeline images to disk and generates API URL metadata.
        Returns: (original_url, crop_url, enhanced_url, pipeline_stages_dicts)
        """
        # Save original
        _, orig_url = storage_manager.save_cv_image(
            result.original_image, category="crops", suffix="original"
        )

        crop_url = None
        enh_url = None

        if result.plate_crop is not None:
            _, crop_url = storage_manager.save_cv_image(
                result.plate_crop, category="crops", suffix="crop"
            )

        if result.enhanced_crop is not None:
            _, enh_url = storage_manager.save_cv_image(
                result.enhanced_crop, category="crops", suffix="enhanced"
            )

        stages_meta: List[Dict[str, Any]] = []
        for stage in result.stages:
            stage_dict = stage.to_dict()
            if stage.image is not None:
                _, img_url = storage_manager.save_cv_image(
                    stage.image, category="pipeline", suffix=f"s{stage.stage_number}_{stage.id}"
                )
                stage_dict["image_url"] = img_url
            stages_meta.append(stage_dict)

        return orig_url, crop_url, enh_url, stages_meta


cv_pipeline = CVPipeline()

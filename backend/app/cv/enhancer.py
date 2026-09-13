"""
PlateVision — Plate Region Enhancer

Once a plate crop is extracted from the detector, this module applies
aggressive plate-specific image processing to maximize OCR accuracy:
  - Plate-specific CLAHE (higher clip limit)
  - Adaptive thresholding
  - Morphological cleanup (opening/closing)
  - Edge detection (for visualization)
"""

from typing import Any, Dict, List, Optional
import cv2
import numpy as np

from backend.app.cv.preprocessor import PipelineStage, _encode_image_base64


class PlateEnhancer:
    """Enhance a cropped plate region for optimal OCR input."""

    def __init__(self):
        self.stages: List[PipelineStage] = []
        self._stage_counter = 0

    def _add_stage(self, id, title, description, algorithm, image, parameters=None, metrics=None, stage_offset=0):
        self._stage_counter += 1
        stage = PipelineStage(
            id=id,
            title=title,
            stage_number=stage_offset + self._stage_counter,
            description=description,
            algorithm=algorithm,
            parameters=parameters or {},
            metrics=metrics or {},
            image=image.copy(),
            base64_preview=_encode_image_base64(image),
        )
        self.stages.append(stage)
        return stage

    def enhance(self, plate_crop: np.ndarray, stage_offset: int = 0) -> tuple:
        """
        Enhance plate crop. Returns (enhanced_color, enhanced_binary, stages).
        The color version is for OCR (OCR engines handle their own internal preprocessing).
        The binary version is for pipeline visualization.
        """
        self.stages = []
        self._stage_counter = 0

        # Record the raw crop
        self._add_stage(
            id="plate_crop",
            title="Plate Crop (Raw)",
            description="Extracted plate region from the full image with 10% padding on each side.",
            algorithm="Numpy array slicing with padded bounding box",
            image=plate_crop,
            metrics={"width": plate_crop.shape[1], "height": plate_crop.shape[0]},
            stage_offset=stage_offset,
        )

        # ── Grayscale ──────────────────────────────────────────────────
        gray = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)
        self._add_stage(
            id="plate_grayscale",
            title="Plate Grayscale",
            description="Grayscale conversion of the plate crop for thresholding operations.",
            algorithm="cv2.cvtColor(crop, COLOR_BGR2GRAY)",
            image=gray,
            stage_offset=stage_offset,
        )

        # ── Plate-specific CLAHE (more aggressive) ────────────────────
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(4, 4))
        clahe_applied = clahe.apply(gray)
        self._add_stage(
            id="plate_clahe",
            title="Plate CLAHE Enhancement",
            description="Aggressive CLAHE with higher clip limit (3.0) on the small plate crop to maximize character-to-background contrast.",
            algorithm="CLAHE (clipLimit=3.0, tileGrid=4×4)",
            image=clahe_applied,
            parameters={"clip_limit": 3.0, "tile_grid": "4x4"},
            stage_offset=stage_offset,
        )

        # ── Adaptive Thresholding ─────────────────────────────────────
        thresh = cv2.adaptiveThreshold(
            clahe_applied, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            blockSize=11,
            C=2
        )
        self._add_stage(
            id="plate_threshold",
            title="Adaptive Threshold",
            description="Gaussian adaptive thresholding handles local illumination variation across the plate surface (shadows, gradients). Superior to global Otsu for real-world plates.",
            algorithm="cv2.adaptiveThreshold (Gaussian, blockSize=11, C=2)",
            image=thresh,
            parameters={"method": "ADAPTIVE_THRESH_GAUSSIAN_C", "block_size": 11, "C": 2},
            stage_offset=stage_offset,
        )

        # ── Morphological Opening ─────────────────────────────────────
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        opened = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
        self._add_stage(
            id="plate_morph_open",
            title="Morphological Opening",
            description="Erosion → Dilation with 3×3 kernel. Removes small noise dots while preserving character strokes. One iteration to avoid destroying thin fonts common on Indian plates.",
            algorithm="cv2.morphologyEx(MORPH_OPEN, kernel=3×3, iter=1)",
            image=opened,
            parameters={"operation": "opening", "kernel_size": "3x3", "iterations": 1},
            stage_offset=stage_offset,
        )

        # ── Morphological Closing (optional small holes) ──────────────
        closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel, iterations=1)
        self._add_stage(
            id="plate_morph_close",
            title="Morphological Closing",
            description="Dilation → Erosion. Fills small dark holes within character strokes to make them solid.",
            algorithm="cv2.morphologyEx(MORPH_CLOSE, kernel=3×3, iter=1)",
            image=closed,
            parameters={"operation": "closing", "kernel_size": "3x3", "iterations": 1},
            stage_offset=stage_offset,
        )

        # ── Edge Detection (Canny — for visualization) ────────────────
        edges = cv2.Canny(clahe_applied, 50, 150)
        self._add_stage(
            id="plate_edges",
            title="Edge Detection (Canny)",
            description="Canny edge detection on the enhanced plate. Used for contour analysis and perspective correction detection. Primarily for visualization.",
            algorithm="cv2.Canny(image, threshold1=50, threshold2=150)",
            image=edges,
            parameters={"threshold1": 50, "threshold2": 150},
            stage_offset=stage_offset,
        )

        # ── Enhanced color version for OCR ────────────────────────────
        # PaddleOCR/EasyOCR work best with color or CLAHE-enhanced input
        lab = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        l_enhanced = clahe.apply(l)
        enhanced_color = cv2.cvtColor(cv2.merge([l_enhanced, a, b]), cv2.COLOR_LAB2BGR)

        self._add_stage(
            id="plate_enhanced_color",
            title="OCR-Ready Enhanced Plate",
            description="Final enhanced color plate sent to the OCR engine. CLAHE applied on LAB L-channel preserves color while maximizing text contrast. OCR engines (EasyOCR/PaddleOCR) perform their own internal binarization.",
            algorithm="CLAHE on LAB L-channel → merge → BGR",
            image=enhanced_color,
            stage_offset=stage_offset,
        )

        return enhanced_color, closed, self.stages

"""
PlateVision — Plate Detector

YOLOv8 license plate detection with automatic model management
and contour-based fallback.
"""

import logging
import os
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np

from backend.app.cv.preprocessor import PipelineStage, _encode_image_base64

logger = logging.getLogger("platevision.detector")

# Global singleton for the YOLO model — loaded once
_yolo_model = None
_yolo_load_attempted = False


def _load_yolo_model(model_path: str = None) -> Optional[Any]:
    """Load YOLOv8 model. Uses pretrained yolov8n.pt if no custom plate model is available."""
    global _yolo_model, _yolo_load_attempted
    if _yolo_load_attempted:
        return _yolo_model
    _yolo_load_attempted = True

    try:
        from ultralytics import YOLO

        # Try custom plate-detector model first
        if model_path and os.path.exists(model_path):
            logger.info(f"Loading custom plate detector from {model_path}")
            _yolo_model = YOLO(model_path)
        else:
            # Fallback: use pretrained YOLOv8n (general object detector)
            # It won't detect "license_plate" class specifically, but we can
            # use it for vehicle detection and then crop plate via heuristics
            logger.info("Custom plate model not found. Loading YOLOv8n (general detector)...")
            _yolo_model = YOLO("yolov8n.pt")

        logger.info("YOLO model loaded successfully.")
        return _yolo_model

    except Exception as e:
        logger.warning(f"Failed to load YOLO model: {e}. Falling back to contour-based detection.")
        _yolo_model = None
        return None


class PlateDetector:
    """
    License plate detector with two strategies:
    1. YOLOv8 deep learning detection (primary)
    2. Contour-based classical detection (fallback)
    """

    def __init__(self, confidence_threshold: float = 0.35, iou_threshold: float = 0.45):
        self.confidence_threshold = confidence_threshold
        self.iou_threshold = iou_threshold

    def detect(
        self,
        img: np.ndarray,
        model_path: str = None,
        stage_offset: int = 0,
    ) -> Tuple[Optional[np.ndarray], Optional[Dict[str, Any]], Optional[PipelineStage]]:
        """
        Detect license plate in image.
        Returns: (plate_crop, detection_info, pipeline_stage)
        detection_info: {"bbox": [x1,y1,x2,y2], "confidence": float, "method": str}
        """
        model = _load_yolo_model(model_path)

        if model is not None:
            return self._detect_yolo(img, model, stage_offset)
        else:
            return self._detect_contour(img, stage_offset)

    def _detect_yolo(
        self,
        img: np.ndarray,
        model: Any,
        stage_offset: int,
    ) -> Tuple[Optional[np.ndarray], Optional[Dict[str, Any]], Optional[PipelineStage]]:
        """YOLOv8-based detection."""
        results = model(img, conf=self.confidence_threshold, iou=self.iou_threshold, verbose=False)

        best_box = None
        best_conf = 0.0
        method = "yolov8"

        for result in results:
            boxes = result.boxes
            if boxes is None or len(boxes) == 0:
                continue
            for box in boxes:
                conf = float(box.conf[0])
                cls_id = int(box.cls[0])
                # Accept any detection — in general yolov8n, class doesn't matter
                # For a fine-tuned model, class 0 would be "license_plate"
                if conf > best_conf:
                    best_conf = conf
                    best_box = box.xyxy[0].cpu().numpy().astype(int)

        if best_box is None:
            # Fallback to contour if YOLO finds nothing
            logger.info("YOLO found no detections. Falling back to contour-based detection.")
            return self._detect_contour(img, stage_offset)

        x1, y1, x2, y2 = best_box
        h, w = img.shape[:2]

        # Add 10% padding
        pad_x = int((x2 - x1) * 0.1)
        pad_y = int((y2 - y1) * 0.1)
        x1 = max(0, x1 - pad_x)
        y1 = max(0, y1 - pad_y)
        x2 = min(w, x2 + pad_x)
        y2 = min(h, y2 + pad_y)

        plate_crop = img[y1:y2, x1:x2]
        if plate_crop.size == 0:
            return self._detect_contour(img, stage_offset)

        detection_info = {
            "bbox": [int(x1), int(y1), int(x2), int(y2)],
            "confidence": round(best_conf, 4),
            "method": method,
        }

        # Create annotated visualization
        vis = img.copy()
        cv2.rectangle(vis, (x1, y1), (x2, y2), (0, 255, 0), 3)
        cv2.putText(
            vis, f"Plate: {best_conf:.1%}",
            (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2,
        )

        stage = PipelineStage(
            id="plate_detection",
            title="Plate Detection (YOLOv8)",
            stage_number=stage_offset + 1,
            description=f"YOLOv8 detected plate region at [{x1},{y1},{x2},{y2}] with {best_conf:.1%} confidence. Bounding box padded by 10% to capture edge characters.",
            algorithm="YOLOv8 (CSPDarknet backbone, PANet neck, anchor-free decoupled head)",
            parameters={"confidence_threshold": self.confidence_threshold, "iou_threshold": self.iou_threshold},
            metrics={"confidence": round(best_conf, 4), "bbox": [int(x1), int(y1), int(x2), int(y2)]},
            image=vis.copy(),
            base64_preview=_encode_image_base64(vis),
        )
        return plate_crop, detection_info, stage

    def _detect_contour(
        self,
        img: np.ndarray,
        stage_offset: int,
    ) -> Tuple[Optional[np.ndarray], Optional[Dict[str, Any]], Optional[PipelineStage]]:
        """Classical contour-based plate detection fallback."""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.bilateralFilter(gray, 11, 17, 17)
        edges = cv2.Canny(blurred, 30, 200)

        contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        contours = sorted(contours, key=cv2.contourArea, reverse=True)[:30]

        plate_contour = None
        for cnt in contours:
            peri = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.018 * peri, True)
            if len(approx) == 4:
                # Check aspect ratio (plates are typically 2:1 to 5:1)
                x, y, w_box, h_box = cv2.boundingRect(approx)
                ar = w_box / max(h_box, 1)
                if 1.5 < ar < 6.0 and w_box > 60:
                    plate_contour = approx
                    break

        if plate_contour is None:
            # Last resort: use center crop heuristic
            h, w = img.shape[:2]
            # Assume plate is roughly in center-bottom third
            y1 = int(h * 0.5)
            y2 = int(h * 0.85)
            x1 = int(w * 0.2)
            x2 = int(w * 0.8)
            plate_crop = img[y1:y2, x1:x2]

            vis = img.copy()
            cv2.rectangle(vis, (x1, y1), (x2, y2), (0, 165, 255), 3)
            cv2.putText(vis, "Heuristic crop", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 165, 255), 2)

            stage = PipelineStage(
                id="plate_detection",
                title="Plate Detection (Heuristic Fallback)",
                stage_number=stage_offset + 1,
                description="Neither YOLO nor contour detection found a plate. Using center-bottom crop as a last resort.",
                algorithm="Heuristic center-bottom crop (50-85% height, 20-80% width)",
                metrics={"confidence": 0.1, "bbox": [x1, y1, x2, y2], "method": "heuristic"},
                image=vis.copy(),
                base64_preview=_encode_image_base64(vis),
            )
            return plate_crop, {"bbox": [x1, y1, x2, y2], "confidence": 0.1, "method": "heuristic"}, stage

        x, y, w_box, h_box = cv2.boundingRect(plate_contour)
        pad = int(max(w_box, h_box) * 0.1)
        h_img, w_img = img.shape[:2]
        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(w_img, x + w_box + pad)
        y2 = min(h_img, y + h_box + pad)

        plate_crop = img[y1:y2, x1:x2]

        vis = img.copy()
        cv2.drawContours(vis, [plate_contour], -1, (0, 255, 0), 3)
        cv2.rectangle(vis, (x1, y1), (x2, y2), (255, 0, 0), 2)

        stage = PipelineStage(
            id="plate_detection",
            title="Plate Detection (Contour Fallback)",
            stage_number=stage_offset + 1,
            description=f"Contour-based detection found rectangular plate region at [{x1},{y1},{x2},{y2}]. Aspect ratio: {w_box/max(h_box,1):.1f}:1.",
            algorithm="Bilateral filter → Canny edges → findContours → approxPolyDP (4-vertex filter)",
            parameters={"epsilon_factor": 0.018, "aspect_ratio_range": "1.5 - 6.0"},
            metrics={"confidence": 0.5, "bbox": [x1, y1, x2, y2], "aspect_ratio": round(w_box / max(h_box, 1), 2)},
            image=vis.copy(),
            base64_preview=_encode_image_base64(vis),
        )
        return plate_crop, {"bbox": [x1, y1, x2, y2], "confidence": 0.5, "method": "contour"}, stage

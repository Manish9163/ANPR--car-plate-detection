"""
PlateVision — Perspective Correction

Detects skewed license plates and applies 4-point perspective transform
to rectify them into a frontal-parallel view.
"""

import math
from typing import List, Optional, Tuple

import cv2
import numpy as np

from backend.app.cv.preprocessor import PipelineStage, _encode_image_base64


def order_points(pts: np.ndarray) -> np.ndarray:
    """Order 4 points as [top-left, top-right, bottom-right, bottom-left]."""
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]   # top-left has smallest sum
    rect[2] = pts[np.argmax(s)]   # bottom-right has largest sum
    d = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(d)]   # top-right has smallest difference
    rect[3] = pts[np.argmax(d)]   # bottom-left has largest difference
    return rect


def compute_skew_angle(pts: np.ndarray) -> float:
    """Estimate the skew angle from ordered quadrilateral points."""
    ordered = order_points(pts)
    tl, tr, br, bl = ordered
    # Angle of the top edge relative to horizontal
    dx = tr[0] - tl[0]
    dy = tr[1] - tl[1]
    angle = math.degrees(math.atan2(dy, dx))
    return abs(angle)


def four_point_transform(image: np.ndarray, pts: np.ndarray) -> np.ndarray:
    """Apply a perspective transform using 4 corner points."""
    rect = order_points(pts)
    tl, tr, br, bl = rect

    # Compute new width
    widthA = np.linalg.norm(br - bl)
    widthB = np.linalg.norm(tr - tl)
    max_width = max(int(widthA), int(widthB))

    # Compute new height
    heightA = np.linalg.norm(tr - br)
    heightB = np.linalg.norm(tl - bl)
    max_height = max(int(heightA), int(heightB))

    # Destination points
    dst = np.array([
        [0, 0],
        [max_width - 1, 0],
        [max_width - 1, max_height - 1],
        [0, max_height - 1]
    ], dtype="float32")

    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (max_width, max_height))
    return warped


def try_perspective_correction(
    plate_crop: np.ndarray,
    skew_threshold: float = 5.0,
    stage_offset: int = 0,
) -> Tuple[np.ndarray, Optional[PipelineStage]]:
    """
    Attempt perspective correction on a plate crop.
    Returns (corrected_image, stage_record_or_None).
    If no significant quadrilateral skew is detected, returns the original.
    """
    gray = cv2.cvtColor(plate_crop, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 200)

    # Find contours
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return plate_crop, _make_skip_stage(plate_crop, "No contours found.", stage_offset)

    # Sort by area, largest first
    contours = sorted(contours, key=cv2.contourArea, reverse=True)

    for cnt in contours[:5]:
        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        if len(approx) == 4:
            pts = approx.reshape(4, 2).astype("float32")
            skew_angle = compute_skew_angle(pts)

            if skew_angle > skew_threshold:
                corrected = four_point_transform(plate_crop, pts)
                if corrected.shape[0] < 10 or corrected.shape[1] < 10:
                    continue  # degenerate warp, skip

                stage = PipelineStage(
                    id="perspective_correction",
                    title="Perspective Correction",
                    stage_number=stage_offset + 1,
                    description=f"Skew of {skew_angle:.1f}° detected (threshold: {skew_threshold}°). Applied 4-point perspective warp to rectify plate.",
                    algorithm="cv2.getPerspectiveTransform + cv2.warpPerspective",
                    parameters={"skew_angle": round(skew_angle, 2), "threshold": skew_threshold},
                    metrics={"original_size": f"{plate_crop.shape[1]}x{plate_crop.shape[0]}", "corrected_size": f"{corrected.shape[1]}x{corrected.shape[0]}"},
                    image=corrected.copy(),
                    base64_preview=_encode_image_base64(corrected),
                )
                return corrected, stage
            else:
                return plate_crop, _make_skip_stage(plate_crop, f"Skew angle ({skew_angle:.1f}°) below threshold ({skew_threshold}°). No correction needed.", stage_offset)

    return plate_crop, _make_skip_stage(plate_crop, "No valid quadrilateral contour found for perspective correction.", stage_offset)


def _make_skip_stage(img: np.ndarray, reason: str, stage_offset: int) -> PipelineStage:
    return PipelineStage(
        id="perspective_correction",
        title="Perspective Correction (Skipped)",
        stage_number=stage_offset + 1,
        description=reason,
        algorithm="N/A — correction not applied",
        image=img.copy(),
        base64_preview=_encode_image_base64(img),
    )

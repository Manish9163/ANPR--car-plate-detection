"""
Unit tests for Computer Vision transformations and perspective geometry
"""

import numpy as np
import cv2
import pytest
from backend.app.cv.preprocessor import Preprocessor
from backend.app.cv.perspective import order_points, compute_skew_angle


def test_perspective_order_points():
    # Construct 4 points of a rectangle
    pts = np.array([[10, 10], [100, 10], [100, 50], [10, 50]], dtype="float32")
    ordered = order_points(pts)
    tl, tr, br, bl = ordered
    assert np.allclose(tl, [10, 10])
    assert np.allclose(tr, [100, 10])
    assert np.allclose(br, [100, 50])
    assert np.allclose(bl, [10, 50])


def test_compute_skew_angle():
    # Horizontal rectangle should have approx 0 skew angle
    pts = np.array([[0, 0], [100, 0], [100, 40], [0, 40]], dtype="float32")
    angle = compute_skew_angle(pts)
    assert abs(angle) < 1.0


def test_preprocessor_pipeline_stages():
    # Create a synthetic image
    img = np.zeros((200, 400, 3), dtype=np.uint8)
    img[50:150, 100:300] = 255
    success, buffer = cv2.imencode(".jpg", img)
    assert success is True

    prep = Preprocessor()
    processed, stages = prep.preprocess(buffer.tobytes())
    assert processed is not None
    assert len(stages) >= 6
    # Verify stages have metadata
    stage_ids = [s.id for s in stages]
    assert "input" in stage_ids
    assert "grayscale" in stage_ids
    assert "clahe" in stage_ids

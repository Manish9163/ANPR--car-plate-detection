"""
Unit tests for OCR Post-Processor and Confusion Matrix Resolution
"""

import pytest
from backend.app.ocr.postprocessor import PostProcessor


def test_normalize():
    pp = PostProcessor()
    assert pp.normalize("dl-01 ab 1234") == "DL01AB1234"
    assert pp.normalize("MH.12/DE-1433") == "MH12DE1433"


def test_confusion_resolution_state_code():
    pp = PostProcessor()
    # 0 at position 0 should be coerced to letter O
    assert pp.resolve_confusions("0L01AB1234").startswith("OL")
    # 1 at position 0 should be coerced to letter I
    assert pp.resolve_confusions("1N01AB1234").startswith("IN")


def test_confusion_resolution_district():
    pp = PostProcessor()
    # Letter O in district code (pos 2-3) should be coerced to digit 0
    resolved = pp.resolve_confusions("DLO1AB1234")
    assert resolved == "DL01AB1234"

    # Letter I in district code should be coerced to digit 1
    resolved2 = pp.resolve_confusions("DLI2AB1234")
    assert resolved2 == "DL12AB1234"


def test_confusion_resolution_vehicle_number():
    pp = PostProcessor()
    # Letter O in tail vehicle number should be coerced to digit 0
    resolved = pp.resolve_confusions("DL01AB12O4")
    assert resolved == "DL01AB1204"

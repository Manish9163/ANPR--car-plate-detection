"""
Unit tests for Indian License Plate Registration Validator
"""

import pytest
from backend.app.ocr.validator import validate_plate, INDIAN_STATE_CODES


def test_valid_standard_plate():
    res = validate_plate("DL01AB1234")
    assert res.is_valid is True
    assert res.state_code == "DL"
    assert res.state_name == "Delhi"
    assert res.rto_code == "01"
    assert res.series == "AB"
    assert res.vehicle_number == "1234"
    assert res.format_type == "STANDARD"


def test_valid_bharat_series():
    res = validate_plate("21BH1234AA")
    assert res.is_valid is True
    assert res.state_code == "BH"
    assert res.rto_code == "21"
    assert res.format_type == "BHARAT"


def test_state_codes_mapping():
    assert "MH" in INDIAN_STATE_CODES
    assert "KA" in INDIAN_STATE_CODES
    assert "WB" in INDIAN_STATE_CODES
    assert "TN" in INDIAN_STATE_CODES
    assert INDIAN_STATE_CODES["MH"] == "Maharashtra"
    assert INDIAN_STATE_CODES["KA"] == "Karnataka"


def test_invalid_short_text():
    res = validate_plate("DL")
    assert res.is_valid is False
    assert len(res.validation_notes) > 0


def test_invalid_state_code():
    res = validate_plate("ZZ99AA1234")
    assert res.is_valid is False
    assert res.state_name is None

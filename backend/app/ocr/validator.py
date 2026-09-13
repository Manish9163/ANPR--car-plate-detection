"""
PlateVision — Indian Registration Number Validator

Validates Indian vehicle registration numbers against known state codes,
district ranges, and format patterns. Generates candidate interpretations
for ambiguous OCR output and scores each.
"""

import re
from typing import Dict, List, Optional

from backend.app.schemas.recognition import ValidationResult

# All valid Indian state/UT codes → full names
INDIAN_STATE_CODES: Dict[str, str] = {
    "AN": "Andaman & Nicobar Islands",
    "AP": "Andhra Pradesh",
    "AR": "Arunachal Pradesh",
    "AS": "Assam",
    "BR": "Bihar",
    "CG": "Chhattisgarh",
    "CH": "Chandigarh",
    "DD": "Dadra & Nagar Haveli and Daman & Diu",
    "DL": "Delhi",
    "DN": "Dadra & Nagar Haveli",
    "GA": "Goa",
    "GJ": "Gujarat",
    "HP": "Himachal Pradesh",
    "HR": "Haryana",
    "JH": "Jharkhand",
    "JK": "Jammu & Kashmir",
    "KA": "Karnataka",
    "KL": "Kerala",
    "LA": "Ladakh",
    "LD": "Lakshadweep",
    "MH": "Maharashtra",
    "ML": "Meghalaya",
    "MN": "Manipur",
    "MP": "Madhya Pradesh",
    "MZ": "Mizoram",
    "NL": "Nagaland",
    "OD": "Odisha",
    "PB": "Punjab",
    "PY": "Puducherry",
    "RJ": "Rajasthan",
    "SK": "Sikkim",
    "TN": "Tamil Nadu",
    "TR": "Tripura",
    "TS": "Telangana",
    "UK": "Uttarakhand",
    "UP": "Uttar Pradesh",
    "WB": "West Bengal",
}

# Regex patterns for Indian plate formats
# Standard: SS DD XX NNNN (e.g., KA19TR0234)
# BH series: DD BH NNNN XX (Bharat series)
STANDARD_PATTERN = re.compile(
    r"^([A-Z]{2})"         # State code (2 letters)
    r"(\d{1,2})"           # District/RTO code (1-2 digits)
    r"([A-Z]{1,3})"        # Series (1-3 letters)
    r"(\d{1,4})$"          # Vehicle number (1-4 digits)
)

BHARAT_PATTERN = re.compile(
    r"^(\d{2})"            # Year code
    r"(BH)"                # BH series
    r"(\d{1,4})"           # Number
    r"([A-Z]{1,2})$"       # Series
)


def validate_plate(text: str) -> ValidationResult:
    """
    Validate a normalized plate number against Indian registration formats.
    Returns a ValidationResult with detailed breakdown.
    """
    if not text or len(text) < 4:
        return ValidationResult(
            is_valid=False,
            validation_notes=["Plate text too short (minimum 4 characters required)."]
        )

    notes: List[str] = []

    # Try standard format
    match = STANDARD_PATTERN.match(text)
    if match:
        state_code = match.group(1)
        district = match.group(2)
        series = match.group(3)
        number = match.group(4)

        state_name = INDIAN_STATE_CODES.get(state_code)

        if state_name:
            notes.append(f"✅ Valid state code: {state_code} ({state_name})")
        else:
            notes.append(f"⚠️ Unrecognized state code: {state_code}. May be a special registration or OCR error.")

        district_int = int(district)
        if 1 <= district_int <= 99:
            notes.append(f"✅ District/RTO code: {district.zfill(2)}")
        else:
            notes.append(f"⚠️ District code {district} outside expected range (01-99).")

        notes.append(f"✅ Series: {series}")
        notes.append(f"✅ Vehicle number: {number}")
        notes.append(f"📋 Format: Standard Indian ({state_code} {district.zfill(2)} {series} {number})")

        return ValidationResult(
            is_valid=state_name is not None,
            state_code=state_code,
            state_name=state_name,
            rto_code=district.zfill(2),
            series=series,
            vehicle_number=number,
            format_type="STANDARD",
            validation_notes=notes,
        )

    # Try Bharat series
    match_bh = BHARAT_PATTERN.match(text)
    if match_bh:
        year = match_bh.group(1)
        bh = match_bh.group(2)
        number = match_bh.group(3)
        series = match_bh.group(4)

        notes.append(f"✅ Bharat (BH) series registration")
        notes.append(f"✅ Year code: {year}")
        notes.append(f"✅ Vehicle number: {number}")
        notes.append(f"✅ Series: {series}")
        notes.append(f"📋 Format: Bharat Series ({year} BH {number} {series})")

        return ValidationResult(
            is_valid=True,
            state_code="BH",
            state_name="Bharat (All India)",
            rto_code=year,
            series=series,
            vehicle_number=number,
            format_type="BHARAT",
            validation_notes=notes,
        )

    # Partial match: at least check state code
    if len(text) >= 2 and text[:2].isalpha():
        state_code = text[:2]
        state_name = INDIAN_STATE_CODES.get(state_code)
        if state_name:
            notes.append(f"✅ State code recognized: {state_code} ({state_name})")
            notes.append(f"⚠️ Full format could not be parsed. Text: {text}")
            return ValidationResult(
                is_valid=False,
                state_code=state_code,
                state_name=state_name,
                format_type="PARTIAL",
                validation_notes=notes,
            )

    notes.append(f"❌ Could not match any known Indian registration format. Text: {text}")
    return ValidationResult(
        is_valid=False,
        validation_notes=notes,
    )

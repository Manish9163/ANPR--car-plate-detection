"""
PlateVision — OCR Post-Processor

Context-aware text normalization and confusion resolution
for Indian license plates.
"""

import re
from typing import Dict, List, Optional, Tuple


# Common OCR character confusions (bidirectional)
LETTER_TO_DIGIT = {
    "O": "0", "I": "1", "L": "1", "Z": "2", "S": "5",
    "B": "8", "G": "6", "T": "7", "A": "4",
}
DIGIT_TO_LETTER = {v: k for k, v in LETTER_TO_DIGIT.items()}
# Override some ambiguous reverse mappings
DIGIT_TO_LETTER.update({"0": "O", "1": "I", "2": "Z", "5": "S", "8": "B"})


class PostProcessor:
    """
    Normalize and correct OCR output for Indian license plates.

    Indian Format: SS DD XX NNNN
      SS = State code (2 letters)
      DD = District/RTO code (2 digits)
      XX = Series (1-3 letters)
      NNNN = Vehicle number (1-4 digits)
    """

    def normalize(self, raw_text: str) -> str:
        """Basic text normalization: uppercase, strip non-alphanumeric."""
        text = raw_text.upper()
        text = re.sub(r"[^A-Z0-9]", "", text)
        return text

    def resolve_confusions(self, text: str) -> str:
        """
        Position-aware confusion resolution for Indian plates.

        Pattern: [LL] [DD] [L{1-3}] [D{1-4}]
          Positions 0-1: MUST be letters (state code)
          Positions 2-3: MUST be digits (district code)
          Remaining: letters then digits
        """
        if len(text) < 4:
            return text

        corrected = list(text)

        # Positions 0-1: Force letters (state code)
        for i in range(min(2, len(corrected))):
            ch = corrected[i]
            if ch.isdigit() and ch in DIGIT_TO_LETTER:
                corrected[i] = DIGIT_TO_LETTER[ch]

        # Positions 2-3: Force digits (district code)
        for i in range(2, min(4, len(corrected))):
            ch = corrected[i]
            if ch.isalpha() and ch in LETTER_TO_DIGIT:
                corrected[i] = LETTER_TO_DIGIT[ch]

        # Find the transition point from series (letters) to number (digits)
        # Scan from position 4 onwards
        if len(corrected) > 4:
            # Find where digits start in the tail
            series_end = 4
            for i in range(4, len(corrected)):
                if corrected[i].isdigit():
                    series_end = i
                    break
            else:
                series_end = len(corrected)

            # Series section (positions 4 to series_end-1): force letters
            for i in range(4, series_end):
                ch = corrected[i]
                if ch.isdigit() and ch in DIGIT_TO_LETTER:
                    corrected[i] = DIGIT_TO_LETTER[ch]

            # Number section (series_end onwards): force digits
            for i in range(series_end, len(corrected)):
                ch = corrected[i]
                if ch.isalpha() and ch in LETTER_TO_DIGIT:
                    corrected[i] = LETTER_TO_DIGIT[ch]

        return "".join(corrected)

    def process(self, raw_text: str) -> Tuple[str, str]:
        """
        Full post-processing pipeline.
        Returns: (normalized_text, confusion_resolved_text)
        """
        normalized = self.normalize(raw_text)
        resolved = self.resolve_confusions(normalized)
        return normalized, resolved

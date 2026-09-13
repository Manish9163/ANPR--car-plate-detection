"""
PlateVision — File Storage Manager

Handles saving, retrieving, and organizing image assets on disk:
  - Original uploaded vehicle images / frames
  - Cropped plate images
  - Enhanced plate crops
  - Intermediate pipeline stage visualizations
"""

import os
import uuid
import base64
import logging
from typing import Optional, Tuple
import cv2
import numpy as np

from backend.app.core.config import settings

logger = logging.getLogger("platevision.storage")


class StorageManager:
    """Manages file persistence for recognitions and pipeline steps."""

    def __init__(self, base_upload_dir: Optional[str] = None):
        self.upload_dir = base_upload_dir or settings.UPLOAD_DIR
        self.originals_dir = os.path.join(self.upload_dir, "originals")
        self.crops_dir = os.path.join(self.upload_dir, "crops")
        self.pipeline_dir = os.path.join(self.upload_dir, "pipeline")

        os.makedirs(self.originals_dir, exist_ok=True)
        os.makedirs(self.crops_dir, exist_ok=True)
        os.makedirs(self.pipeline_dir, exist_ok=True)

    def save_original(self, file_bytes: bytes, original_filename: str = "upload.jpg") -> Tuple[str, str]:
        """
        Saves the raw uploaded image file.
        Returns: (file_path, relative_url)
        """
        ext = os.path.splitext(original_filename)[1].lower()
        if not ext or ext not in [".jpg", ".jpeg", ".png", ".webp"]:
            ext = ".jpg"

        file_id = str(uuid.uuid4())
        filename = f"{file_id}{ext}"
        abs_path = os.path.join(self.originals_dir, filename)

        with open(abs_path, "wb") as f:
            f.write(file_bytes)

        rel_url = f"/uploads/originals/{filename}"
        return abs_path, rel_url

    def save_cv_image(self, image_np: np.ndarray, category: str = "crops", suffix: str = "") -> Tuple[str, str]:
        """
        Encodes and saves an OpenCV BGR numpy array as a PNG or JPG.
        Category: 'crops' or 'pipeline'
        Returns: (abs_path, relative_url)
        """
        file_id = str(uuid.uuid4())
        filename = f"{file_id}_{suffix}.png" if suffix else f"{file_id}.png"

        target_dir = self.crops_dir if category == "crops" else self.pipeline_dir
        abs_path = os.path.join(target_dir, filename)

        cv2.imwrite(abs_path, image_np)
        rel_url = f"/uploads/{category}/{filename}"
        return abs_path, rel_url

    @staticmethod
    def to_base64(image_np: np.ndarray, format_ext: str = ".jpg") -> str:
        """Encodes an OpenCV image to a base64 data URI string."""
        success, encoded = cv2.imencode(format_ext, image_np)
        if not success:
            return ""
        b64 = base64.b64encode(encoded).decode("utf-8")
        mime = "image/jpeg" if format_ext.lower() in [".jpg", ".jpeg"] else "image/png"
        return f"data:{mime};base64,{b64}"

    def delete_recognition_files(self, original_path: Optional[str] = None,
                                 crop_path: Optional[str] = None,
                                 enhanced_path: Optional[str] = None):
        """Safely cleans up stored images when a recognition record is deleted."""
        for path in [original_path, crop_path, enhanced_path]:
            if path and os.path.isfile(path):
                try:
                    os.remove(path)
                except Exception as e:
                    logger.warning(f"Failed to delete file {path}: {e}")


storage_manager = StorageManager()

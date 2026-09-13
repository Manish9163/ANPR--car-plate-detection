"""
PlateVision — Computer Vision Preprocessor

Implements adaptive image preprocessing with noise analysis,
conditional denoising, and contrast enhancement. Every intermediate
step is recorded for the pipeline visualizer.
"""

import base64
import time
from typing import Any, Dict, List, Optional, Tuple
from dataclasses import dataclass, field

import cv2
import numpy as np


@dataclass
class PipelineStage:
    """Record of a single CV pipeline stage for visualization."""
    id: str
    title: str
    stage_number: int
    description: str
    algorithm: str
    parameters: Dict[str, Any] = field(default_factory=dict)
    metrics: Dict[str, Any] = field(default_factory=dict)
    image: Optional[np.ndarray] = None  # raw opencv image
    base64_preview: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "stage_number": self.stage_number,
            "description": self.description,
            "algorithm": self.algorithm,
            "parameters": self.parameters,
            "metrics": self.metrics,
            "base64_preview": self.base64_preview,
        }


def _encode_image_base64(img: np.ndarray, quality: int = 80) -> str:
    """Encode an OpenCV image to base64 JPEG string."""
    encode_params = [cv2.IMWRITE_JPEG_QUALITY, quality]
    _, buffer = cv2.imencode(".jpg", img, encode_params)
    return base64.b64encode(buffer).decode("utf-8")


class Preprocessor:
    """
    Adaptive image preprocessing pipeline.

    Stages:
        1. Input validation & decoding
        2. Resize (preserve aspect ratio, max 1920px)
        3. Noise analysis (Laplacian variance)
        4. Conditional denoising (bilateral / gaussian / skip)
        5. Color space conversions (Grayscale, HSV, LAB)
        6. Contrast enhancement (CLAHE on L-channel)
    """

    MAX_DIMENSION = 1920
    NOISE_HIGH_THRESHOLD = 50
    NOISE_MODERATE_THRESHOLD = 500

    def __init__(self):
        self.stages: List[PipelineStage] = []
        self._stage_counter = 0

    def _add_stage(
        self,
        id: str,
        title: str,
        description: str,
        algorithm: str,
        image: np.ndarray,
        parameters: Optional[Dict[str, Any]] = None,
        metrics: Optional[Dict[str, Any]] = None,
    ) -> PipelineStage:
        self._stage_counter += 1
        stage = PipelineStage(
            id=id,
            title=title,
            stage_number=self._stage_counter,
            description=description,
            algorithm=algorithm,
            parameters=parameters or {},
            metrics=metrics or {},
            image=image.copy(),
            base64_preview=_encode_image_base64(image),
        )
        self.stages.append(stage)
        return stage

    # ── Stage 1: Validation ──────────────────────────────────────────────
    def validate_image(self, raw_bytes: bytes) -> np.ndarray:
        """Decode raw image bytes and validate."""
        # Check magic bytes
        if raw_bytes[:3] == b"\xff\xd8\xff":
            fmt = "JPEG"
        elif raw_bytes[:8] == b"\x89PNG\r\n\x1a\n":
            fmt = "PNG"
        elif raw_bytes[:4] == b"RIFF" and raw_bytes[8:12] == b"WEBP":
            fmt = "WebP"
        else:
            fmt = "Unknown"

        np_arr = np.frombuffer(raw_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Failed to decode image — file may be corrupt or unsupported")

        h, w = img.shape[:2]
        if h < 50 or w < 50:
            raise ValueError(f"Image too small ({w}x{h}). Minimum 50x50 pixels required.")
        if h > 10000 or w > 10000:
            raise ValueError(f"Image too large ({w}x{h}). Maximum 10000x10000 pixels.")

        self._add_stage(
            id="input",
            title="Original Input",
            description=f"Raw uploaded image decoded successfully. Format: {fmt}",
            algorithm="cv2.imdecode (Numpy buffer → BGR array)",
            image=img,
            parameters={"format": fmt},
            metrics={"width": w, "height": h, "channels": img.shape[2], "size_bytes": len(raw_bytes)},
        )
        return img

    # ── Stage 2: Resize ──────────────────────────────────────────────────
    def resize(self, img: np.ndarray) -> np.ndarray:
        h, w = img.shape[:2]
        max_dim = max(h, w)
        if max_dim <= self.MAX_DIMENSION:
            self._add_stage(
                id="resize",
                title="Resize (No-Op)",
                description=f"Image already within {self.MAX_DIMENSION}px limit. No resizing needed.",
                algorithm="No operation",
                image=img,
                metrics={"original_size": f"{w}x{h}", "scale_factor": 1.0},
            )
            return img

        scale = self.MAX_DIMENSION / max_dim
        new_w = int(w * scale)
        new_h = int(h * scale)
        resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

        self._add_stage(
            id="resize",
            title="Resize (Aspect-Ratio Preserved)",
            description=f"Downscaled from {w}x{h} → {new_w}x{new_h} using INTER_AREA (best for downscaling).",
            algorithm="cv2.resize with INTER_AREA interpolation",
            image=resized,
            parameters={"interpolation": "INTER_AREA", "max_dimension": self.MAX_DIMENSION},
            metrics={"original_size": f"{w}x{h}", "new_size": f"{new_w}x{new_h}", "scale_factor": round(scale, 4)},
        )
        return resized

    # ── Stage 3: Noise Analysis ──────────────────────────────────────────
    def analyze_noise(self, img: np.ndarray) -> Tuple[str, float]:
        """Compute Laplacian variance to estimate image sharpness/noise."""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()

        if laplacian_var < self.NOISE_HIGH_THRESHOLD:
            noise_level = "HIGH"
            description = f"Laplacian variance = {laplacian_var:.1f} (< {self.NOISE_HIGH_THRESHOLD}). Image is noisy/blurry — strong denoising will be applied."
        elif laplacian_var < self.NOISE_MODERATE_THRESHOLD:
            noise_level = "MODERATE"
            description = f"Laplacian variance = {laplacian_var:.1f}. Moderate noise — light Gaussian blur will be applied."
        else:
            noise_level = "LOW"
            description = f"Laplacian variance = {laplacian_var:.1f} (> {self.NOISE_MODERATE_THRESHOLD}). Image is sharp — denoising skipped."

        self._add_stage(
            id="noise_analysis",
            title="Noise Analysis",
            description=description,
            algorithm="Laplacian variance: cv2.Laplacian(gray, CV_64F).var()",
            image=gray,
            parameters={
                "high_threshold": self.NOISE_HIGH_THRESHOLD,
                "moderate_threshold": self.NOISE_MODERATE_THRESHOLD,
            },
            metrics={"laplacian_variance": round(laplacian_var, 2), "noise_level": noise_level},
        )
        return noise_level, laplacian_var

    # ── Stage 4: Conditional Denoising ───────────────────────────────────
    def denoise(self, img: np.ndarray, noise_level: str) -> np.ndarray:
        if noise_level == "HIGH":
            denoised = cv2.bilateralFilter(img, d=9, sigmaColor=75, sigmaSpace=75)
            algo = "Bilateral Filter (d=9, σ_color=75, σ_space=75)"
            desc = "Strong edge-preserving denoising. Bilateral filter smooths homogeneous regions while keeping character edges sharp."
            params = {"filter": "bilateral", "d": 9, "sigmaColor": 75, "sigmaSpace": 75}
        elif noise_level == "MODERATE":
            denoised = cv2.GaussianBlur(img, (3, 3), 0)
            algo = "Gaussian Blur (kernel=3×3)"
            desc = "Light Gaussian smoothing to reduce moderate noise without significant detail loss."
            params = {"filter": "gaussian", "kernel_size": 3}
        else:
            denoised = img.copy()
            algo = "No denoising applied"
            desc = "Image is already sharp. Skipping denoising to preserve maximum detail."
            params = {"filter": "none"}

        self._add_stage(
            id="denoise",
            title=f"Denoising ({noise_level.title()} Noise)",
            description=desc,
            algorithm=algo,
            image=denoised,
            parameters=params,
        )
        return denoised

    # ── Stage 5: Color Space Conversions ─────────────────────────────────
    def color_conversions(self, img: np.ndarray) -> Dict[str, np.ndarray]:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)

        self._add_stage(
            id="grayscale",
            title="Grayscale Conversion",
            description="Single-channel intensity image. Foundation for thresholding and morphological operations.",
            algorithm="cv2.cvtColor(img, COLOR_BGR2GRAY)",
            image=gray,
        )
        self._add_stage(
            id="hsv",
            title="HSV Color Space",
            description="Hue-Saturation-Value decomposition. Useful for color-based segmentation (e.g., yellow/white plate detection).",
            algorithm="cv2.cvtColor(img, COLOR_BGR2HSV)",
            image=hsv,
        )
        self._add_stage(
            id="lab",
            title="LAB Color Space",
            description="Perceptually uniform color space. L-channel isolates luminance for lighting-invariant processing.",
            algorithm="cv2.cvtColor(img, COLOR_BGR2LAB)",
            image=lab,
        )
        return {"gray": gray, "hsv": hsv, "lab": lab}

    # ── Stage 6: CLAHE Contrast Enhancement ──────────────────────────────
    def enhance_contrast(self, img: np.ndarray) -> np.ndarray:
        """Apply CLAHE on L-channel of LAB for lighting-invariant contrast enhancement."""
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)

        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l_enhanced = clahe.apply(l_channel)

        lab_enhanced = cv2.merge([l_enhanced, a_channel, b_channel])
        enhanced = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)

        self._add_stage(
            id="clahe",
            title="CLAHE Contrast Enhancement",
            description="Contrast Limited Adaptive Histogram Equalization on L-channel. Enhances local contrast without amplifying noise.",
            algorithm="CLAHE (clipLimit=2.0, tileGrid=8×8) on LAB L-channel",
            image=enhanced,
            parameters={"clip_limit": 2.0, "tile_grid": "8x8", "color_space": "LAB"},
        )
        return enhanced

    # ── Full Preprocessing Pipeline ──────────────────────────────────────
    def preprocess(self, raw_bytes: bytes) -> Tuple[np.ndarray, List[PipelineStage]]:
        """Run the full preprocessing pipeline and return (enhanced_image, stages)."""
        self.stages = []
        self._stage_counter = 0

        img = self.validate_image(raw_bytes)
        img = self.resize(img)
        noise_level, _ = self.analyze_noise(img)
        img = self.denoise(img, noise_level)
        self.color_conversions(img)
        img = self.enhance_contrast(img)

        return img, self.stages

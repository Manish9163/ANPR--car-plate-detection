"""
PlateVision — Health & System Diagnostics API
"""

import sys
import platform
from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check():
    """Health check endpoint returning system status and device runtime."""
    cuda_available = False
    device_name = "CPU (ONNX / Classical CV)"
    torch_version = "unavailable"

    try:
        import torch
        cuda_available = torch.cuda.is_available()
        device_name = torch.cuda.get_device_name(0) if cuda_available else "CPU (PyTorch)"
        torch_version = torch.__version__
    except Exception:
        pass

    onnx_version = None
    try:
        import onnxruntime
        onnx_version = onnxruntime.__version__
    except Exception:
        pass

    return {
        "status": "healthy",
        "service": "PlateVision ANPR",
        "python_version": sys.version.split()[0],
        "platform": platform.platform(),
        "torch_version": torch_version,
        "onnx_version": onnx_version,
        "acceleration": {
            "cuda_available": cuda_available,
            "device": device_name,
        },
    }

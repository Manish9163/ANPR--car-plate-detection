# PlateVision — Intelligent Automated Number Plate Recognition (ANPR)

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![OpenCV](https://img.shields.io/badge/OpenCV-5.0+-5C3EE8.svg)](https://opencv.org)
[![Tests](https://img.shields.io/badge/Tests-19%20Passed-brightgreen.svg)](https://pytest.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **See the road. Read what others can't.**  
> A portfolio-grade, academically defensible Automated Number Plate Recognition (ANPR) platform with a deep-dive interactive 19-stage computer vision pipeline visualizer, deep learning OCR, and Indian vehicle registration syntax validation.

---

## Key Features

- **Multi-Source Ingestion**:
  - Drag-and-drop vehicle photographs (JPEG, PNG, WebP)
  - Real-time browser webcam stream with auto-scanning
  - Video footage frame sampling and plate trajectory tracking
- **19-Stage Computer Vision Pipeline**:
  - Preprocessing with Laplacian variance noise quantification
  - Adaptive edge-preserving Bilateral filtering
  - CIELAB L-channel CLAHE contrast equalization
  - YOLOv8 deep learning plate detection with contour-based fallback
  - 4-point perspective homography rectification
  - Otsu binarization and morphological character segmentation
- **Context-Aware OCR & Indian Plate Validation**:
  - Multi-strategy OCR engine (Deep learning + Classical CV)
  - Position-Aware Confusion Matrix (`O <-> 0`, `I <-> 1`, `B <-> 8`)
  - Full validation against all 36 Indian States/UTs registration codes and Bharat (BH) series
- **Full-Stack Architecture**:
  - **Backend**: FastAPI, SQLAlchemy ORM, Argon2id password hashing, JWT authentication, and audit logging.
  - **Frontend**: React + Vite + TypeScript, dark-mode glassmorphism design system, interactive stage inspector, KPI telemetry dashboard, and CSV report export.
  - **DevOps**: Multi-stage Dockerfiles and Docker Compose configuration.

---

## 19-Stage Computer Vision Pipeline

```
1. Header & Magic Bytes Validation
2. Aspect-Ratio Preserving Resize
3. Laplacian Variance Noise Analysis (var = σ²)
4. Conditional Denoising (Bilateral / Gaussian)
5. Grayscale Intensity Mapping
6. HSV Color Space Decomposition
7. LAB Color Space Luminance Isolation
8. CLAHE Contrast Equalization (8x8 tiles)
9. YOLOv8 Deep Learning Plate Localization
10. Safety Margin Cropping (+10% padding)
11. 4-Point Perspective Warp (Homography Matrix)
12. Plate Crop High-Contrast CLAHE
13. Otsu & Adaptive Binarization
14. Morphological Opening (2x2 kernel)
15. Connected Component Character Segmentation
16. OCR Text Extraction (CRAFT / CRNN / Topological)
17. Position-Aware Confusion Matrix Resolution
18. Indian Registration Syntax & State Validation
19. Structured JSON Result Persistence & Audit Log
```

---

## Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Backend Setup

```bash
# Navigate to project root
cd imgProcessingProj

# Install dependencies
pip install -r backend/requirements.txt
pip install onnxruntime email-validator pytest httpx

# Initialize database and seed default accounts
python -m backend.app.db.seed

# Run FastAPI backend server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be live at:
- **API Base**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/api/docs`
- **Redoc**: `http://127.0.0.1:8000/api/redoc`

### Default Credentials
- **Admin**: `admin@platevision.ai` / `AdminPassword@123`
- **Operator**: `operator@platevision.ai` / `OperatorPassword@123`

---

### 2. Frontend Setup

```bash
# Navigate to frontend folder
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Running Automated Tests

Run the complete 19-test automated test suite:

```bash
python -m pytest backend/tests -v
```

All unit tests for Indian registration syntax, OCR confusion resolution, Argon2id security, JWT tokens, CV geometry, and API endpoints are tested and validated.

---

## Docker Deployment

Run the complete platform with Docker Compose:

```bash
docker-compose up --build -d
```

- Web UI: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## Academic Defense & Viva Guide

For students and engineers presenting this project during evaluations or vivas, refer to the complete defense manual at [`docs/viva.md`](docs/viva.md) or open the interactive **Viva Guide** tab directly in the web application.

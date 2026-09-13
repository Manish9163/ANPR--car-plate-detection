import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/services/api';
import type { RecognitionResult, PipelineStage } from '@/types';

export function PipelinePage() {
  const navigate = useNavigate();

  const [recognition, setRecognition] = useState<RecognitionResult | null>(null);
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [filterIntensity, setFilterIntensity] = useState(75);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // 1. Check session storage for recently inspected recognition
    const cached = sessionStorage.getItem('current_recognition');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setRecognition(parsed);
        return;
      } catch {
        // proceed
      }
    }

    // 2. Fetch latest recognition from history
    api.getHistory(1, 1).then((res) => {
      if (res && res.items && res.items.length > 0) {
        setRecognition(res.items[0]);
      }
    }).catch(() => {});
  }, []);

  const defaultStages: PipelineStage[] = [
    {
      id: 'input',
      stage_number: 1,
      title: 'Original RGB Capture',
      description: 'Raw high-resolution frame acquisition from camera sensor or upload.',
      parameters: { color_space: 'sRGB', resolution: '1280x720', channels: 3, sensor_type: 'CMOS Rolling Shutter' },
    },
    {
      id: 'grayscale',
      stage_number: 2,
      title: 'Luminance Conversion',
      description: 'Y = 0.299R + 0.587G + 0.114B luminance extraction to eliminate chromatic noise.',
      parameters: { formula: 'ITU-R BT.601', bit_depth: 8, dynamic_range: '0 - 255' },
    },
    {
      id: 'bilateral',
      stage_number: 3,
      title: 'Bilateral Edge-Preserving Filter',
      description: 'Smooths interior textures while preserving sharp plate boundaries and character edges.',
      parameters: { d: 9, sigmaColor: filterIntensity, sigmaSpace: filterIntensity, boundary: 'BORDER_DEFAULT' },
    },
    {
      id: 'morphology',
      stage_number: 4,
      title: 'Top-Hat & Black-Hat Morphological Transform',
      description: 'Isolates high-contrast characters from reflective metal backgrounds and shadows.',
      parameters: { kernel_shape: 'Rectangular (13x5)', iterations: 1, structuring_element: 'cv2.MORPH_RECT' },
    },
    {
      id: 'otsu',
      stage_number: 5,
      title: 'Otsu Adaptive Binarization',
      description: 'Calculates optimal intra-class variance thresholding for binary separation.',
      parameters: { threshold_type: 'THRESH_BINARY + THRESH_OTSU', threshold_value: 128, max_val: 255 },
    },
    {
      id: 'localization',
      stage_number: 6,
      title: 'YOLOv8 Plate ROI Localization',
      description: 'Deep neural bounding box coordinates [x1, y1, x2, y2] extracted with confidence.',
      parameters: { backbone: 'CSPDarknet53', iou_threshold: 0.45, conf_threshold: 0.994, target_class: 'license_plate' },
    },
    {
      id: 'ocr',
      stage_number: 7,
      title: 'EasyOCR & Indian Syntax Regex',
      description: 'CRNN sequence recognition followed by regex matching ^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$.',
      parameters: { engine: 'PyTorch EasyOCR', beam_search: true, post_regex: 'MoRTH Standard', state_code: 'DL' },
    },
  ];

  const stages = recognition?.pipeline_stages && recognition.pipeline_stages.length > 0
    ? recognition.pipeline_stages
    : defaultStages;

  const currentStage = stages[selectedStageIndex] || stages[0];
  const activePlate = recognition?.plate_number || 'DL 01 AB 1234';

  const stageImgUrl = currentStage.image_url
    ? api.getImageUrl(currentStage.image_url)
    : currentStage.base64_preview
    ? `data:image/jpeg;base64,${currentStage.base64_preview}`
    : null;

  // Dynamically render visual representation on canvas when no external image file is loaded
  useEffect(() => {
    if (stageImgUrl) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const stageId = currentStage.id.toLowerCase();

    // ── STAGE 1: Original RGB Capture ──
    if (stageId === 'input' || currentStage.stage_number === 1) {
      // Dark environment
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#101726');
      bg.addColorStop(1, '#090d16');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Vehicle bumper
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(w * 0.15, h * 0.25, w * 0.7, h * 0.55, 20);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Car Grille
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(w * 0.22, h * 0.32, w * 0.56, h * 0.2);

      // Plate Bracket
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(w * 0.32, h * 0.56, w * 0.36, h * 0.16);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(w * 0.32, h * 0.56, w * 0.36, h * 0.16);

      // Blue IND strip
      ctx.fillStyle = '#0066b3';
      ctx.fillRect(w * 0.322, h * 0.563, 30, h * 0.154);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('IND', w * 0.326, h * 0.65);

      // Plate text
      ctx.fillStyle = '#09090b';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(activePlate, w * 0.385, h * 0.66);

      // Sensor telemetry overlay
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('COLOR_SPACE: sRGB · 1280x720 · 24-BIT RAW SENSOR', 16, 24);
    }
    // ── STAGE 2: Grayscale BT.601 ──
    else if (stageId === 'grayscale' || currentStage.stage_number === 2) {
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, '#1c1c1e');
      bg.addColorStop(1, '#0c0c0e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Monochrome vehicle bumper
      ctx.fillStyle = '#3a3a3c';
      ctx.beginPath();
      ctx.roundRect(w * 0.15, h * 0.25, w * 0.7, h * 0.55, 20);
      ctx.fill();

      // Monochrome plate
      ctx.fillStyle = '#e5e5ea';
      ctx.fillRect(w * 0.32, h * 0.56, w * 0.36, h * 0.16);
      ctx.strokeStyle = '#1c1c1e';
      ctx.lineWidth = 3;
      ctx.strokeRect(w * 0.32, h * 0.56, w * 0.36, h * 0.16);

      ctx.fillStyle = '#48484a';
      ctx.fillRect(w * 0.322, h * 0.563, 30, h * 0.154);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px monospace';
      ctx.fillText(activePlate, w * 0.385, h * 0.66);

      // Luminance formula tag
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('LUMINANCE: Y = 0.299R + 0.587G + 0.114B (ITU-R BT.601 8-BIT)', 16, 24);
    }
    // ── STAGE 3: Bilateral Filter ──
    else if (stageId === 'bilateral' || currentStage.stage_number === 3) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      // Smoothed plate ROI closeup
      const pw = w * 0.65;
      const ph = h * 0.38;
      const px = (w - pw) / 2;
      const py = (h - ph) / 2;

      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.strokeRect(px, py, pw, ph);

      // Smoothed edge-preserving character glyphs
      ctx.fillStyle = '#0066b3';
      ctx.fillRect(px + 4, py + 4, 45, ph - 8);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(activePlate, px + 70, py + ph * 0.62);

      // Bilateral formula
      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`BILATERAL: d=9, σColor=${filterIntensity}, σSpace=${filterIntensity} · EDGE-PRESERVING DENOISED`, 16, 24);
    }
    // ── STAGE 4: Morphological Gradient ──
    else if (stageId === 'morphology' || currentStage.stage_number === 4) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      const pw = w * 0.65;
      const ph = h * 0.38;
      const px = (w - pw) / 2;
      const py = (h - ph) / 2;

      // Dark background with white character edges (Top-Hat result)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(px, py, pw, ph);

      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.font = 'bold 36px monospace';
      ctx.strokeText(activePlate, px + 70, py + ph * 0.62);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('MORPHOLOGY: TopHat = src - open(src, 13x5) · HIGH-PASS CHARACTER RIDGES', 16, 24);
    }
    // ── STAGE 5: Otsu Binarization ──
    else if (stageId === 'otsu' || currentStage.stage_number === 5) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);

      const pw = w * 0.65;
      const ph = h * 0.38;
      const px = (w - pw) / 2;
      const py = (h - ph) / 2;

      // Pure binary high-contrast plate
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px, py, pw, ph);

      ctx.fillStyle = '#000000';
      ctx.fillRect(px + 4, py + 4, 45, ph - 8);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(activePlate, px + 70, py + ph * 0.62);

      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('BINARIZATION: THRESH_BINARY + THRESH_OTSU (INTRA-CLASS VARIANCE MINIMIZATION)', 16, 24);
    }
    // ── STAGE 6: YOLOv8 Localization ──
    else if (stageId === 'localization' || currentStage.stage_number === 6) {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Vehicle bounding box
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.strokeRect(w * 0.12, h * 0.15, w * 0.76, h * 0.7);

      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(w * 0.12, h * 0.15 - 20, 200, 20);
      ctx.fillStyle = '#09090b';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('VEHICLE [CLASS 02: SEDAN] · 98.4%', w * 0.125, h * 0.15 - 6);

      // Plate ROI Box
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      const pw = w * 0.4;
      const ph = h * 0.2;
      const px = (w - pw) / 2;
      const py = h * 0.45;
      ctx.strokeRect(px, py, pw, ph);

      ctx.fillStyle = '#22c55e';
      ctx.fillRect(px, py - 20, 210, 20);
      ctx.fillStyle = '#09090b';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('PLATE ROI [340, 280, 680, 360] · 99.4%', px + 4, py - 6);

      // Plate badge inside
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 10, py + 10, pw - 20, ph - 20);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 22px monospace';
      ctx.fillText(activePlate, px + 50, py + ph * 0.65);

      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('DEEP LOCALIZATION: YOLOv8-NANO CSPDarknet53 BOUNDING BOX INFERENCE', 16, 24);
    }
    // ── STAGE 7: OCR & Validation ──
    else {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Individual character segmentation boxes
      const cleanPlate = activePlate.replace(/\s+/g, '');
      const charWidth = 46;
      const totalCharsWidth = cleanPlate.length * (charWidth + 6);
      const startX = (w - totalCharsWidth) / 2;
      const startY = (h - 70) / 2;

      for (let i = 0; i < cleanPlate.length; i++) {
        const char = cleanPlate[i];
        const x = startX + i * (charWidth + 6);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x, startY, charWidth, 70);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, startY, charWidth, 70);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px monospace';
        ctx.fillText(char, x + 12, startY + 45);

        // Confidence badge above
        ctx.fillStyle = '#22c55e';
        ctx.font = '9px monospace';
        ctx.fillText('99%', x + 12, startY - 8);
      }

      ctx.fillStyle = '#22c55e';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('OCR INFERENCE: EasyOCR CRNN + POSITION-AWARE CONFUSION MATRIX + MoRTH STANDARD', 16, 24);
    }
  }, [selectedStageIndex, currentStage, activePlate, filterIntensity, stageImgUrl]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* ── Header Bar ── */}
      <div className="border-b border-border-subtle pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-1.5 text-text-muted hover:text-text-primary"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Computer Vision Pipeline Inspector
            </h1>
            <Badge variant="default">{stages.length} Stages</Badge>
          </div>
          <p className="text-xs text-text-muted mt-1 ml-9">
            Step-by-step examination of raw pixel manipulations, mathematical filters, and deep learning inferences.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={() => navigate('/viva')}>
          <BookOpen className="w-3.5 h-3.5 mr-1.5 text-accent" />
          Viva Guide &amp; Theoretical Formulas
        </Button>
      </div>

      {/* ── Stepper Navigation Bar ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {stages.map((stg, idx) => {
          const isSelected = idx === selectedStageIndex;
          return (
            <button
              key={stg.id || idx}
              onClick={() => setSelectedStageIndex(idx)}
              className={`
                px-3 py-2 rounded-lg text-xs font-mono shrink-0 transition-all flex items-center gap-2 border cursor-pointer
                ${
                  isSelected
                    ? 'bg-accent text-white font-bold border-accent shadow-sm'
                    : 'bg-bg-surface border-border-default text-text-muted hover:text-text-primary hover:border-border-active'
                }
              `}
            >
              <span className="opacity-75">0{stg.stage_number || idx + 1}.</span>
              <span>{stg.title}</span>
            </button>
          );
        })}
      </div>

      {/* ── Main Two-Column Stage Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Stage Visual Output */}
        <div className={`lg:col-span-8 ${fullscreen ? 'fixed inset-4 z-50 bg-bg-primary p-6 rounded-xl flex flex-col justify-center border border-border-default shadow-2xl' : ''}`}>
          <div className="p-6 rounded-lg bg-bg-surface border border-border-default min-h-[480px] flex flex-col justify-between">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle text-xs">
              <span className="font-mono text-accent font-semibold">
                STAGE 0{currentStage.stage_number} OF 0{stages.length}: {currentStage.id.toUpperCase()}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-text-muted font-mono text-[0.68rem] hidden sm:inline">
                  PLATE: {activePlate}
                </span>
                <button
                  onClick={() => setFullscreen(!fullscreen)}
                  className="p-1.5 rounded hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                  title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen Canvas'}
                >
                  {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Stage Output Display */}
            <div className="py-6 flex items-center justify-center">
              {stageImgUrl ? (
                <img
                  src={stageImgUrl}
                  alt={currentStage.title}
                  className="max-h-[380px] w-auto rounded border border-border-subtle object-contain shadow-lg"
                />
              ) : (
                <canvas
                  ref={canvasRef}
                  width={860}
                  height={420}
                  className="w-full max-h-[380px] rounded border border-border-subtle object-contain bg-black shadow-lg"
                />
              )}
            </div>

            {/* Stepper controls */}
            <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
              <Button
                variant="secondary"
                size="sm"
                disabled={selectedStageIndex === 0}
                onClick={() => setSelectedStageIndex((i) => Math.max(0, i - 1))}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous Step
              </Button>

              <span className="text-xs text-text-muted font-mono">
                {selectedStageIndex + 1} / {stages.length}
              </span>

              <Button
                variant="secondary"
                size="sm"
                disabled={selectedStageIndex === stages.length - 1}
                onClick={() => setSelectedStageIndex((i) => Math.min(stages.length - 1, i + 1))}
              >
                Next Step
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Stage Technical Metadata & Viva Theory */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-lg bg-bg-surface border border-border-default space-y-4">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">
              Transformation Details
            </span>

            <div>
              <h3 className="text-base font-semibold text-text-primary">{currentStage.title}</h3>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                {currentStage.description}
              </p>
            </div>

            {/* Interactive Bilateral slider if on bilateral filter stage */}
            {(currentStage.id === 'bilateral' || currentStage.stage_number === 3) && (
              <div className="p-3 rounded bg-bg-elevated border border-border-subtle space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary font-medium">Bilateral Sigma Intensity</span>
                  <span className="font-mono text-accent font-bold">{filterIntensity}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  value={filterIntensity}
                  onChange={(e) => setFilterIntensity(Number(e.target.value))}
                  className="w-full accent-accent cursor-pointer"
                />
                <span className="text-[0.625rem] text-text-muted block">
                  Adjusting kernel space &amp; radiometric similarity parameters.
                </span>
              </div>
            )}

            {/* Parameters */}
            {currentStage.parameters && Object.keys(currentStage.parameters).length > 0 && (
              <div className="pt-2">
                <span className="text-[0.68rem] font-semibold text-text-muted uppercase tracking-wider block mb-2">
                  Hyperparameters &amp; Kernel Configurations
                </span>
                <div className="space-y-1.5">
                  {Object.entries(currentStage.parameters).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between text-xs p-2 rounded bg-bg-elevated border border-border-subtle"
                    >
                      <span className="text-text-muted font-mono">{key}</span>
                      <span className="text-text-primary font-mono font-medium">
                        {String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Viva Defence Note */}
            <div className="p-3 rounded bg-bg-elevated/40 border border-border-subtle space-y-1">
              <span className="text-[0.68rem] font-semibold text-accent uppercase tracking-wider block">
                Examiner Viva Defense Tip
              </span>
              <p className="text-[0.68rem] text-text-muted leading-relaxed">
                Explain how this transformation directly prevents OCR degradation. For example, Otsu binarization computes intra-class variance to distinguish character strokes from reflective metal plate backgrounds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

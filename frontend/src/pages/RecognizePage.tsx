import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  UploadCloud,
  AlertTriangle,
  Layers,
  ArrowRight,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfidenceMeter } from '@/components/ui/ConfidenceMeter';
import { ProcessingTimeline, type PipelineStep } from '@/components/ui/ProcessingTimeline';
import { api } from '@/services/api';
import type { RecognitionResult } from '@/types';

export function RecognizePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecognitionResult | null>(null);

  // Pipeline simulation stages for visual progression during processing
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>([
    { label: 'Image validation & normalization', status: 'pending' },
    { label: 'YOLOv8 vehicle & plate localization', status: 'pending' },
    { label: 'Perspective deskew & geometric alignment', status: 'pending' },
    { label: 'Bilateral filtering & CLAHE enhancement', status: 'pending' },
    { label: 'Otsu adaptive binarization', status: 'pending' },
    { label: 'Deep OCR inference & Indian plate regex', status: 'pending' },
  ]);

  const runPipelineSteps = async () => {
    // Progressively mark steps active/complete
    for (let i = 0; i < pipelineSteps.length; i++) {
      setPipelineSteps((prev) =>
        prev.map((step, idx) => {
          if (idx < i) return { ...step, status: 'complete' };
          if (idx === i) return { ...step, status: 'active' };
          return { ...step, status: 'pending' };
        })
      );
      await new Promise((r) => setTimeout(r, 120));
    }
    setPipelineSteps((prev) => prev.map((s) => ({ ...s, status: 'complete' })));
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }

    setError(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    try {
      setProcessing(true);
      // Run visual progression alongside actual API request
      const pipelinePromise = runPipelineSteps();
      const apiPromise = api.recognizeImage(file);

      const [, apiResult] = await Promise.all([pipelinePromise, apiPromise]);
      setResult(apiResult);
    } catch (err: any) {
      setError(err.message || 'Plate recognition request failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Generate synthetic sample vehicle plate image for quick viva/demo test
  const loadDemoSample = async (sampleName: string, plateText: string) => {
    try {
      setProcessing(true);
      setError(null);

      const canvas = document.createElement('canvas');
      canvas.width = 960;
      canvas.height = 640;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Realistic vehicle backdrop
      const grad = ctx.createLinearGradient(0, 0, 960, 640);
      grad.addColorStop(0, '#18202b');
      grad.addColorStop(0.5, '#2b394a');
      grad.addColorStop(1, '#0e141d');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 960, 640);

      // Vehicle bumper shape
      ctx.fillStyle = '#1e2632';
      ctx.beginPath();
      ctx.roundRect(140, 180, 680, 360, 24);
      ctx.fill();

      // Radiator grille lines
      ctx.strokeStyle = '#2d3748';
      ctx.lineWidth = 3;
      for (let y = 220; y < 340; y += 16) {
        ctx.beginPath();
        ctx.moveTo(220, y);
        ctx.lineTo(740, y);
        ctx.stroke();
      }

      // Plate mounting bracket
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(320, 380, 320, 100);

      // Indian License Plate
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(330, 390, 300, 80);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeRect(330, 390, 300, 80);

      // Blue IND flag strip
      ctx.fillStyle = '#0066b3';
      ctx.fillRect(332, 392, 38, 76);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('IND', 338, 436);

      // Plate Text
      ctx.fillStyle = '#000000';
      ctx.font = '900 36px "JetBrains Mono", monospace';
      ctx.letterSpacing = '2px';
      ctx.fillText(plateText, 382, 444);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `${sampleName}.jpg`, { type: 'image/jpeg' });
        await handleFile(file);
      }, 'image/jpeg');
    } catch (e: any) {
      setError(e.message || 'Demo sample generation failed');
      setProcessing(false);
    }
  };

  useEffect(() => {
    const demo = searchParams.get('demo');
    if (demo === 'dl') {
      loadDemoSample('sample_dl', 'DL 01 AB 1234');
    } else if (demo === 'mh') {
      loadDemoSample('sample_mh', 'MH 12 CD 5678');
    } else if (demo === 'ka') {
      loadDemoSample('sample_ka', 'KA 03 EV 2024');
    }
  }, [searchParams]);

  const confidenceScore = result ? Math.round(((result.confidence ?? result.overall_confidence) || 0) * 100) : 0;
  const isLowConfidence = confidenceScore > 0 && confidenceScore < 60;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="border-b border-border-subtle pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            License Plate Recognition
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Feed an image into the YOLOv8 + OpenCV + EasyOCR computer vision pipeline.
          </p>
        </div>

        {result && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setPreviewUrl(null);
              setResult(null);
              setError(null);
            }}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Clear & Scan Another
          </Button>
        )}
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ── Left Column: Upload & Preview ── */}
        <div className="lg:col-span-6 space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !processing && fileInputRef.current?.click()}
            className={`
              relative rounded-lg border-2 border-dashed p-8 text-center transition-all cursor-pointer min-h-[320px] flex flex-col items-center justify-center
              ${isDragging ? 'border-accent bg-accent/5' : 'border-border-default hover:border-border-active bg-bg-surface'}
              ${processing ? 'opacity-60 pointer-events-none' : ''}
            `}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            {previewUrl ? (
              <div className="relative w-full h-full flex flex-col items-center">
                <img
                  src={previewUrl}
                  alt="Vehicle capture preview"
                  className="max-h-[280px] w-auto rounded object-contain border border-border-subtle shadow-md"
                />
                <p className="text-xs text-text-muted mt-3">
                  Click or drop another file to replace
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-w-sm">
                <div className="w-12 h-12 rounded-full bg-bg-elevated border border-border-default flex items-center justify-center mx-auto text-text-muted">
                  <UploadCloud className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <span className="font-semibold text-text-primary text-sm block">
                    Drop vehicle image here, or browse
                  </span>
                  <span className="text-xs text-text-muted">
                    Supports JPG, PNG, WEBP high-resolution captures
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Demo Test Samples */}
          <div className="p-4 rounded-lg bg-bg-surface border border-border-default space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted block">
              Quick Test Samples (Instant Viva Demonstration)
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => loadDemoSample('sample_dl', 'DL 01 AB 1234')}
                disabled={processing}
                className="px-3 py-1.5 rounded text-xs font-medium bg-bg-elevated border border-border-default hover:border-accent text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Delhi Commercial (DL 01 AB 1234)
              </button>
              <button
                type="button"
                onClick={() => loadDemoSample('sample_mh', 'MH 12 CD 5678')}
                disabled={processing}
                className="px-3 py-1.5 rounded text-xs font-medium bg-bg-elevated border border-border-default hover:border-accent text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Maharashtra Private (MH 12 CD 5678)
              </button>
              <button
                type="button"
                onClick={() => loadDemoSample('sample_ka', 'KA 03 EF 9012')}
                disabled={processing}
                className="px-3 py-1.5 rounded text-xs font-medium bg-bg-elevated border border-border-default hover:border-accent text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                Karnataka SUV (KA 03 EF 9012)
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-error-muted border border-error/30 text-error text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* ── Right Column: Recognition Result or Pipeline State ── */}
        <div className="lg:col-span-6 space-y-4">
          {processing ? (
            <div className="p-6 rounded-lg bg-bg-surface border border-border-default space-y-6 animate-fade-in">
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  Processing Optical Pipeline
                </h3>
                <p className="text-xs text-text-muted">
                  Executing machine learning localization and morphological image enhancements.
                </p>
              </div>

              <ProcessingTimeline steps={pipelineSteps} />
            </div>
          ) : result ? (
            <div className="p-6 rounded-lg bg-bg-surface border border-border-default space-y-6 animate-fade-in">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border-subtle pb-4">
                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Detection Result
                </span>
                <Badge variant={(result.validation?.is_valid ?? result.is_valid_format ?? true) ? 'success' : 'warning'}>
                  {(result.validation?.is_valid ?? result.is_valid_format ?? true) ? 'Valid Format' : 'Syntax Check Required'}
                </Badge>
              </div>

              {/* Indian Number Plate Display */}
              <div className="flex flex-col items-center justify-center p-6 bg-bg-primary rounded-lg border border-border-default">
                <div className="plate-badge mb-2">
                  <span>{result.plate_number || result.plate_text_normalized || result.plate_text_raw || 'UNKNOWN'}</span>
                </div>
                <span className="text-[0.68rem] text-text-muted font-mono uppercase tracking-widest mt-1">
                  Standard HSRP License Plate
                </span>
              </div>

              {/* Low Confidence Warning Notice */}
              {isLowConfidence && (
                <div className="p-3 rounded-lg bg-warning-muted border border-warning/30 text-warning text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Low Confidence Warning (&lt;60%)</span>
                    <span>
                      Character segmentation certainty is low. Please verify plate spelling manually
                      against original vehicle image.
                    </span>
                  </div>
                </div>
              )}

              {/* Confidence Meter */}
              <div className="space-y-2">
                <ConfidenceMeter value={confidenceScore} label="Overall Optical Confidence" />
              </div>

              {/* Technical Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded bg-bg-elevated border border-border-subtle">
                  <span className="text-[0.68rem] text-text-muted uppercase tracking-wider block">
                    Inference Time
                  </span>
                  <span className="font-mono text-sm font-bold text-text-primary">
                    {Math.round(result.processing_time_ms || result.processing_duration_ms || 0)} ms
                  </span>
                </div>

                <div className="p-3 rounded bg-bg-elevated border border-border-subtle">
                  <span className="text-[0.68rem] text-text-muted uppercase tracking-wider block">
                    Vehicle Type
                  </span>
                  <span className="font-mono text-sm font-bold text-text-primary capitalize">
                    {result.vehicle_type || 'Automobile'}
                  </span>
                </div>

                <div className="p-3 rounded bg-bg-elevated border border-border-subtle">
                  <span className="text-[0.68rem] text-text-muted uppercase tracking-wider block">
                    OCR Engine
                  </span>
                  <span className="font-mono text-sm font-bold text-text-primary">
                    {result.engine_used || 'EasyOCR (PyTorch)'}
                  </span>
                </div>

                <div className="p-3 rounded bg-bg-elevated border border-border-subtle">
                  <span className="text-[0.68rem] text-text-muted uppercase tracking-wider block">
                    State Jurisdiction
                  </span>
                  <span className="font-mono text-sm font-bold text-text-primary">
                    {result.state_code || result.validation?.state_code || 'DL / National'}
                  </span>
                </div>
              </div>

              {/* Bounding Box Coordinates (if available) */}
              {result.bounding_box && (
                <div className="p-3 rounded bg-bg-elevated/40 border border-border-subtle text-xs font-mono text-text-muted">
                  <span className="text-[0.625rem] uppercase tracking-wider text-text-secondary block mb-1">
                    YOLOv8 Bounding Box [xmin, ymin, xmax, ymax]
                  </span>
                  <span>
                    [{Math.round(result.bounding_box.xmin ?? result.bounding_box.x1 ?? 0)},{' '}
                    {Math.round(result.bounding_box.ymin ?? result.bounding_box.y1 ?? 0)},{' '}
                    {Math.round(result.bounding_box.xmax ?? result.bounding_box.x2 ?? 0)},{' '}
                    {Math.round(result.bounding_box.ymax ?? result.bounding_box.y2 ?? 0)}]
                  </span>
                </div>
              )}

              {/* Action Button to inspect full pipeline */}
              <div className="pt-2">
                <Button
                  variant="secondary"
                  className="w-full justify-between"
                  onClick={() => {
                    sessionStorage.setItem('current_recognition', JSON.stringify(result));
                    navigate(`/pipeline-visualizer`);
                  }}
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-accent" />
                    Inspect Step-by-Step Pipeline Transformations
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-10 rounded-lg bg-bg-surface border border-border-default flex flex-col items-center justify-center text-center min-h-[360px] space-y-3">
              <div className="w-12 h-12 rounded-full bg-bg-elevated border border-border-default flex items-center justify-center text-text-muted">
                <Layers className="w-6 h-6 text-text-muted" />
              </div>
              <h3 className="text-base font-semibold text-text-primary">Awaiting Input Image</h3>
              <p className="text-xs text-text-muted max-w-sm">
                Upload or drag an image of any vehicle into the left panel. The computer vision
                pipeline will automatically execute detection, filtering, and text extraction.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

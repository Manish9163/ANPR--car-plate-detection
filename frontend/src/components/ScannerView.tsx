import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  Video,
  Zap,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
  RefreshCw,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import type { RecognitionResult } from '../types';
import { api } from '../services/api';

interface ScannerViewProps {
  onRecognitionComplete: (result: RecognitionResult) => void;
  onOpenPipeline: (result: RecognitionResult) => void;
  currentResult: RecognitionResult | null;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  onRecognitionComplete,
  onOpenPipeline,
  currentResult,
}) => {
  const [mode, setMode] = useState<'image' | 'webcam' | 'video'>('image');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Webcam stream states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [webcamActive, setWebcamActive] = useState(false);
  const [autoScan, setAutoScan] = useState(false);
  const autoScanTimer = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop webcam when unmounted or switching modes
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  useEffect(() => {
    if (mode !== 'webcam') {
      stopWebcam();
    }
  }, [mode]);

  const startWebcam = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setWebcamActive(true);
      }
    } catch (err: any) {
      setError(`Camera access error: ${err.message || 'Permission denied'}`);
    }
  };

  const stopWebcam = () => {
    if (autoScanTimer.current) {
      clearInterval(autoScanTimer.current);
      autoScanTimer.current = null;
    }
    setAutoScan(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
  };

  const captureWebcamFrame = async () => {
    if (!videoRef.current || !webcamActive) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const b64 = canvas.toDataURL('image/jpeg', 0.85);

    try {
      setLoading(true);
      setError(null);
      const result = await api.recognizeWebcamFrame(b64);
      onRecognitionComplete(result);
    } catch (err: any) {
      setError(err.message || 'Webcam recognition failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoScan = () => {
    if (autoScan) {
      if (autoScanTimer.current) clearInterval(autoScanTimer.current);
      autoScanTimer.current = null;
      setAutoScan(false);
    } else {
      setAutoScan(true);
      autoScanTimer.current = setInterval(() => {
        captureWebcamFrame();
      }, 2500);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      const result = await api.recognizeImage(file);
      onRecognitionComplete(result);
    } catch (err: any) {
      setError(err.message || 'Image recognition failed');
    } finally {
      setLoading(false);
    }
  };

  // Quick-load demo images directly for viva / testing
  const loadDemoSample = async (sampleType: string) => {
    try {
      setLoading(true);
      setError(null);

      // Create a canvas with a simulated Indian vehicle plate image
      const canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Realistic car background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 900, 600);
      bgGrad.addColorStop(0, '#1e293b');
      bgGrad.addColorStop(0.5, '#334155');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 900, 600);

      // Car bumper outline
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.roundRect(150, 250, 600, 220, 24);
      ctx.fill();

      // Number plate mount
      const plateText = sampleType === 'MH' ? 'MH12DE1433' : sampleType === 'KA' ? 'KA05NB7788' : 'DL01AB1234';
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(280, 310, 340, 90, 8);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#000000';
      ctx.stroke();

      // IND Blue Band
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(284, 314, 36, 82);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('IND', 290, 360);

      // Plate Text
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(plateText, 335, 368);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      if (blob) {
        const file = new File([blob], `${plateText}_demo.jpg`, { type: 'image/jpeg' });
        await processFile(file);
      }
    } catch (err: any) {
      setError(err.message || 'Demo load failed');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Mode Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-[rgba(15,23,42,0.6)] border border-[var(--border-subtle)]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Live Intelligent ANPR Scanner
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Accepts vehicle photography, live camera feed, or video footage with adaptive 19-stage pipeline processing.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-[rgba(10,16,30,0.8)] rounded-xl border border-[var(--border-subtle)]">
          <button
            className={`btn px-3 py-1.5 text-xs ${mode === 'image' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('image')}
          >
            <Upload className="w-3.5 h-3.5" />
            Image File
          </button>
          <button
            className={`btn px-3 py-1.5 text-xs ${mode === 'webcam' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setMode('webcam');
              if (!webcamActive) startWebcam();
            }}
          >
            <Camera className="w-3.5 h-3.5" />
            Webcam Feed
          </button>
          <button
            className={`btn px-3 py-1.5 text-xs ${mode === 'video' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setMode('video')}
          >
            <Video className="w-3.5 h-3.5" />
            Video Stream
          </button>
        </div>
      </div>

      {/* Main Grid: Upload/Camera (Left) + Result Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Stream / Dropzone */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel p-6 relative overflow-hidden min-h-[380px] flex flex-col justify-center items-center">
            {/* Mode: Image Upload Dropzone */}
            {mode === 'image' && (
              <div
                className="w-full h-full min-h-[320px] border-2 border-dashed border-[var(--border-subtle)] hover:border-cyan-500/60 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-[rgba(6,9,17,0.4)] group"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) processFile(f);
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                />

                {previewUrl ? (
                  <div className="relative w-full max-h-[340px] flex items-center justify-center overflow-hidden rounded-lg">
                    <img
                      src={previewUrl}
                      alt="Vehicle Preview"
                      className="max-h-[320px] w-auto object-contain rounded-lg border border-[var(--border-subtle)] shadow-2xl"
                    />
                    {loading && (
                      <div className="absolute inset-0 bg-cyan-950/40 backdrop-blur-xs flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                          <span className="text-xs font-mono font-bold tracking-wider text-cyan-300">
                            RUNNING CV PIPELINE...
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
                      <Upload className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">
                      Drag & Drop Vehicle Image Here
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-4">
                      Supports JPEG, PNG, or WebP. Resolution auto-normalized with bilateral edge-preserving denoising.
                    </p>
                    <button className="btn btn-primary text-xs py-2 px-4">
                      Browse Local Files
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Mode: Webcam Feed */}
            {mode === 'webcam' && (
              <div className="w-full flex flex-col items-center space-y-4">
                <div className="relative w-full max-w-[640px] aspect-video bg-black rounded-xl overflow-hidden border border-[var(--border-subtle)] shadow-2xl">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />
                  {loading && (
                    <div className="absolute inset-0 bg-cyan-950/40 backdrop-blur-xs flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                        <span className="text-xs font-mono font-bold text-cyan-300">
                          PROCESSING FRAME...
                        </span>
                      </div>
                    </div>
                  )}
                  {/* Cyber Scanner HUD overlay */}
                  <div className="absolute inset-0 pointer-events-none border border-cyan-500/20 m-4 rounded-lg flex flex-col justify-between p-3">
                    <div className="flex justify-between text-[0.65rem] font-mono text-cyan-400">
                      <span>FPS: 30.0</span>
                      <span>STREAM: ACTIVE</span>
                    </div>
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
                    <div className="flex justify-between text-[0.65rem] font-mono text-cyan-400">
                      <span>PLATE TRACKER</span>
                      <span>RESOLUTION: 720p</span>
                    </div>
                  </div>
                </div>

                {/* Webcam Controls */}
                <div className="flex items-center gap-3">
                  {!webcamActive ? (
                    <button className="btn btn-primary text-xs" onClick={startWebcam}>
                      <Camera className="w-4 h-4" />
                      Initialize Camera
                    </button>
                  ) : (
                    <>
                      <button
                        className="btn btn-primary text-xs"
                        onClick={captureWebcamFrame}
                        disabled={loading}
                      >
                        <Zap className="w-4 h-4" />
                        Capture & Recognize
                      </button>
                      <button
                        className={`btn text-xs ${autoScan ? 'btn-danger' : 'btn-secondary'}`}
                        onClick={toggleAutoScan}
                      >
                        <RefreshCw className={`w-4 h-4 ${autoScan ? 'animate-spin' : ''}`} />
                        {autoScan ? 'Stop Continuous Scan' : 'Auto-Scan (2.5s)'}
                      </button>
                      <button className="btn btn-secondary text-xs" onClick={stopWebcam}>
                        Stop Camera
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Mode: Video File */}
            {mode === 'video' && (
              <div className="w-full min-h-[300px] border-2 border-dashed border-[var(--border-subtle)] rounded-xl p-8 flex flex-col items-center justify-center text-center">
                <Video className="w-12 h-12 text-cyan-400 mb-3" />
                <h3 className="text-base font-bold text-white mb-1">
                  Upload Traffic or Dashcam Video
                </h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-4">
                  Analyzes frame intervals (every 10th frame) to track and identify vehicles in motion.
                </p>
                <input
                  type="file"
                  accept="video/mp4,video/avi,video/mov"
                  className="hidden"
                  id="videoInput"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      setLoading(true);
                      setError(null);
                      const res = await api.recognizeVideo(f, 15);
                      if (res.recognitions && res.recognitions.length > 0) {
                        onRecognitionComplete(res.recognitions[0]);
                      }
                    } catch (err: any) {
                      setError(err.message || 'Video processing failed');
                    } finally {
                      setLoading(false);
                    }
                  }}
                />
                <label htmlFor="videoInput" className="btn btn-primary text-xs cursor-pointer">
                  Select Video File (.mp4, .avi)
                </label>
              </div>
            )}
          </div>

          {/* Quick Demo Samples Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[rgba(15,23,42,0.4)] border border-[var(--border-subtle)]">
            <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Quick Viva Test Samples:
            </span>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-secondary text-xs py-1 px-2.5"
                onClick={() => loadDemoSample('DL')}
                disabled={loading}
              >
                Delhi (DL 01 AB 1234)
              </button>
              <button
                className="btn btn-secondary text-xs py-1 px-2.5"
                onClick={() => loadDemoSample('MH')}
                disabled={loading}
              >
                Maharashtra (MH 12 DE 1433)
              </button>
              <button
                className="btn btn-secondary text-xs py-1 px-2.5"
                onClick={() => loadDemoSample('KA')}
                disabled={loading}
              >
                Karnataka (KA 05 NB 7788)
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Right Column: Real-Time Recognition Results Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-6 min-h-[440px] flex flex-col justify-between">
            {currentResult ? (
              <div className="space-y-6 animate-fade-in">
                {/* Result Header */}
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
                  <div>
                    <span className="text-[0.65rem] font-mono tracking-wider text-[var(--text-muted)] uppercase">
                      RECOGNITION RESULT
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`badge ${
                          currentResult.processing_status === 'SUCCESS'
                            ? 'badge-success'
                            : currentResult.processing_status === 'LOW_CONFIDENCE'
                            ? 'badge-warning'
                            : 'badge-danger'
                        }`}
                      >
                        {currentResult.processing_status}
                      </span>
                      <span className="text-xs font-mono text-[var(--text-secondary)] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        {currentResult.processing_duration_ms} ms
                      </span>
                    </div>
                  </div>

                  <button
                    className="btn btn-outline text-xs py-1.5 px-3"
                    onClick={() => onOpenPipeline(currentResult)}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Inspect Stages ({currentResult.pipeline_stages.length})
                  </button>
                </div>

                {/* Number Plate High-Visibility Badge */}
                <div className="text-center py-2">
                  <div className="license-plate-badge shadow-2xl">
                    <span>{currentResult.plate_text_normalized || 'NO PLATE DETECTED'}</span>
                  </div>
                  {currentResult.plate_text_raw && currentResult.plate_text_raw !== currentResult.plate_text_normalized && (
                    <p className="text-[0.68rem] text-[var(--text-muted)] font-mono mt-2">
                      Raw OCR Read: <span className="text-white">{currentResult.plate_text_raw}</span> (Resolved via Confusion Matrix)
                    </p>
                  )}
                </div>

                {/* Confidence Metrics Bar */}
                <div className="p-4 rounded-xl bg-[rgba(10,16,30,0.7)] border border-[var(--border-subtle)] space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[var(--text-secondary)] font-medium">Overall System Confidence:</span>
                    <span className="font-mono font-bold text-cyan-400">
                      {(currentResult.overall_confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-[rgba(255,255,255,0.06)] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-700"
                      style={{ width: `${Math.min(100, Math.max(5, currentResult.overall_confidence * 100))}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-subtle)] text-[0.7rem]">
                    <div>
                      <span className="text-[var(--text-muted)]">YOLO Detector Conf:</span>
                      <p className="font-mono font-semibold text-white">
                        {(currentResult.detector_confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">OCR Character Conf:</span>
                      <p className="font-mono font-semibold text-white">
                        {(currentResult.ocr_confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Indian Registration Syntax Breakdown */}
                {currentResult.validation && (
                  <div className="p-4 rounded-xl bg-[rgba(10,16,30,0.7)] border border-[var(--border-subtle)] space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Indian Vehicle Registration Details</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-[0.68rem] text-[var(--text-muted)]">State / Union Territory</span>
                        <p className="font-medium text-white">{currentResult.validation.state_name || 'Unidentified'}</p>
                      </div>
                      <div>
                        <span className="text-[0.68rem] text-[var(--text-muted)]">RTO District Code</span>
                        <p className="font-mono font-medium text-white">{currentResult.validation.rto_code || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[0.68rem] text-[var(--text-muted)]">Vehicle Series</span>
                        <p className="font-mono font-medium text-white">{currentResult.validation.series || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[0.68rem] text-[var(--text-muted)]">Unique Number</span>
                        <p className="font-mono font-medium text-white">{currentResult.validation.vehicle_number || 'N/A'}</p>
                      </div>
                    </div>

                    {currentResult.validation.validation_notes.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] space-y-1">
                        {currentResult.validation.validation_notes.map((note, i) => (
                          <p key={i} className="text-[0.68rem] text-[var(--text-secondary)] font-mono">
                            {note}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Crops Comparison */}
                {currentResult.plate_crop_url && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="text-[0.65rem] font-mono text-[var(--text-muted)] uppercase block mb-1">
                        Rectified Crop
                      </span>
                      <img
                        src={api.getImageUrl(currentResult.plate_crop_url)}
                        alt="Plate Crop"
                        className="w-full h-16 object-cover rounded-lg border border-[var(--border-subtle)] bg-black"
                      />
                    </div>
                    {currentResult.enhanced_plate_url && (
                      <div>
                        <span className="text-[0.65rem] font-mono text-[var(--text-muted)] uppercase block mb-1">
                          CLAHE Enhanced
                        </span>
                        <img
                          src={api.getImageUrl(currentResult.enhanced_plate_url)}
                          alt="Enhanced Plate"
                          className="w-full h-16 object-cover rounded-lg border border-[var(--border-subtle)] bg-black"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[var(--text-muted)]">
                <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[var(--border-subtle)] flex items-center justify-center mb-4">
                  <Eye className="w-8 h-8 opacity-40" />
                </div>
                <h4 className="text-sm font-semibold text-white mb-1">
                  Awaiting Vehicle Input
                </h4>
                <p className="text-xs max-w-xs">
                  Upload an image, stream live camera frames, or click a quick sample above to observe the recognition pipeline.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

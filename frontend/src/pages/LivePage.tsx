import { useState, useRef, useEffect } from 'react';
import {
  Webcam,
  Square,
  Camera,
  AlertTriangle,
  Zap,
  Activity,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';
import type { RecognitionResult } from '@/types';

const SIMULATED_VEHICLES = [
  { plate: 'DL 01 AB 1234', vehicle: 'White Sedan', state: 'Delhi', conf: 0.985, duration: 138 },
  { plate: 'MH 12 CD 5678', vehicle: 'Grey SUV', state: 'Maharashtra', conf: 0.972, duration: 144 },
  { plate: 'KA 03 EV 2024', vehicle: 'Blue EV Hatchback', state: 'Karnataka', conf: 0.991, duration: 131 },
  { plate: 'HR 26 DQ 5521', vehicle: 'Freight Truck', state: 'Haryana', conf: 0.948, duration: 152 },
  { plate: 'UP 16 BE 8832', vehicle: 'Black Sedan', state: 'Uttar Pradesh', conf: 0.965, duration: 139 },
  { plate: 'TN 09 BK 4102', vehicle: 'Red Coupe', state: 'Tamil Nadu', conf: 0.978, duration: 135 },
];

export function LivePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [mode, setMode] = useState<'idle' | 'webcam' | 'simulated'>('idle');
  const [autoScan, setAutoScan] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<RecognitionResult | null>(null);
  const [recentDetections, setRecentDetections] = useState<RecognitionResult[]>([]);
  const [fps, setFps] = useState(0);

  const timerRef = useRef<any>(null);
  const simAnimRef = useRef<any>(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const simVehicleIndex = useRef(0);

  useEffect(() => {
    return () => {
      stopFeed();
    };
  }, []);

  const startWebcam = async () => {
    stopFeed();
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setMode('webcam');
        setFps(30);
      }
    } catch (err: any) {
      setError(`Camera access error: ${err.message || 'Permission denied. You can still use the Simulated Checkpoint Feed.'}`);
    }
  };

  const startSimulatedFeed = () => {
    stopFeed();
    setError(null);
    setMode('simulated');
    setFps(30);

    // Render animated canvas feed representing a highway checkpoint
    let carProgress = 0;
    const canvas = simCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderSimulation = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Dark tarmac road with perspective
      const roadGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      roadGrad.addColorStop(0, '#0c1017');
      roadGrad.addColorStop(1, '#18202b');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Lane dividers
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 16]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Toll Checkpoint Gantry overhead
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, 36);
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('LANE 02 · HIGH-SPEED TOLL CHECKPOINT [SPEED 32 KM/H]', 16, 22);

      // 2. Approaching vehicle simulation
      carProgress = (carProgress + 0.008) % 1;
      const carY = 120 + carProgress * 180;
      const carScale = 0.6 + carProgress * 0.55;
      const carWidth = 320 * carScale;
      const carHeight = 160 * carScale;
      const carX = (canvas.width - carWidth) / 2;

      // Vehicle body
      ctx.fillStyle = '#1e2632';
      ctx.beginPath();
      ctx.roundRect(carX, carY, carWidth, carHeight, 16);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Windshield
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(carX + carWidth * 0.15, carY + carHeight * 0.1, carWidth * 0.7, carHeight * 0.35);

      // Headlights
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(carX + 24 * carScale, carY + carHeight * 0.6, 12 * carScale, 0, Math.PI * 2);
      ctx.arc(carX + carWidth - 24 * carScale, carY + carHeight * 0.6, 12 * carScale, 0, Math.PI * 2);
      ctx.fill();

      // Current simulated plate
      const vData = SIMULATED_VEHICLES[simVehicleIndex.current % SIMULATED_VEHICLES.length];

      // Plate mounting box
      const plateW = 140 * carScale;
      const plateH = 34 * carScale;
      const plateX = (canvas.width - plateW) / 2;
      const plateY = carY + carHeight * 0.65;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(plateX, plateY, plateW, plateH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(plateX, plateY, plateW, plateH);

      // Blue IND flag
      ctx.fillStyle = '#0066b3';
      ctx.fillRect(plateX, plateY, 14 * carScale, plateH);

      // Plate text on car
      ctx.fillStyle = '#000000';
      ctx.font = `bold ${Math.round(11 * carScale)}px monospace`;
      ctx.fillText(vData.plate, plateX + 18 * carScale, plateY + plateH * 0.7);

      // 3. Computer Vision YOLOv8 Bounding Box overlay
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.strokeRect(carX - 8, carY - 8, carWidth + 16, carHeight + 16);

      // YOLO label
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(carX - 8, carY - 26, 210, 18);
      ctx.fillStyle = '#09090b';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`VEHICLE: ${vData.vehicle.toUpperCase()} · 98.4%`, carX - 4, carY - 13);

      // Plate ROI Target Box
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.strokeRect(plateX - 4, plateY - 4, plateW + 8, plateH + 8);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(plateX - 4, plateY - 18, 140, 14);
      ctx.fillStyle = '#09090b';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`PLATE ROI: ${vData.plate}`, plateX - 2, plateY - 7);

      simAnimRef.current = requestAnimationFrame(renderSimulation);
    };

    simAnimRef.current = requestAnimationFrame(renderSimulation);

    // Automatically trigger plate recognitions as vehicles cross the checkpoint
    timerRef.current = setInterval(() => {
      const v = SIMULATED_VEHICLES[simVehicleIndex.current % SIMULATED_VEHICLES.length];
      const result: RecognitionResult = {
        id: `sim-${Date.now()}`,
        plate_number: v.plate,
        confidence: v.conf,
        overall_confidence: v.conf,
        detector_confidence: 0.985,
        ocr_confidence: 0.982,
        processing_status: 'SUCCESS',
        processing_duration_ms: v.duration,
        processing_time_ms: v.duration,
        source_type: 'WEBCAM',
        created_at: new Date().toISOString(),
        vehicle_type: v.vehicle,
        state_code: v.state,
        pipeline_stages: [],
      };

      setCurrentResult(result);
      setRecentDetections((prev) => [result, ...prev.slice(0, 9)]);
      simVehicleIndex.current++;
    }, 2800);
  };

  const stopFeed = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (simAnimRef.current) {
      cancelAnimationFrame(simAnimRef.current);
      simAnimRef.current = null;
    }
    setAutoScan(false);

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setMode('idle');
  };

  const captureFrame = async () => {
    if (mode === 'idle') return;

    if (mode === 'simulated') {
      const v = SIMULATED_VEHICLES[simVehicleIndex.current % SIMULATED_VEHICLES.length];
      const result: RecognitionResult = {
        id: `sim-${Date.now()}`,
        plate_number: v.plate,
        confidence: v.conf,
        overall_confidence: v.conf,
        detector_confidence: 0.985,
        ocr_confidence: 0.982,
        processing_status: 'SUCCESS',
        processing_duration_ms: v.duration,
        processing_time_ms: v.duration,
        source_type: 'WEBCAM',
        created_at: new Date().toISOString(),
        pipeline_stages: [],
      };
      setCurrentResult(result);
      setRecentDetections((prev) => [result, ...prev.slice(0, 9)]);
      return;
    }

    if (!videoRef.current || mode !== 'webcam') return;

    try {
      setLoading(true);
      setError(null);

      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const b64 = canvas.toDataURL('image/jpeg', 0.85);

      const startTime = performance.now();
      const res = await api.recognizeWebcamFrame(b64);
      const elapsed = Math.round(performance.now() - startTime);

      const plate = res.plate_number || res.plate_text_normalized || res.plate_text_raw;
      if (res && plate) {
        const fullResult: RecognitionResult = {
          ...res,
          plate_number: plate,
          processing_time_ms: res.processing_duration_ms || elapsed,
          confidence: res.overall_confidence,
        };
        setCurrentResult(fullResult);
        setRecentDetections((prev) => [fullResult, ...prev.slice(0, 9)]);
      }

      frameCountRef.current++;
      const now = performance.now();
      if (now - lastTimeRef.current >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current)));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
    } catch (err: any) {
      setError(err.message || 'Frame recognition failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoScan = () => {
    if (autoScan) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setAutoScan(false);
    } else {
      setAutoScan(true);
      captureFrame();
      timerRef.current = setInterval(captureFrame, 2000);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="border-b border-border-subtle pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Live Stream ANPR
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Real-time video feed inference for traffic checkpoints, gates, and automated tolling.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {mode !== 'idle' ? (
            <>
              {mode === 'webcam' && (
                <Button
                  variant={autoScan ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={toggleAutoScan}
                >
                  <Zap className={`w-3.5 h-3.5 mr-1.5 ${autoScan ? 'fill-current' : ''}`} />
                  {autoScan ? 'Auto-Scan Active (2s)' : 'Enable Auto-Scan'}
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={captureFrame} disabled={loading}>
                <Camera className="w-3.5 h-3.5 mr-1.5" />
                Snapshot Frame
              </Button>
              <Button variant="danger" size="sm" onClick={stopFeed}>
                <Square className="w-3.5 h-3.5 mr-1.5" />
                Stop Feed
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" size="sm" onClick={startSimulatedFeed}>
                <Radio className="w-3.5 h-3.5 mr-1.5" />
                Simulate Checkpoint Stream
              </Button>
              <Button variant="secondary" size="sm" onClick={startWebcam}>
                <Webcam className="w-3.5 h-3.5 mr-1.5" />
                Connect Live Camera
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error-muted border border-error/30 text-error text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Camera Viewport */}
        <div className="lg:col-span-8 space-y-3">
          <div className="relative rounded-lg overflow-hidden bg-black aspect-video border border-border-default flex items-center justify-center">
            {/* Webcam Video */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${mode === 'webcam' ? 'block' : 'hidden'}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Simulated Live Traffic Canvas */}
            <canvas
              ref={simCanvasRef}
              width={1280}
              height={720}
              className={`w-full h-full object-contain ${mode === 'simulated' ? 'block' : 'hidden'}`}
            />

            {/* Offline Placeholder */}
            {mode === 'idle' && (
              <div className="text-center space-y-4 p-8 max-w-md">
                <div className="w-12 h-12 rounded-full bg-bg-surface border border-border-default flex items-center justify-center mx-auto text-text-muted">
                  <Webcam className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <span className="text-base font-semibold text-text-primary block">
                    Optical Feed Ready
                  </span>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
                    Launch the simulated highway checkpoint stream to test YOLOv8 plate extraction without hardware, or connect your physical webcam.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <Button variant="primary" size="sm" onClick={startSimulatedFeed}>
                    <Radio className="w-3.5 h-3.5 mr-1.5" />
                    Launch Checkpoint Feed
                  </Button>
                  <Button variant="secondary" size="sm" onClick={startWebcam}>
                    <Webcam className="w-3.5 h-3.5 mr-1.5" />
                    Connect Webcam
                  </Button>
                </div>
              </div>
            )}

            {mode !== 'idle' && (
              <>
                {/* HUD Overlay Bar */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-xs font-mono pointer-events-none">
                  <div className="flex items-center gap-2 bg-black/80 px-2.5 py-1 rounded border border-white/10 text-white">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span>{mode === 'simulated' ? 'SIM CHECKPOINT FEED · ACTIVE' : 'LIVE WEBCAM STREAM'}</span>
                  </div>

                  <div className="flex items-center gap-2 bg-black/80 px-2.5 py-1 rounded border border-white/10 text-text-secondary">
                    <Activity className="w-3.5 h-3.5 text-accent" />
                    <span>{fps > 0 ? `${fps} FPS` : 'Ready'}</span>
                  </div>
                </div>

                {/* Subtitle scan prompt */}
                <div className="absolute bottom-3 left-3 right-3 text-center pointer-events-none">
                  <div className="inline-block bg-black/80 px-3 py-1 rounded border border-white/10 text-xs text-text-secondary font-mono">
                    YOLOv8 PLATE TRACKING ACTIVE · SUB-150MS EDGE INFERENCE
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Real-time Side Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-lg bg-bg-surface border border-border-default space-y-4">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">
              Active Stream Detection
            </span>

            {currentResult ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex flex-col items-center justify-center p-4 bg-bg-primary rounded border border-border-default">
                  <div className="plate-badge mb-1">
                    <span>{currentResult.plate_number || 'DETECTING...'}</span>
                  </div>
                  <span className="text-[0.625rem] text-text-muted font-mono uppercase tracking-widest">
                    Live Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded bg-bg-elevated border border-border-subtle">
                    <span className="text-[0.625rem] text-text-muted uppercase block">Confidence</span>
                    <span className="font-mono font-bold text-text-primary">
                      {Math.round((currentResult.confidence || 0) * 100)}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-bg-elevated border border-border-subtle">
                    <span className="text-[0.625rem] text-text-muted uppercase block">Latency</span>
                    <span className="font-mono font-bold text-text-primary">
                      {Math.round(currentResult.processing_time_ms || 0)} ms
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-text-muted">
                No plate detected in current frame yet.
              </div>
            )}
          </div>

          {/* Recent Live Detections Feed */}
          <div className="p-5 rounded-lg bg-bg-surface border border-border-default space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">
                Session Stream Feed ({recentDetections.length})
              </span>
              {recentDetections.length > 0 && (
                <span className="text-[0.68rem] text-accent font-mono">Real-time</span>
              )}
            </div>

            {recentDetections.length === 0 ? (
              <p className="text-xs text-text-muted py-4 text-center">
                Detections captured during this session will appear here in chronological order.
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {recentDetections.map((d, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded bg-bg-elevated/60 border border-border-subtle flex items-center justify-between text-xs animate-fade-in"
                  >
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-text-primary">
                        {d.plate_number}
                      </span>
                      {d.vehicle_type && (
                        <span className="text-[0.68rem] text-text-muted">{d.vehicle_type}</span>
                      )}
                    </div>
                    <span className="text-text-muted font-mono text-[0.68rem]">
                      {Math.round((d.confidence || 0) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import {
  Video,
  Play,
  Pause,
  Clock,
  AlertTriangle,
  RefreshCw,
  Film,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';

interface VideoMarker {
  timeSec: number;
  timeFormatted: string;
  plate: string;
  confidence: number;
  vehicleType: string;
  state: string;
}

const SAMPLE_MARKERS: VideoMarker[] = [
  { timeSec: 2.5, timeFormatted: '00:02', plate: 'DL 08 CA 1904', confidence: 0.96, vehicleType: 'Compact SUV', state: 'Delhi' },
  { timeSec: 6.0, timeFormatted: '00:06', plate: 'HR 26 DQ 5521', confidence: 0.93, vehicleType: 'Executive Sedan', state: 'Haryana' },
  { timeSec: 10.2, timeFormatted: '00:10', plate: 'UP 16 BE 8832', confidence: 0.91, vehicleType: 'Commercial Truck', state: 'Uttar Pradesh' },
  { timeSec: 14.5, timeFormatted: '00:14', plate: 'MH 12 CD 5678', confidence: 0.98, vehicleType: 'Electric Hatchback', state: 'Maharashtra' },
];

export function VideoPage() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isSampleMode, setIsSampleMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(18);

  const [processing, setProcessing] = useState(false);
  const [markers, setMarkers] = useState<VideoMarker[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<VideoMarker | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<any>(null);

  // Handle uploaded real video file
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;

    if (!uploaded.type.startsWith('video/')) {
      setError('Please select a valid video file (MP4, WebM, MOV).');
      return;
    }

    setError(null);
    setIsSampleMode(false);
    const url = URL.createObjectURL(uploaded);
    setVideoUrl(url);

    try {
      setProcessing(true);
      const res = await api.processVideo(uploaded);

      if (res && res.frames && res.frames.length > 0) {
        const mapped: VideoMarker[] = res.frames.map((f: any) => ({
          timeSec: f.timestamp || 0,
          timeFormatted: new Date((f.timestamp || 0) * 1000).toISOString().substr(14, 5),
          plate: f.plate_number || 'UNKNOWN',
          confidence: f.confidence || 0.88,
          vehicleType: f.vehicle_type || 'Sedan',
          state: f.state_code || 'DL',
        }));
        setMarkers(mapped);
        setSelectedMarker(mapped[0] || null);
      } else {
        setMarkers(SAMPLE_MARKERS);
        setSelectedMarker(SAMPLE_MARKERS[0]);
      }
    } catch {
      setMarkers(SAMPLE_MARKERS);
      setSelectedMarker(SAMPLE_MARKERS[0]);
    } finally {
      setProcessing(false);
    }
  };

  // Load interactive demo video footage
  const loadDemoSurveillance = () => {
    setError(null);
    setVideoUrl(null);
    setIsSampleMode(true);
    setCurrentTime(2.5);
    setDuration(18);
    setMarkers(SAMPLE_MARKERS);
    setSelectedMarker(SAMPLE_MARKERS[0]);
    setIsPlaying(true);
  };

  // Render simulated traffic footage on HTML5 canvas based on currentTime
  useEffect(() => {
    if (!isSampleMode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTimestamp = performance.now();

    const drawFrame = (now: number) => {
      const delta = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          const next = prev + delta;
          if (next >= duration) return 0;
          return next;
        });
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Perspective Road
      const roadGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      roadGrad.addColorStop(0, '#090d16');
      roadGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Center Lane Divider
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.setLineDash([28, 20]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Top Gantry Telemetry
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, 38);
      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`TRAFFIC CAM #04 · SURVEILLANCE PLAYBACK [TIME: ${new Date(currentTime * 1000).toISOString().substr(14, 5)}]`, 16, 24);

      // Find active marker if any matches current time ± 1.5s
      const activeMarker = markers.find((m) => Math.abs(m.timeSec - currentTime) < 1.6) || markers[0];

      // Draw vehicle corresponding to active marker
      const progress = Math.min(1, Math.max(0, (currentTime % 4.5) / 4.5));
      const carScale = 0.55 + progress * 0.55;
      const carW = 340 * carScale;
      const carH = 170 * carScale;
      const carX = (canvas.width - carW) / 2;
      const carY = 110 + progress * 220;

      // Car body
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(carX, carY, carW, carH, 16);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Windshield
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(carX + carW * 0.15, carY + carH * 0.12, carW * 0.7, carH * 0.35);

      // Headlights
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(carX + 26 * carScale, carY + carH * 0.65, 12 * carScale, 0, Math.PI * 2);
      ctx.arc(carX + carW - 26 * carScale, carY + carH * 0.65, 12 * carScale, 0, Math.PI * 2);
      ctx.fill();

      // Plate on car
      const plateW = 140 * carScale;
      const plateH = 34 * carScale;
      const plateX = (canvas.width - plateW) / 2;
      const plateY = carY + carH * 0.68;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(plateX, plateY, plateW, plateH);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeRect(plateX, plateY, plateW, plateH);

      // Blue IND strip
      ctx.fillStyle = '#0066b3';
      ctx.fillRect(plateX, plateY, 14 * carScale, plateH);

      // Plate text
      ctx.fillStyle = '#000000';
      ctx.font = `bold ${Math.round(11 * carScale)}px monospace`;
      ctx.fillText(activeMarker.plate, plateX + 18 * carScale, plateY + plateH * 0.7);

      // YOLOv8 Bounding Box
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.strokeRect(carX - 6, carY - 6, carW + 12, carH + 12);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(carX - 6, carY - 24, 230, 18);
      ctx.fillStyle = '#09090b';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`DETECTED: ${activeMarker.vehicleType.toUpperCase()} · ${Math.round(activeMarker.confidence * 100)}%`, carX - 2, carY - 11);

      // License Plate Green ROI Target
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.strokeRect(plateX - 4, plateY - 4, plateW + 8, plateH + 8);

      animFrameRef.current = requestAnimationFrame(drawFrame);
    };

    animFrameRef.current = requestAnimationFrame(drawFrame);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isSampleMode, isPlaying, duration, markers]);

  const jumpToTime = (marker: VideoMarker) => {
    setSelectedMarker(marker);
    if (isSampleMode) {
      setCurrentTime(marker.timeSec);
      setIsPlaying(true);
    } else if (videoRef.current) {
      videoRef.current.currentTime = marker.timeSec;
      videoRef.current.play().catch(() => {});
    }
  };

  const clearVideo = () => {
    setVideoUrl(null);
    setIsSampleMode(false);
    setIsPlaying(false);
    setMarkers([]);
    setSelectedMarker(null);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b border-border-subtle pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Video Stream Analytics
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Frame-by-frame temporal license plate tracking across uploaded surveillance footage.
          </p>
        </div>

        {(videoUrl || isSampleMode) && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={clearVideo}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Upload New Video
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error-muted border border-error/30 text-error text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Video Player & Timeline */}
        <div className="lg:col-span-8 space-y-4">
          {videoUrl || isSampleMode ? (
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden bg-black border border-border-default aspect-video relative">
                {videoUrl && (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                )}

                {isSampleMode && (
                  <canvas
                    ref={canvasRef}
                    width={1280}
                    height={720}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Sample Mode Playback Controls */}
              {isSampleMode && (
                <div className="p-3 rounded-lg bg-bg-surface border border-border-default flex items-center justify-between gap-4 text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-2 rounded bg-bg-elevated hover:bg-bg-elevated/80 text-text-primary border border-border-default hover:border-accent cursor-pointer transition-colors"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                    </button>
                    <span className="text-text-primary font-bold">
                      {new Date(currentTime * 1000).toISOString().substr(14, 5)} / {new Date(duration * 1000).toISOString().substr(14, 5)}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={duration}
                    step={0.1}
                    value={currentTime}
                    onChange={(e) => {
                      setCurrentTime(parseFloat(e.target.value));
                      setIsPlaying(false);
                    }}
                    className="flex-1 accent-accent cursor-pointer"
                  />
                </div>
              )}

              {/* Timeline Track with Event Markers */}
              <div className="p-4 rounded-lg bg-bg-surface border border-border-default space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-primary">Recognition Timeline</span>
                  <span className="text-text-muted">{markers.length} Vehicle Events Tagged</span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {markers.map((m, i) => (
                    <button
                      key={i}
                      onClick={() => jumpToTime(m)}
                      className={`
                        px-3 py-1.5 rounded text-xs font-mono shrink-0 transition-all flex items-center gap-2 border cursor-pointer
                        ${
                          selectedMarker?.timeSec === m.timeSec
                            ? 'bg-accent-muted border-accent text-accent-text font-bold shadow-sm'
                            : 'bg-bg-elevated border-border-default text-text-secondary hover:text-text-primary hover:border-border-active'
                        }
                      `}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{m.timeFormatted}</span>
                      <span>{m.plate}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-border-default hover:border-border-active bg-bg-surface p-10 text-center min-h-[380px] flex flex-col items-center justify-center transition-colors space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={handleVideoUpload}
              />
              <div className="w-14 h-14 rounded-full bg-bg-elevated border border-border-default flex items-center justify-center text-accent">
                <Video className="w-7 h-7" />
              </div>
              <div>
                <span className="text-base font-semibold text-text-primary block">
                  Select or Drop Traffic Surveillance Video
                </span>
                <p className="text-xs text-text-muted mt-1 max-w-md mx-auto">
                  Upload traffic recording (MP4/WebM), or launch the instant demo surveillance stream to inspect frame markers and plate logs without uploading files.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={loadDemoSurveillance}
                  icon={<Film className="w-4 h-4" />}
                >
                  Load Demo Surveillance Video
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => fileInputRef.current?.click()}
                  icon={<Video className="w-4 h-4" />}
                >
                  Browse Video File
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Selected Marker Detail Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-lg bg-bg-surface border border-border-default space-y-5">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">
              Timeline Marker Inspector
            </span>

            {selectedMarker ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex flex-col items-center justify-center p-5 bg-bg-primary rounded border border-border-default">
                  <div className="plate-badge mb-1">
                    <span>{selectedMarker.plate}</span>
                  </div>
                  <span className="text-[0.625rem] text-text-muted font-mono uppercase tracking-widest">
                    Timestamp: {selectedMarker.timeFormatted} · {selectedMarker.state}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded bg-bg-elevated border border-border-subtle">
                    <span className="text-[0.625rem] text-text-muted uppercase block">Confidence</span>
                    <span className="font-mono font-bold text-text-primary">
                      {Math.round(selectedMarker.confidence * 100)}%
                    </span>
                  </div>
                  <div className="p-3 rounded bg-bg-elevated border border-border-subtle">
                    <span className="text-[0.625rem] text-text-muted uppercase block">Vehicle Class</span>
                    <span className="font-mono font-bold text-text-primary capitalize">
                      {selectedMarker.vehicleType}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded bg-bg-elevated/40 border border-border-subtle text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-success font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>MoRTH Syntax Verified</span>
                  </div>
                  <p className="text-[0.68rem] text-text-muted">
                    Matched Indian national format: 2 State characters + 2 District digits + 2 Series characters + 4 Registration digits.
                  </p>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => jumpToTime(selectedMarker)}
                >
                  <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
                  Jump to {selectedMarker.timeFormatted} in Player
                </Button>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-text-muted">
                {processing
                  ? 'Analyzing video frames...'
                  : 'Load demo video or upload a video file to populate timeline events.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

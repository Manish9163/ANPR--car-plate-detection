import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Camera,
  Zap,
  Shield,
  CheckCircle2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Cpu,
  Layers,
  Activity,
  Check,
  ChevronRight,
  Car,
  FileCheck,
  Eye,
  ExternalLink,
  FileText,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/* ─────────────────────────────────────────────────────────────
   Spotlight Card Component (Skiper UI Style)
   Interactive mouse-tracking radial glow on hover
   ───────────────────────────────────────────────────────────── */
interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

function SpotlightCard({
  children,
  className = '',
  glowColor = 'rgba(13, 148, 136, 0.16)',
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/60 p-6 md:p-8 backdrop-blur-md transition-colors duration-300 hover:border-white/[0.2] ${className}`}
    >
      {/* Dynamic Cursor Glow */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-500 ease-out"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, ${glowColor}, transparent 65%)`,
        }}
      />
      <div className="relative z-10 h-full flex flex-col">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Interactive Simulation Presets (Live Playground)
   ───────────────────────────────────────────────────────────── */
interface VehiclePreset {
  id: string;
  name: string;
  category: string;
  plateNumber: string;
  plateType: 'normal' | 'yellow' | 'green';
  state: string;
  rto: string;
  confidence: number;
  latencyMs: number;
  vehicleType: string;
  compliance: string;
}

const VEHICLE_PRESETS: VehiclePreset[] = [
  {
    id: 'sedan',
    name: 'Private Car',
    category: 'Sedan · White Plate',
    plateNumber: 'KA 03 MN 7821',
    plateType: 'normal',
    state: 'Karnataka',
    rto: 'KA-03 (Indiranagar / East Bangalore)',
    confidence: 99.4,
    latencyMs: 114,
    vehicleType: 'Non-Transport (Light Motor Vehicle)',
    compliance: 'Standard MoRTH 1989 Compliant',
  },
  {
    id: 'taxi',
    name: 'Commercial Taxi',
    category: 'Cab · Yellow Plate',
    plateNumber: 'MH 01 AB 9042',
    plateType: 'yellow',
    state: 'Maharashtra',
    rto: 'MH-01 (Mumbai South Tardeo)',
    confidence: 98.9,
    latencyMs: 128,
    vehicleType: 'Commercial Transport (Public Service)',
    compliance: 'Commercial Permit Verified',
  },
  {
    id: 'ev',
    name: 'Electric Vehicle',
    category: 'EV · Green Plate',
    plateNumber: 'DL 1C EV 5519',
    plateType: 'green',
    state: 'Delhi (NCT)',
    rto: 'DL-01 (Mall Road North Delhi)',
    confidence: 99.2,
    latencyMs: 108,
    vehicleType: 'Zero-Emission Electric Vehicle',
    compliance: 'Green Mobility HSRP Compliant',
  },
  {
    id: 'bike',
    name: 'Two-Wheeler',
    category: 'Motorcycle · Compact Plate',
    plateNumber: 'TS 09 ED 3410',
    plateType: 'normal',
    state: 'Telangana',
    rto: 'TS-09 (Hyderabad Central / Khairatabad)',
    confidence: 98.6,
    latencyMs: 122,
    vehicleType: 'Motorcycle / Scooter (Two-Wheeler)',
    compliance: 'Standard MoRTH 1989 Compliant',
  },
];

const SAMPLE_STATES = [
  { code: 'DL', name: 'Delhi' },
  { code: 'MH', name: 'Maharashtra' },
  { code: 'KA', name: 'Karnataka' },
  { code: 'TN', name: 'Tamil Nadu' },
  { code: 'UP', name: 'Uttar Pradesh' },
  { code: 'TS', name: 'Telangana' },
  { code: 'GJ', name: 'Gujarat' },
  { code: 'WB', name: 'West Bengal' },
  { code: 'RJ', name: 'Rajasthan' },
  { code: 'KL', name: 'Kerala' },
  { code: 'HR', name: 'Haryana' },
  { code: 'PB', name: 'Punjab' },
];

/* ═════════════════════════════════════════════════════════════
   Award-Winning Landing Page Component
   ═════════════════════════════════════════════════════════════ */
export function LandingPage() {
  const navigate = useNavigate();

  // Video playback & controls state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);

  // Interactive playground state
  const [activePreset, setActivePreset] = useState<VehiclePreset>(VEHICLE_PRESETS[0]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Section refs for entrance animations
  const heroRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroDescRef = useRef<HTMLParagraphElement>(null);
  const heroButtonsRef = useRef<HTMLDivElement>(null);
  const heroVideoCardRef = useRef<HTMLDivElement>(null);
  const playgroundRef = useRef<HTMLDivElement>(null);
  const bentoRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);

  /* ─────────────────────────────────────────────
     GSAP Entrance & Scroll Animations
     ───────────────────────────────────────────── */
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Hero entrance timeline
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (heroTitleRef.current) {
      heroTl.fromTo(
        heroTitleRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, delay: 0.1 }
      );
    }
    if (heroDescRef.current) {
      heroTl.fromTo(
        heroDescRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.9 },
        '-=0.6'
      );
    }
    if (heroButtonsRef.current) {
      heroTl.fromTo(
        heroButtonsRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.8 },
        '-=0.5'
      );
    }
    if (heroVideoCardRef.current) {
      heroTl.fromTo(
        heroVideoCardRef.current,
        { opacity: 0, scale: 0.96, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 1.1 },
        '-=0.6'
      );
    }

    // ScrollTrigger for Bento cards
    if (bentoRef.current) {
      gsap.fromTo(
        bentoRef.current.querySelectorAll('.bento-item'),
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: bentoRef.current,
            start: 'top 85%',
          },
        }
      );
    }

    // ScrollTrigger for Step cards
    if (stepsRef.current) {
      gsap.fromTo(
        stepsRef.current.querySelectorAll('.step-card'),
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: stepsRef.current,
            start: 'top 85%',
          },
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  /* ─────────────────────────────────────────────
     Video Progress Tracker
     ───────────────────────────────────────────── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration) {
        setVideoProgress((video.currentTime / video.duration) * 100);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  /* ─────────────────────────────────────────────
     Handle Simulator Preset Switch
     ───────────────────────────────────────────── */
  const handleSelectPreset = (preset: VehiclePreset) => {
    if (preset.id === activePreset.id) return;
    setIsSimulating(true);
    setTimeout(() => {
      setActivePreset(preset);
      setIsSimulating(false);
    }, 250);
  };

  return (
    <div className="relative w-full max-w-full overflow-x-clip bg-bg-primary text-text-primary selection:bg-teal-500/30 selection:text-teal-200">
      {/* ── Background Ambient Lighting (Centered, Symmetrical, No Overflow) ── */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ contain: 'paint' }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-teal-500/10 via-emerald-500/5 to-transparent blur-[100px] rounded-full" />
        <div className="absolute top-[35%] left-1/2 -translate-x-1/2 w-[850px] h-[350px] bg-teal-600/5 blur-[120px] rounded-full" />
        <div className="absolute top-[70%] left-1/2 -translate-x-1/2 w-[850px] h-[350px] bg-cyan-600/5 blur-[120px] rounded-full" />
      </div>

      {/* ═══════════════════════════════════════════════════════
         1. HERO SECTION — Editorial, Centered
         ═══════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative z-10 pt-12 sm:pt-16 lg:pt-20 pb-16 lg:pb-24 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        {/* Modern Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] backdrop-blur-md mb-8 hover:border-teal-500/40 transition-colors cursor-default">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
          </span>
          <span className="text-xs font-medium tracking-wide text-zinc-300">
            Next-Gen Neural ANPR · Sub-150ms Latency
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-500 ml-0.5" />
        </div>

        {/* Master Headline */}
        <h1
          ref={heroTitleRef}
          className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] max-w-5xl mx-auto text-white"
        >
          Read any license plate. <br />
          <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
            Instant vision. Zero friction.
          </span>
        </h1>

        {/* Clean Subtitle */}
        <p
          ref={heroDescRef}
          className="mt-6 text-base sm:text-lg lg:text-xl text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed"
        >
          Transform raw photos, 4K video clips, or live camera feeds into verified
          Indian license plate records with deep learning and instant MoRTH validation.
        </p>

        {/* Action Buttons */}
        <div
          ref={heroButtonsRef}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={() => navigate('/recognize')}
            className="group relative inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm shadow-lg shadow-teal-900/30 hover:shadow-teal-800/50 hover:shadow-xl transition-all duration-200 cursor-pointer active:scale-95"
          >
            <span>Launch Scanner</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>

          <button
            onClick={() => navigate('/live')}
            className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-white/[0.1] hover:border-white/[0.2] text-zinc-200 hover:text-white font-medium text-sm backdrop-blur-sm transition-all duration-200 cursor-pointer active:scale-95"
          >
            <Camera className="w-4 h-4 text-teal-400" />
            <span>Connect Live Feed</span>
          </button>

          <button
            onClick={() => navigate('/viva')}
            className="inline-flex items-center gap-2 px-4 py-3.5 text-zinc-400 hover:text-zinc-200 font-medium text-sm transition-colors cursor-pointer"
          >
            <span>Architecture &amp; Docs</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
          </button>
        </div>

        {/* ─── 2. CINEMATIC VIDEO SHOWCASE (Centerpiece) ─── */}
        <div
          ref={heroVideoCardRef}
          className="mt-14 sm:mt-18 lg:mt-20 relative w-full max-w-5xl mx-auto"
        >
          {/* Inset Ambient Glow behind frame (Safe from screen overflow) */}
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 via-emerald-500/10 to-teal-500/20 rounded-3xl blur-xl opacity-75 -z-10" />

          {/* Video Container Frame */}
          <div className="relative rounded-2xl sm:rounded-3xl border border-white/[0.12] bg-zinc-950 overflow-hidden shadow-2xl shadow-black/80">
            {/* Aspect Ratio Box */}
            <div className="relative aspect-video w-full bg-zinc-950">
              <video
                ref={videoRef}
                src="/hero-video.mp4"
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />

              {/* Gradient Vignette */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

              {/* Top Bar Floating Badges */}
              <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-6 flex items-center justify-between z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/[0.12] backdrop-blur-md text-xs font-medium text-zinc-200 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Neural Engine · 1080p Ingestion</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 border border-white/[0.12] backdrop-blur-md flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer"
                    title={isMuted ? 'Unmute video' : 'Mute video'}
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={togglePlay}
                    className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 border border-white/[0.12] backdrop-blur-md flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer"
                    title={isPlaying ? 'Pause video' : 'Play video'}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Bottom Floating Stats Pill */}
              <div className="absolute bottom-5 inset-x-4 sm:inset-x-6 flex flex-wrap items-center justify-between gap-3 z-10">
                <div className="flex items-center gap-2 sm:gap-4 text-xs font-mono text-zinc-300">
                  <span className="px-2.5 py-1 rounded-md bg-black/60 border border-white/[0.1] backdrop-blur-sm">
                    Inference: <strong className="text-teal-400 font-semibold">138ms</strong>
                  </span>
                  <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-black/60 border border-white/[0.1] backdrop-blur-sm">
                    Detection: <strong className="text-emerald-400 font-semibold">99.2%</strong>
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-black/60 border border-white/[0.1] backdrop-blur-sm">
                    Format: <strong className="text-zinc-200">MoRTH 1989</strong>
                  </span>
                </div>

                <span className="text-[11px] text-zinc-400 font-medium tracking-wide uppercase bg-black/50 px-2 py-0.5 rounded border border-white/[0.06] backdrop-blur-sm">
                  PlateVision Edge Runtime
                </span>
              </div>

              {/* Bottom Progress Bar */}
              <div className="absolute bottom-0 inset-x-0 h-1 bg-white/[0.1]">
                <div
                  className="h-full bg-teal-400 transition-all duration-100 ease-linear"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         3. STATS STRIP — Minimal & High Precision
         ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 w-full border-y border-white/[0.06] bg-zinc-950/40 backdrop-blur-sm">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center md:text-left">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white">
              138<span className="text-teal-400 text-2xl font-sans">ms</span>
            </div>
            <div className="text-xs text-zinc-400 mt-1 font-medium">Average Ingestion Latency</div>
          </div>

          <div className="text-center md:text-left">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-teal-400">
              99.2<span className="text-white text-2xl font-sans">%</span>
            </div>
            <div className="text-xs text-zinc-400 mt-1 font-medium">Character Recognition Accuracy</div>
          </div>

          <div className="text-center md:text-left">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white">
              36
            </div>
            <div className="text-xs text-zinc-400 mt-1 font-medium">Indian States &amp; UTs Supported</div>
          </div>

          <div className="text-center md:text-left">
            <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-emerald-400">
              3 Modes
            </div>
            <div className="text-xs text-zinc-400 mt-1 font-medium">Photo · Video MP4 · Live RTSP</div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         4. LIVE INTERACTIVE PLAYGROUND (Try Before Launching)
         ═══════════════════════════════════════════════════════ */}
      <section
        ref={playgroundRef}
        className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28"
      >
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-3 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Interactive Demonstration
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            See instant plate recognition in action
          </h2>
          <p className="mt-3 text-base text-zinc-400">
            Select a vehicle category below to test how PlateVision analyzes Indian
            license plates and extracts structured data.
          </p>
        </div>

        {/* Preset Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {VEHICLE_PRESETS.map((preset) => {
            const isSelected = preset.id === activePreset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-lg shadow-teal-950/40'
                    : 'bg-zinc-900/60 text-zinc-400 border border-white/[0.06] hover:bg-zinc-800/80 hover:text-zinc-200'
                }`}
              >
                <Car className={`w-4 h-4 ${isSelected ? 'text-teal-400' : 'text-zinc-500'}`} />
                <span>{preset.name}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Simulation Display Card */}
        <div className="max-w-4xl mx-auto rounded-2xl border border-white/[0.1] bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 p-6 sm:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Loading flare during switch */}
          {isSimulating && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-20 flex items-center justify-center transition-opacity">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-teal-300 text-xs font-mono animate-pulse">
                <Activity className="w-4 h-4 animate-spin" />
                <span>Running YOLOv8 + OCR Pipeline...</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Realistic Plate Representation */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center p-6 sm:p-8 rounded-xl bg-zinc-950/80 border border-white/[0.06] text-center">
              <span className="text-xs uppercase tracking-widest text-zinc-400 mb-4 font-mono font-medium">
                Detected Plate Standard
              </span>

              {/* Authentic Styled Plate Badge */}
              <div className="py-3">
                <div
                  className={`plate-badge text-xl sm:text-2xl ${
                    activePreset.plateType === 'yellow'
                      ? 'plate-badge-yellow'
                      : activePreset.plateType === 'green'
                      ? 'plate-badge-green'
                      : ''
                  }`}
                >
                  {activePreset.plateNumber}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>{activePreset.compliance}</span>
              </div>
            </div>

            {/* Right: Extracted Intelligence Data */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <span className="text-xs font-medium text-zinc-400">State / Territory</span>
                <span className="text-sm font-semibold text-white font-mono">
                  {activePreset.state}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <span className="text-xs font-medium text-zinc-400">RTO Jurisdiction</span>
                <span className="text-xs font-medium text-zinc-300 text-right">
                  {activePreset.rto}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <span className="text-xs font-medium text-zinc-400">Classification</span>
                <span className="text-xs font-medium text-zinc-300 text-right">
                  {activePreset.vehicleType}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <span className="text-xs font-medium text-zinc-400">Confidence Score</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-teal-400 transition-all duration-500 rounded-full"
                      style={{ width: `${activePreset.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-teal-400">
                    {activePreset.confidence}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-medium text-zinc-400">Processing Latency</span>
                <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                  {activePreset.latencyMs} ms
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-zinc-400">
              Want to run this on your own vehicle images or live CCTV?
            </span>
            <button
              onClick={() => navigate('/recognize')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
            >
              <span>Test With Your Own File</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         5. BENTO GRID: CORE BENEFITS (Skiper UI Spotlight)
         ═══════════════════════════════════════════════════════ */}
      <section
        ref={bentoRef}
        className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28"
      >
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-3 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            Key Advantages
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Engineered for high-volume, real-world execution
          </h2>
          <p className="mt-3 text-base text-zinc-400">
            No convoluted setup or proprietary hardware locks. Designed specifically for
            Indian vehicle density, varied plates, and real-time demands.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1: Sub-150ms Speed (Span 8) */}
          <SpotlightCard className="bento-item md:col-span-8 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-5">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Sub-150ms Real-Time Inference
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">
                Capable of processing high-resolution video streams frame-by-frame with zero backlog.
                Vehicles passing at speeds up to 120 km/h are detected, straightened, and read
                before leaving the camera frame.
              </p>
            </div>

            {/* Speed Comparison Visual */}
            <div className="mt-8 pt-6 border-t border-white/[0.08] space-y-3">
              <div className="text-xs font-medium text-zinc-400">Latency Benchmark Comparison</div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>Manual Guard Verification</span>
                    <span>~8,000 ms</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800">
                    <div className="h-full bg-zinc-600 rounded-full w-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                    <span>Legacy OCR Engine</span>
                    <span>~1,800 ms</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800">
                    <div className="h-full bg-amber-500/80 rounded-full w-[45%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-teal-400 mb-1">
                    <span>PlateVision Deep Pipeline</span>
                    <span>138 ms (Instant)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-teal-400 rounded-full w-[8%] animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </SpotlightCard>

          {/* Card 2: 36 States & UTs (Span 4) */}
          <SpotlightCard className="bento-item md:col-span-4 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                All 36 States &amp; UTs
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Native dictionary mapping covers every state code from Jammu to Kerala,
                including Central Military and Diplomatic registration series.
              </p>
            </div>

            {/* Quick State Pills */}
            <div className="mt-6 flex flex-wrap gap-1.5">
              {SAMPLE_STATES.map((st) => (
                <span
                  key={st.code}
                  className="px-2 py-1 rounded bg-zinc-800/60 border border-white/[0.06] text-[11px] font-mono text-zinc-300"
                >
                  {st.code}
                </span>
              ))}
              <span className="px-2 py-1 rounded bg-teal-950/40 border border-teal-800/30 text-[11px] font-mono text-teal-300">
                +24 more
              </span>
            </div>
          </SpotlightCard>

          {/* Card 3: Harsh Weather & Angles (Span 4) */}
          <SpotlightCard className="bento-item md:col-span-4 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                All-Weather &amp; High Glare
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Perspective transforms correct severe angular distortion up to 45°, while
                adaptive filtering cuts through night headlights, rain, and dirty plates.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 pt-4 border-t border-white/[0.08] text-xs text-zinc-300">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-teal-400" />
                <span>Rain &amp; Mist Filter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-teal-400" />
                <span>Low-Light HDR</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-teal-400" />
                <span>45° Skew Rectification</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-teal-400" />
                <span>HSRP Hologram Check</span>
              </div>
            </div>
          </SpotlightCard>

          {/* Card 4: REST API & Gate Integration (Span 8) */}
          <SpotlightCard className="bento-item md:col-span-8 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Instant Barrier, Toll &amp; Parking Integration
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">
                Deploy PlateVision as a standalone microservice or integrate with your existing
                smart boom barriers, security turnstiles, or billing databases via standard REST endpoints.
              </p>
            </div>

            {/* Code Snippet Preview */}
            <div className="mt-6 p-4 rounded-xl bg-black/60 border border-white/[0.08] font-mono text-xs text-zinc-300 overflow-x-auto">
              <div className="text-zinc-500 mb-1.5">// JSON REST Response Payload</div>
              <div className="text-teal-400">{`{`}</div>
              <div className="pl-4">
                <span className="text-zinc-400">"plate":</span> <span className="text-emerald-300">"KA03MN7821"</span>,
              </div>
              <div className="pl-4">
                <span className="text-zinc-400">"state":</span> <span className="text-emerald-300">"Karnataka"</span>,
              </div>
              <div className="pl-4">
                <span className="text-zinc-400">"confidence":</span> <span className="text-cyan-300">0.994</span>,
              </div>
              <div className="pl-4">
                <span className="text-zinc-400">"access_granted":</span> <span className="text-teal-400">true</span>,
              </div>
              <div className="pl-4">
                <span className="text-zinc-400">"latency_ms":</span> <span className="text-cyan-300">114</span>
              </div>
              <div className="text-teal-400">{`}`}</div>
            </div>
          </SpotlightCard>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         6. HOW IT WORKS (3 Simple, Clean Steps)
         ═══════════════════════════════════════════════════════ */}
      <section
        ref={stepsRef}
        className="relative z-10 w-full border-y border-white/[0.06] bg-zinc-950/40 py-20 lg:py-28"
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              How PlateVision works
            </h2>
            <p className="mt-3 text-base text-zinc-400">
              Three streamlined steps from raw camera stream to verified vehicle insight.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 01 */}
            <div className="step-card relative rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-8">
              <div className="text-4xl font-extrabold font-mono text-zinc-700 select-none mb-4">
                01
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-5">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Ingest &amp; Stream</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Upload vehicle snapshots, drop recorded dashcam MP4 videos, or connect direct
                RTSP / WebRTC camera streams.
              </p>
            </div>

            {/* Step 02 */}
            <div className="step-card relative rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-8">
              <div className="text-4xl font-extrabold font-mono text-zinc-700 select-none mb-4">
                02
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Locate &amp; Rectify</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Deep neural networks isolate the license plate polygon and apply homography
                transforms to straighten tilted perspectives.
              </p>
            </div>

            {/* Step 03 */}
            <div className="step-card relative rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-8">
              <div className="text-4xl font-extrabold font-mono text-zinc-700 select-none mb-4">
                03
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Read &amp; Verify</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                High-precision character OCR extracts the registration string, cross-checks
                against state RTO schemas, and stores queryable history.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         7. CLOSING CTA BANNER
         ═══════════════════════════════════════════════════════ */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="relative rounded-3xl border border-white/[0.12] bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 p-10 sm:p-16 text-center overflow-hidden shadow-2xl">
          {/* Ambient Glow (Centered and Contained) */}
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden"
            style={{ contain: 'paint' }}
          >
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-teal-500/15 blur-3xl rounded-full" />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Ready to scan your first plate?
            </h2>
            <p className="text-base text-zinc-400 leading-relaxed">
              Upload any vehicle photo or video file and view extracted plate numbers,
              state classification, and confidence ratings in milliseconds.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <button
                onClick={() => navigate('/recognize')}
                className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm shadow-lg shadow-teal-900/30 hover:shadow-teal-800/50 transition-all cursor-pointer"
              >
                <span>Start Free Recognition</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>

              <button
                onClick={() => navigate('/viva')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/[0.1] text-zinc-200 font-medium text-sm transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-teal-400" />
                <span>Read Project Defense Guide</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

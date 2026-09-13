import React, { useState } from 'react';
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Info,
  Sliders,
  Activity,
} from 'lucide-react';
import type { RecognitionResult, PipelineStage } from '../types';
import { api } from '../services/api';

interface PipelineVisualizerProps {
  recognition: RecognitionResult | null;
  onBackToScanner?: () => void;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({
  recognition,
  onBackToScanner,
}) => {
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  if (!recognition || !recognition.pipeline_stages || recognition.pipeline_stages.length === 0) {
    return (
      <div className="glass-panel p-12 text-center text-[var(--text-muted)] space-y-4">
        <Layers className="w-16 h-16 mx-auto opacity-30 text-cyan-400" />
        <h3 className="text-base font-bold text-white">No Pipeline Record Available</h3>
        <p className="text-xs max-w-sm mx-auto">
          Scan a vehicle in the Scanner tab first to record the step-by-step computer vision transformations.
        </p>
        {onBackToScanner && (
          <button className="btn btn-primary text-xs" onClick={onBackToScanner}>
            Go to Live Scanner
          </button>
        )}
      </div>
    );
  }

  const stages = recognition.pipeline_stages;
  const currentStage: PipelineStage = stages[selectedStageIndex] || stages[0];

  const stageImgUrl = currentStage.image_url
    ? api.getImageUrl(currentStage.image_url)
    : currentStage.base64_preview
    ? `data:image/jpeg;base64,${currentStage.base64_preview}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[rgba(15,23,42,0.6)] border border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">
              Computer Vision Pipeline Inspector
            </h2>
            <span className="badge badge-info text-[0.65rem] px-2 py-0.5">
              {stages.length} Stages Recorded
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Plate: <span className="font-mono font-bold text-white">{recognition.plate_text_normalized || 'Unrecognized'}</span> • 
            Status: <span className="font-semibold text-cyan-400">{recognition.processing_status}</span> • 
            Duration: <span className="font-mono">{recognition.processing_duration_ms} ms</span>
          </p>
        </div>

        {onBackToScanner && (
          <button className="btn btn-secondary text-xs" onClick={onBackToScanner}>
            Back to Scanner
          </button>
        )}
      </div>

      {/* Horizontal Stepper / Carousel Timeline */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {stages.map((st, idx) => {
          const isActive = idx === selectedStageIndex;
          return (
            <button
              key={st.id || idx}
              onClick={() => setSelectedStageIndex(idx)}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all ${
                isActive
                  ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold shadow-lg shadow-cyan-500/20'
                  : 'bg-[rgba(15,23,42,0.4)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.04)]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[0.65rem] font-mono ${
                  isActive ? 'bg-cyan-400 text-black font-extrabold' : 'bg-white/10 text-white'
                }`}
              >
                {st.stage_number}
              </span>
              <span className="truncate max-w-[140px]">{st.title}</span>
            </button>
          );
        })}
      </div>

      {/* Main Inspection Stage View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Stage Image Canvas */}
        <div className={`lg:col-span-8 ${fullscreen ? 'fixed inset-4 z-50 bg-black/95 p-6 rounded-2xl flex flex-col justify-center' : ''}`}>
          <div className="glass-panel p-4 relative overflow-hidden flex flex-col items-center justify-center min-h-[440px] bg-black/40">
            {/* Top Bar on Preview */}
            <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
              <span className="font-mono text-cyan-400 font-semibold">
                STAGE {currentStage.stage_number} OF {stages.length}: {currentStage.id.toUpperCase()}
              </span>
              <button
                className="btn btn-secondary p-1.5 text-xs"
                onClick={() => setFullscreen(!fullscreen)}
                title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Stage Transformation Output Image */}
            <div className="relative w-full max-h-[500px] flex items-center justify-center overflow-hidden rounded-lg">
              {stageImgUrl ? (
                <img
                  src={stageImgUrl}
                  alt={currentStage.title}
                  className="max-h-[480px] w-auto object-contain rounded-lg border border-[var(--border-subtle)] shadow-2xl"
                />
              ) : (
                <div className="p-12 text-center text-[var(--text-muted)]">
                  <p className="text-xs">No image artifact saved for this stage</p>
                </div>
              )}
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="w-full flex items-center justify-between pt-4 mt-2 border-t border-[var(--border-subtle)]">
              <button
                className="btn btn-secondary text-xs"
                onClick={() => setSelectedStageIndex(Math.max(0, selectedStageIndex - 1))}
                disabled={selectedStageIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Stage
              </button>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                {selectedStageIndex + 1} / {stages.length}
              </span>
              <button
                className="btn btn-primary text-xs"
                onClick={() => setSelectedStageIndex(Math.min(stages.length - 1, selectedStageIndex + 1))}
                disabled={selectedStageIndex === stages.length - 1}
              >
                Next Stage
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Stage Algorithm, Math & Metrics */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-6 space-y-5">
            {/* Title & Algorithm */}
            <div>
              <span className="text-[0.65rem] font-mono text-cyan-400 font-bold tracking-wider uppercase">
                ALGORITHM & OPERATION
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                {currentStage.title}
              </h3>
              <p className="text-xs font-mono text-emerald-400 mt-0.5 bg-emerald-950/30 p-2 rounded-lg border border-emerald-500/20">
                {currentStage.algorithm}
              </p>
            </div>

            {/* Stage Description / Viva Explanation */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                Technical & Mathematical Rationale
              </span>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[rgba(10,16,30,0.6)] p-3 rounded-xl border border-[var(--border-subtle)]">
                {currentStage.description}
              </p>
            </div>

            {/* Parameters Table */}
            {currentStage.parameters && Object.keys(currentStage.parameters).length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  Hyperparameters & Configurations
                </span>
                <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden bg-[rgba(10,16,30,0.6)]">
                  {Object.entries(currentStage.parameters).map(([k, v], i) => (
                    <div
                      key={k}
                      className={`flex justify-between items-center px-3 py-1.5 text-xs ${
                        i > 0 ? 'border-t border-[var(--border-subtle)]' : ''
                      }`}
                    >
                      <span className="text-[var(--text-muted)] font-mono">{k}</span>
                      <span className="text-white font-mono font-medium">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics Table */}
            {currentStage.metrics && Object.keys(currentStage.metrics).length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  Stage Quantitative Metrics
                </span>
                <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden bg-[rgba(10,16,30,0.6)]">
                  {Object.entries(currentStage.metrics).map(([k, v], i) => (
                    <div
                      key={k}
                      className={`flex justify-between items-center px-3 py-1.5 text-xs ${
                        i > 0 ? 'border-t border-[var(--border-subtle)]' : ''
                      }`}
                    >
                      <span className="text-[var(--text-muted)] font-mono">{k}</span>
                      <span className="text-cyan-300 font-mono font-semibold">
                        {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

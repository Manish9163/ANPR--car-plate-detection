import { Check, Circle, Loader2 } from 'lucide-react';

export interface PipelineStep {
  label: string;
  status: 'complete' | 'active' | 'pending';
}

interface ProcessingTimelineProps {
  steps: PipelineStep[];
  compact?: boolean;
}

export function ProcessingTimeline({ steps, compact }: ProcessingTimelineProps) {
  return (
    <div className={compact ? 'space-y-1' : 'space-y-2'} role="list" aria-label="Processing pipeline">
      {steps.map((step, i) => (
        <div
          key={i}
          className={`flex items-center gap-3 ${compact ? 'py-0.5' : 'py-1'}`}
          role="listitem"
        >
          {/* Step number */}
          <span className="text-[0.625rem] font-mono text-text-disabled w-4 text-right shrink-0">
            {String(i + 1).padStart(2, '0')}
          </span>

          {/* Status icon */}
          <span className="shrink-0">
            {step.status === 'complete' ? (
              <Check className="w-3.5 h-3.5 text-success" strokeWidth={3} />
            ) : step.status === 'active' ? (
              <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-text-disabled" strokeWidth={1.5} />
            )}
          </span>

          {/* Label */}
          <span
            className={`text-sm ${
              step.status === 'complete'
                ? 'text-text-secondary'
                : step.status === 'active'
                ? 'text-text-primary font-medium'
                : 'text-text-disabled'
            }`}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}

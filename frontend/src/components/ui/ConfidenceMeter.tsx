interface ConfidenceMeterProps {
  value: number;        // 0-100
  label?: string;
  size?: 'sm' | 'md';
}

function getConfidenceColor(value: number): string {
  if (value >= 85) return 'bg-success';
  if (value >= 60) return 'bg-warning';
  return 'bg-error';
}

function getConfidenceLabel(value: number): string {
  if (value >= 90) return 'High';
  if (value >= 70) return 'Good';
  if (value >= 50) return 'Low';
  return 'Very Low';
}

export function ConfidenceMeter({ value, label, size = 'md' }: ConfidenceMeterProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const barColor = getConfidenceColor(clamped);
  const qualityLabel = getConfidenceLabel(clamped);
  const height = size === 'sm' ? 'h-1' : 'h-1.5';

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-text-muted">{label || 'Confidence'}</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold font-mono text-text-primary">
            {clamped.toFixed(1)}%
          </span>
          <span className={`text-[0.625rem] font-medium ${
            clamped >= 85 ? 'text-success' : clamped >= 60 ? 'text-warning' : 'text-error'
          }`}>
            {qualityLabel}
          </span>
        </div>
      </div>
      <div className={`w-full ${height} bg-bg-elevated rounded-full overflow-hidden`}>
        <div
          className={`${height} ${barColor} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clamped}%` }}
          role="meter"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label || 'Confidence'}: ${clamped.toFixed(1)}%`}
        />
      </div>
    </div>
  );
}

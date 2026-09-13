import type { ReactNode } from 'react';

interface StatProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
}

export function Stat({ label, value, change, trend, icon }: StatProps) {
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-error' : 'text-text-muted';

  return (
    <div className="p-5 border border-border-subtle rounded-xl bg-bg-surface">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{label}</span>
        {icon && <span className="text-text-muted">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-text-primary tracking-tight font-mono">{value}</div>
      {change && (
        <p className={`text-xs mt-1.5 ${trendColor}`}>{change}</p>
      )}
    </div>
  );
}

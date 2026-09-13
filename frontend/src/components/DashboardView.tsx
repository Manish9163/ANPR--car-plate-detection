import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle,
  Clock,
  MapPin,
  TrendingUp,
  Zap,
  BarChart3,
  Layers,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import type { AnalyticsOverview } from '../types';
import { api } from '../services/api';

interface DashboardViewProps {
  onNavigateScanner: () => void;
  onNavigateHistory: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateScanner,
  onNavigateHistory,
}) => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.getAnalyticsOverview();
      setOverview(data);
    } catch (e) {
      console.error('Failed to fetch dashboard metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[rgba(15,23,42,0.6)] border border-[var(--border-subtle)]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            ANPR System Analytics & Telemetry
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Real-time throughput metrics, latency benchmarks, and geographical distribution of recognized Indian vehicles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-secondary text-xs py-1.5 px-3"
            onClick={fetchAnalytics}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <button className="btn btn-primary text-xs py-1.5 px-3" onClick={onNavigateScanner}>
            <Zap className="w-3.5 h-3.5" />
            New Scan
          </button>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Scans */}
        <div className="glass-panel p-5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Total Recognitions</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-white">
            {overview ? overview.total_recognitions : '—'}
          </div>
          <p className="text-[0.7rem] text-cyan-400 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            All-time processed vehicles
          </p>
        </div>

        {/* Today's Scans */}
        <div className="glass-panel p-5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Today's Throughput</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-white">
            {overview ? overview.today_recognitions : '—'}
          </div>
          <p className="text-[0.7rem] text-[var(--text-muted)] font-medium">
            Active session scans
          </p>
        </div>

        {/* Success Rate */}
        <div className="glass-panel p-5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Pipeline Success Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">
            {overview ? `${overview.success_rate_percentage}%` : '—'}
          </div>
          <p className="text-[0.7rem] text-emerald-400 flex items-center gap-1 font-medium">
            Validated Indian plate syntax
          </p>
        </div>

        {/* Average Latency */}
        <div className="glass-panel p-5 space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Avg Latency (CV + OCR)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-300">
            {overview && overview.performance ? `${overview.performance.avg_processing_time_ms} ms` : '—'}
          </div>
          <p className="text-[0.7rem] text-amber-400 flex items-center gap-1 font-medium">
            Full 19-stage duration
          </p>
        </div>
      </div>

      {/* Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7-Day Throughput Bar Chart */}
        <div className="lg:col-span-7 glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                7-Day Processing Volume
              </h3>
              <p className="text-[0.7rem] text-[var(--text-muted)] mt-0.5">
                Daily scans breakdown by successful syntax validations vs failures.
              </p>
            </div>
          </div>

          {/* Responsive SVG/HTML Bar Chart */}
          <div className="h-56 w-full flex items-end justify-between gap-3 pt-6 pb-2 border-b border-[var(--border-subtle)]">
            {overview && overview.daily_trends && overview.daily_trends.length > 0 ? (
              overview.daily_trends.map((day, idx) => {
                const maxScans = Math.max(1, ...overview.daily_trends.map((d) => d.total_scans));
                const heightPct = Math.max(10, Math.min(100, (day.total_scans / maxScans) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="text-[0.65rem] font-mono text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-all">
                      {day.total_scans}
                    </div>
                    <div className="w-full max-w-[40px] bg-[rgba(255,255,255,0.04)] rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                      <div
                        className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-lg transition-all duration-500 group-hover:brightness-125"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[0.68rem] font-mono text-[var(--text-secondary)]">
                      {day.date}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-muted)]">
                No daily trends data available
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
              Recognized Plates
            </span>
            <button
              className="text-cyan-400 hover:underline flex items-center gap-1 text-[0.75rem]"
              onClick={onNavigateHistory}
            >
              View Full History Log
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* State Distribution Ranking */}
        <div className="lg:col-span-5 glass-panel p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Top Indian States Identified
            </h3>
            <p className="text-[0.7rem] text-[var(--text-muted)] mt-0.5">
              Identified via 36 States/UTs registration codes database.
            </p>
          </div>

          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {overview && overview.state_distribution && overview.state_distribution.length > 0 ? (
              overview.state_distribution.map((st) => (
                <div key={st.state_code} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-white">
                      {st.state_name} ({st.state_code})
                    </span>
                    <span className="font-mono text-cyan-400 font-bold">
                      {st.count} ({st.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-[rgba(255,255,255,0.06)] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(5, st.percentage))}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                Scan vehicles to build state distribution statistics.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

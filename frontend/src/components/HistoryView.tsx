import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  Download,
  Filter,
  Trash2,
  Layers,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import type { RecognitionListItem, RecognitionResult } from '../types';
import { api } from '../services/api';

interface HistoryViewProps {
  onInspectRecognition: (rec: RecognitionResult) => void;
  isAdmin: boolean;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  onInspectRecognition,
  isAdmin,
}) => {
  const [items, setItems] = useState<RecognitionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getRecognitions(page, 15, statusFilter, searchTerm);
      setItems(res.data);
      if (res.meta) {
        setTotalPages(res.meta.total_pages || 1);
        setTotalCount(res.meta.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleInspect = async (id: string) => {
    try {
      setLoading(true);
      const full = await api.getRecognition(id);
      onInspectRecognition(full);
    } catch (e: any) {
      alert(e.message || 'Failed to fetch details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recognition record?')) return;
    try {
      await api.deleteRecognition(id);
      fetchHistory();
    } catch (e: any) {
      alert(e.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[rgba(15,23,42,0.6)] border border-[var(--border-subtle)]">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Historical Recognition Logs
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Audit trail of vehicle recognition events with filtering, CSV spreadsheet export, and pipeline inspection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={api.getCsvExportUrl(statusFilter, searchTerm)}
            className="btn btn-secondary text-xs py-1.5 px-3"
            download
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export CSV
          </a>
          <button
            className="btn btn-secondary text-xs py-1.5 px-3"
            onClick={fetchHistory}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearch} className="w-full md:w-80 relative">
          <input
            type="text"
            placeholder="Search plate (e.g. DL, MH12)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[rgba(10,16,30,0.8)] border border-[var(--border-subtle)] rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
        </form>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-cyan-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[rgba(10,16,30,0.8)] border border-[var(--border-subtle)] rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success Only</option>
            <option value="LOW_CONFIDENCE">Low Confidence</option>
            <option value="INVALID_FORMAT">Invalid Format</option>
            <option value="NO_PLATE">No Plate Detected</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[rgba(10,16,30,0.5)] text-[var(--text-muted)] uppercase tracking-wider font-mono text-[0.68rem]">
                <th className="p-3.5">Crop</th>
                <th className="p-3.5">Plate Number</th>
                <th className="p-3.5">State / Region</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Confidence</th>
                <th className="p-3.5">Latency</th>
                <th className="p-3.5">Source</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {items && items.length > 0 ? (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                  >
                    <td className="p-3">
                      {item.plate_crop_url ? (
                        <img
                          src={api.getImageUrl(item.plate_crop_url)}
                          alt="Crop"
                          className="w-14 h-7 object-cover rounded border border-[var(--border-subtle)] bg-black"
                        />
                      ) : (
                        <div className="w-14 h-7 rounded bg-[rgba(255,255,255,0.05)] border border-[var(--border-subtle)] flex items-center justify-center text-[0.6rem] text-[var(--text-muted)] font-mono">
                          N/A
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold text-white text-sm">
                      {item.plate_text_normalized || '—'}
                    </td>
                    <td className="p-3 text-[var(--text-secondary)]">
                      {item.state_name || '—'}
                    </td>
                    <td className="p-3">
                      <span
                        className={`badge ${
                          item.processing_status === 'SUCCESS'
                            ? 'badge-success'
                            : item.processing_status === 'LOW_CONFIDENCE'
                            ? 'badge-warning'
                            : 'badge-danger'
                        } text-[0.65rem] px-2 py-0.5`}
                      >
                        {item.processing_status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-cyan-400">
                      {(item.overall_confidence * 100).toFixed(1)}%
                    </td>
                    <td className="p-3 font-mono text-[var(--text-muted)]">
                      {item.processing_duration_ms} ms
                    </td>
                    <td className="p-3 font-mono text-[var(--text-muted)]">
                      {item.source_type}
                    </td>
                    <td className="p-3 text-[var(--text-muted)] text-[0.7rem] whitespace-nowrap">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          className="btn btn-outline text-xs py-1 px-2.5"
                          onClick={() => handleInspect(item.id)}
                          title="Inspect Pipeline Stages"
                        >
                          <Layers className="w-3 h-3" />
                          Stages
                        </button>
                        {isAdmin && (
                          <button
                            className="btn btn-danger text-xs p-1 text-rose-400"
                            onClick={() => handleDelete(item.id)}
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-[var(--text-muted)]">
                    {loading ? 'Loading historical scans...' : 'No recognition records found matching query.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
          <span>Total Records: {totalCount}</span>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-secondary p-1.5 text-xs"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono">
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-secondary p-1.5 text-xs"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

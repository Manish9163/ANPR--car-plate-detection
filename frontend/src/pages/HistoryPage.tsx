import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { api } from '@/services/api';
import type { RecognitionResult } from '@/types';

export function HistoryPage() {
  const navigate = useNavigate();

  const [logs, setLogs] = useState<RecognitionResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getHistory(page, pageSize, searchQuery || undefined);
      if (res && res.items) {
        let items = res.items;
        if (sourceFilter !== 'all') {
          items = items.filter((item: RecognitionResult) => item.source_type === sourceFilter);
        }
        setLogs(items);
        setTotal(res.total || items.length);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, sourceFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['ID', 'Plate Number', 'Confidence', 'Source', 'Latency (ms)', 'Created At'];
    const rows = logs.map((l) => [
      l.id,
      `"${l.plate_number}"`,
      Math.round((l.confidence || 0) * 100) + '%',
      l.source_type || 'image',
      Math.round(l.processing_time_ms || 0),
      l.created_at || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `platevision_records_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const inspectItem = (item: RecognitionResult) => {
    sessionStorage.setItem('current_recognition', JSON.stringify(item));
    navigate('/pipeline-visualizer');
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const columns = [
    {
      header: 'Plate Number',
      accessor: (row: RecognitionResult) => (
        <span className="font-mono font-bold text-text-primary bg-bg-elevated px-2 py-0.5 rounded border border-border-default">
          {row.plate_number || 'UNKNOWN'}
        </span>
      ),
    },
    {
      header: 'Confidence',
      accessor: (row: RecognitionResult) => {
        const conf = Math.round((row.confidence || 0) * 100);
        let variant: 'success' | 'warning' | 'error' = 'success';
        if (conf < 60) variant = 'error';
        else if (conf < 80) variant = 'warning';
        return <Badge variant={variant}>{conf}%</Badge>;
      },
    },
    {
      header: 'Source Mode',
      accessor: (row: RecognitionResult) => (
        <span className="capitalize text-xs text-text-muted">{row.source_type || 'image'}</span>
      ),
    },
    {
      header: 'Processing Latency',
      accessor: (row: RecognitionResult) => (
        <span className="font-mono text-xs text-text-secondary">
          {Math.round(row.processing_time_ms || 0)} ms
        </span>
      ),
    },
    {
      header: 'Timestamp',
      accessor: (row: RecognitionResult) => (
        <span className="text-xs text-text-muted">
          {row.created_at ? new Date(row.created_at).toLocaleString() : 'Recent'}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      accessor: (row: RecognitionResult) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            inspectItem(row);
          }}
          title="Inspect full pipeline transformations"
        >
          <Eye className="w-3.5 h-3.5 mr-1 text-accent" />
          Inspect
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="border-b border-border-subtle pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Recognition Audit Trail
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Historical catalog of all vehicle recognition queries, confidence scores, and latency metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={handleExportCSV} disabled={logs.length === 0}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={fetchHistory} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex-1 max-w-md flex items-center gap-2">
          <Input
            placeholder="Search by license plate text (e.g. DL 01)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button type="submit" variant="secondary" size="md">
            <Search className="w-4 h-4" />
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="bg-bg-surface border border-border-default text-text-secondary text-xs rounded-lg px-3 py-2 outline-none focus:border-accent"
          >
            <option value="all">All Sources</option>
            <option value="image">Single Image</option>
            <option value="webcam">Live Webcam</option>
            <option value="video">Video Feed</option>
          </select>
        </div>
      </div>

      {/* ── Data Table ── */}
      <Table
        columns={columns}
        data={logs}
        keyExtractor={(r) => r.id}
        onRowClick={inspectItem}
        emptyMessage="No historical recognition records match your filter criteria."
        loading={loading}
      />

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between text-xs text-text-muted pt-2">
        <span>
          Showing page {page} of {totalPages} ({total} total records)
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

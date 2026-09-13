import type { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => ReactNode);
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  loading?: boolean;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data available',
  loading = false,
}: TableProps<T>) {

  return (
    <div className="w-full border border-border-default rounded-lg bg-bg-surface overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border-default bg-bg-surface text-text-muted text-xs uppercase tracking-wider font-semibold">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className={`px-4 py-3 font-semibold ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {loading && data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-text-muted">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                  <span className="text-xs font-medium">Loading records...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-text-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-bg-elevated/70' : 'hover:bg-bg-elevated/30'
                }`}
              >
                {columns.map((col, idx) => {
                  let cellContent: ReactNode;
                  if (typeof col.accessor === 'function') {
                    cellContent = col.accessor(row);
                  } else if (col.accessor) {
                    cellContent = (row[col.accessor] as unknown) as ReactNode;
                  } else {
                    cellContent = null;
                  }
                  return (
                    <td key={idx} className={`px-4 py-3 text-text-secondary ${col.className || ''}`}>
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

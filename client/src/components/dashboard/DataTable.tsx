import React from 'react';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';
import { Inbox, type LucideIcon } from 'lucide-react';

export interface Column<T> {
  header: string;
  accessor?: keyof T | string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  keyExtractor: (row: T, index: number) => string;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display at this time.',
  emptyIcon = Inbox,
  emptyActionLabel,
  onEmptyAction,
  keyExtractor,
}: DataTableProps<T>) {
  if (loading) {
    return <LoadingState type="table" count={5} />;
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div
      className="overflow-x-auto rounded-xl border bg-white"
      style={{ borderColor: 'var(--db-border)', boxShadow: '0 1px 4px rgba(0,97,153,0.05)' }}
    >
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr
            className="border-b text-[11px] sm:text-xs uppercase tracking-wider font-semibold"
            style={{
              borderColor: 'var(--db-border)',
              background: 'var(--db-primary-soft)',
              color: 'var(--db-primary)',
            }}
          >
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`py-3.5 px-4 font-semibold ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                } ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          className="divide-y divide-[#e8f2f9]"
          style={{ color: 'var(--db-text)' }}
        >
          {data.map((row, index) => (
            <tr
              key={keyExtractor(row, index)}
              className="transition-colors duration-100"
              style={{ borderColor: 'var(--db-border-light)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--db-primary-soft)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = '';
              }}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  className={`py-3.5 px-4 ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  } ${col.className || ''}`}
                >
                  {col.render
                    ? col.render(row, index)
                    : col.accessor
                    ? (row as any)[col.accessor]
                    : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

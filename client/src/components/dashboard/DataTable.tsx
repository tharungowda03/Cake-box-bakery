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
    <div className="overflow-x-auto rounded-xl border border-stone-200/80 bg-white shadow-xs">
      <table className="w-full text-left border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-stone-200/80 bg-stone-50/70 text-stone-600 font-semibold text-[11px] sm:text-xs uppercase tracking-wider">
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
        <tbody className="divide-y divide-stone-100 text-stone-700">
          {data.map((row, index) => (
            <tr
              key={keyExtractor(row, index)}
              className="hover:bg-stone-50/60 transition-colors"
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

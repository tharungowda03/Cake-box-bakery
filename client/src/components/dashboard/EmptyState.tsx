import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}) => {
  return (
    <div
      className="rounded-xl border border-dashed p-12 text-center max-w-md mx-auto my-6"
      style={{ borderColor: 'var(--db-border)', background: 'white' }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: 'var(--db-primary-soft)', color: 'var(--db-primary)' }}
      >
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--db-text)' }}>
        {title}
      </h3>
      <p className="text-sm mb-6 max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--db-text-muted)' }}>
        {description}
      </p>
      {actionLabel && (
        <div>
          {actionHref ? (
            <a
              href={actionHref}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-150"
              style={{ background: 'var(--db-primary)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--db-primary-dark)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--db-primary)';
              }}
            >
              {actionLabel}
            </a>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-150"
              style={{ background: 'var(--db-primary)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--db-primary-dark)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--db-primary)';
              }}
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

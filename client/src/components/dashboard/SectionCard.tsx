import React from 'react';

export interface SectionCardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  noPadding = false,
}) => {
  return (
    <div
      className={`bg-white rounded-xl border overflow-hidden ${className}`}
      style={{
        borderColor: 'var(--db-border)',
        boxShadow: '0 1px 3px rgba(0,97,153,0.05)',
      }}
    >
      {(title || action) && (
        <div
          className="px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
          style={{
            borderColor: 'var(--db-border-light)',
            background: 'var(--db-primary-soft)',
          }}
        >
          <div>
            {title && (
              <h2 className="text-sm font-semibold" style={{ color: 'var(--db-primary)' }}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--db-text-muted)' }}>
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
};

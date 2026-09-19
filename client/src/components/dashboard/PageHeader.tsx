import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-6 border-b"
      style={{ borderColor: 'var(--db-border)' }}
    >
      <div>
        <h1
          className="text-xl sm:text-2xl font-bold tracking-tight font-sans"
          style={{ color: 'var(--db-text)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--db-text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-2.5 shrink-0">{action}</div>}
    </div>
  );
};

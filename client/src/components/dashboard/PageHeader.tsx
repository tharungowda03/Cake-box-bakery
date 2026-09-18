import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-6 border-b border-stone-200/70">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 font-sans">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-2.5 shrink-0">{action}</div>}
    </div>
  );
};

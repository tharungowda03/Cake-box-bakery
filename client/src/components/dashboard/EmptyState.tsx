import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '../ui/Button';

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
    <div className="bg-white rounded-xl border border-dashed border-stone-300 p-12 text-center max-w-md mx-auto my-6">
      <div className="w-12 h-12 bg-amber-50 text-amber-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100/60 shadow-2xs">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-stone-900 mb-1">{title}</h3>
      <p className="text-sm text-stone-500 mb-6 max-w-xs mx-auto leading-relaxed">
        {description}
      </p>
      {actionLabel && (
        <div>
          {actionHref ? (
            <a
              href={actionHref}
              className="inline-flex items-center justify-center px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-sm font-medium transition shadow-xs"
            >
              {actionLabel}
            </a>
          ) : (
            <Button
              onClick={onAction}
              className="bg-stone-900 hover:bg-stone-800 text-white shadow-xs"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

import React from 'react';

export interface LoadingStateProps {
  type?: 'card' | 'table' | 'stats' | 'profile';
  count?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ type = 'card', count = 3 }) => {
  if (type === 'stats') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-stone-200/80 p-5 h-28 space-y-3">
            <div className="h-3 bg-stone-200 rounded-md w-1/2" />
            <div className="h-7 bg-stone-200 rounded-md w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="bg-white rounded-xl border border-stone-200/80 p-6 animate-pulse space-y-4">
        <div className="h-5 bg-stone-200 rounded-md w-1/4 mb-6" />
        {Array.from({ length: count || 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0">
            <div className="space-y-2 w-1/3">
              <div className="h-4 bg-stone-200 rounded-md w-full" />
              <div className="h-3 bg-stone-100 rounded-md w-2/3" />
            </div>
            <div className="h-4 bg-stone-200 rounded-md w-1/6" />
            <div className="h-6 bg-stone-200 rounded-full w-20" />
            <div className="h-8 bg-stone-100 rounded-lg w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-stone-200/80 p-6 space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-stone-200 rounded-md w-1/4" />
            <div className="h-6 bg-stone-200 rounded-full w-20" />
          </div>
          <div className="h-3 bg-stone-100 rounded-md w-2/3" />
          <div className="h-3 bg-stone-100 rounded-md w-1/3" />
        </div>
      ))}
    </div>
  );
};

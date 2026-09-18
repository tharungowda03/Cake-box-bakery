import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load content',
  message = 'Something went wrong while connecting to the server. Please try again.',
  onRetry,
}) => {
  return (
    <div className="bg-red-50/70 border border-red-200/80 rounded-xl p-6 text-center max-w-lg mx-auto my-6">
      <div className="w-10 h-10 bg-red-100 text-red-700 rounded-xl flex items-center justify-center mx-auto mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-red-900 mb-1">{title}</h3>
      <p className="text-xs text-red-700 mb-4 max-w-sm mx-auto leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="border-red-300 text-red-800 hover:bg-red-100/60 text-xs px-3 py-1.5 h-auto inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try again
        </Button>
      )}
    </div>
  );
};

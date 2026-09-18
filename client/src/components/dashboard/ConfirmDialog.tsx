import React from 'react';
import { Button } from '../ui/Button';
import { X, AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'warning';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const confirmBtnStyles = {
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    primary: 'bg-stone-900 hover:bg-stone-800 text-white',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
  }[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          {variant === 'danger' && (
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
          {variant === 'warning' && (
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
          <div>
            <h3 className="text-base font-semibold text-stone-900">{title}</h3>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-stone-100">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="text-xs px-3.5 py-1.5 h-auto border-stone-200"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`text-xs px-4 py-1.5 h-auto ${confirmBtnStyles}`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

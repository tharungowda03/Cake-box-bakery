import React from 'react';
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

  // Danger keeps red for accessibility; warning uses yellow accent; primary uses #006199
  const confirmStyle: React.CSSProperties =
    variant === 'danger'
      ? { background: '#dc2626', color: 'white' }
      : variant === 'warning'
      ? { background: 'var(--db-accent)', color: 'var(--db-text)' }
      : { background: 'var(--db-primary)', color: 'white' };

  const iconBlock =
    variant === 'danger' ? (
      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
        <AlertTriangle className="w-5 h-5" />
      </div>
    ) : variant === 'warning' ? (
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
        style={{ background: 'var(--db-accent-soft)', color: 'var(--db-text)', borderColor: 'var(--db-accent)' }}
      >
        <AlertTriangle className="w-5 h-5" />
      </div>
    ) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
      style={{ background: 'rgba(15,34,49,0.4)' }}
    >
      <div
        className="bg-white rounded-2xl border shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-150"
        style={{ borderColor: 'var(--db-border)' }}
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 p-1 rounded-lg transition"
          style={{ color: 'var(--db-text-subtle)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--db-text)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--db-text-subtle)'; }}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          {iconBlock}
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--db-text)' }}>
              {title}
            </h3>
            <p className="text-xs sm:text-sm mt-1 leading-relaxed" style={{ color: 'var(--db-text-muted)' }}>
              {description}
            </p>
          </div>
        </div>

        <div
          className="flex items-center justify-end gap-3 mt-6 pt-4 border-t"
          style={{ borderColor: 'var(--db-border-light)' }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="text-xs px-3.5 py-2 rounded-lg border font-medium transition-all duration-150"
            style={{
              borderColor: 'var(--db-border)',
              color: 'var(--db-text-muted)',
              background: 'white',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--db-primary-soft)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'white'; }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="text-xs px-4 py-2 rounded-lg font-semibold transition-all duration-150 disabled:opacity-60"
            style={confirmStyle}
            onMouseEnter={(e) => {
              if (variant !== 'danger') {
                (e.currentTarget as HTMLElement).style.background = 'var(--db-primary-dark)';
                (e.currentTarget as HTMLElement).style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (variant !== 'danger') {
                Object.assign((e.currentTarget as HTMLElement).style, confirmStyle);
              }
            }}
          >
            {loading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

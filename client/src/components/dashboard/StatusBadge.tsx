import React from 'react';

export interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  // Order lifecycle — keep semantic colour clarity (no forced blue/yellow on all)
  const map: Record<string, { label: string; bg: string; color: string; dot: string }> = {
    // Regular order statuses
    PENDING:          { label: 'Pending',          bg: '#FFF8E1', color: '#8a6000', dot: '#FFD444' },
    CONFIRMED:        { label: 'Confirmed',         bg: 'var(--db-primary-soft)', color: 'var(--db-primary)', dot: 'var(--db-primary)' },
    PREPARING:        { label: 'Preparing',         bg: '#ede9fe', color: '#5b21b6', dot: '#8b5cf6' },
    READY:            { label: 'Ready for Pickup',  bg: '#ecfdf5', color: '#065f46', dot: '#10b981' },
    OUT_FOR_DELIVERY: { label: 'Out for Delivery',  bg: '#e0f3fd', color: 'var(--db-primary-dark)', dot: 'var(--db-primary-light)' },
    DELIVERED:        { label: 'Delivered',         bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
    PICKED_UP:        { label: 'Picked Up',         bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
    CANCELLED:        { label: 'Cancelled',         bg: '#fef2f2', color: '#991b1b', dot: '#ef4444' },

    // Custom cake statuses
    ACCEPTED:         { label: 'Accepted',          bg: 'var(--db-primary-soft)', color: 'var(--db-primary)', dot: 'var(--db-primary)' },
    QUOTED:           { label: 'Quote Ready',       bg: '#FFF8E1', color: '#8a6000', dot: '#FFD444' },
    REJECTED:         { label: 'Rejected',          bg: '#fef2f2', color: '#991b1b', dot: '#ef4444' },

    // Product availability — use palette
    AVAILABLE:        { label: 'Available',         bg: 'var(--db-primary-soft)', color: 'var(--db-primary)',      dot: 'var(--db-primary)' },
    UNAVAILABLE:      { label: 'Unavailable',       bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
    HIDDEN:           { label: 'Hidden',            bg: '#f1f5f9', color: '#64748b', dot: '#cbd5e1' },
    FEATURED:         { label: 'Featured',          bg: '#FFF8E1', color: '#8a6000', dot: '#FFD444' },
  };

  const entry = map[status] ?? {
    label: status.replace(/_/g, ' '),
    bg: '#f1f5f9',
    color: '#475569',
    dot: '#94a3b8',
  };

  const sizeCls = size === 'md' ? 'px-3 py-1 text-xs' : 'px-2.5 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${sizeCls}`}
      style={{
        background: entry.bg,
        color: entry.color,
        borderColor: entry.dot + '33',
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5 shrink-0"
        style={{ background: entry.dot }}
      />
      {entry.label}
    </span>
  );
};

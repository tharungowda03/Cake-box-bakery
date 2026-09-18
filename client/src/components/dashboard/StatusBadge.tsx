import React from 'react';

export interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const map: Record<string, { label: string; cls: string }> = {
    // Order lifecycles
    PENDING: { label: 'Pending', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    CONFIRMED: { label: 'Confirmed', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
    PREPARING: { label: 'Preparing', cls: 'bg-purple-50 text-purple-800 border-purple-200' },
    READY: { label: 'Ready for Pickup', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    OUT_FOR_DELIVERY: { label: 'Out for Delivery', cls: 'bg-orange-50 text-orange-800 border-orange-200' },
    DELIVERED: { label: 'Delivered', cls: 'bg-green-50 text-green-800 border-green-200' },
    PICKED_UP: { label: 'Picked Up', cls: 'bg-green-50 text-green-800 border-green-200' },
    CANCELLED: { label: 'Cancelled', cls: 'bg-red-50 text-red-800 border-red-200' },

    // Custom cake statuses
    ACCEPTED: { label: 'Accepted', cls: 'bg-blue-50 text-blue-800 border-blue-200' },
    QUOTED: { label: 'Quote Ready', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    REJECTED: { label: 'Rejected', cls: 'bg-red-50 text-red-800 border-red-200' },

    // Product availability
    AVAILABLE: { label: 'Available', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    UNAVAILABLE: { label: 'Unavailable', cls: 'bg-stone-100 text-stone-700 border-stone-300' },
    HIDDEN: { label: 'Hidden', cls: 'bg-stone-100 text-stone-500 border-stone-200' },
  };

  const { label, cls } = map[status] || {
    label: status.replace(/_/g, ' '),
    cls: 'bg-stone-50 text-stone-700 border-stone-200',
  };

  const sizeCls = size === 'md' ? 'px-3 py-1 text-xs' : 'px-2.5 py-0.5 text-[11px]';

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${sizeCls} ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {label}
    </span>
  );
};

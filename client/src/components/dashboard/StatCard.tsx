import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  variant?: 'amber' | 'emerald' | 'blue' | 'purple' | 'stone';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sub,
  icon: Icon,
  variant = 'amber',
  onClick,
}) => {
  const variantStyles = {
    amber: {
      iconBg: 'bg-amber-50 text-amber-700 border-amber-100',
      valueColor: 'text-stone-900',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      valueColor: 'text-emerald-900',
    },
    blue: {
      iconBg: 'bg-blue-50 text-blue-700 border-blue-100',
      valueColor: 'text-stone-900',
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-700 border-purple-100',
      valueColor: 'text-stone-900',
    },
    stone: {
      iconBg: 'bg-stone-100 text-stone-700 border-stone-200',
      valueColor: 'text-stone-900',
    },
  }[variant];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-stone-200/80 shadow-xs p-5 transition-all duration-150 ${
        onClick ? 'cursor-pointer hover:border-amber-300 hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
            {label}
          </p>
          <p className={`text-2xl font-bold tracking-tight font-sans ${variantStyles.valueColor}`}>
            {value}
          </p>
          {sub && <p className="text-xs text-stone-400 mt-1 font-medium">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${variantStyles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

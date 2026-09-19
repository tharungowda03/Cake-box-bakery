import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  /** Controls the icon container color accent */
  variant?: 'primary' | 'light' | 'accent' | 'soft' | 'neutral' | string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sub,
  icon: Icon,
  variant = 'primary',
  onClick,
}) => {
  const iconStyleMap: Record<string, { bg: string; color: string }> = {
    primary: { bg: 'var(--db-primary)',       color: '#ffffff' },
    light:   { bg: 'var(--db-primary-soft)',  color: 'var(--db-primary)' },
    accent:  { bg: 'var(--db-accent)',        color: 'var(--db-text)' },
    soft:    { bg: 'var(--db-accent-soft)',   color: 'var(--db-text)' },
    neutral: { bg: '#e9eef3',                 color: 'var(--db-text-muted)' },
    stone:   { bg: '#e9eef3',                 color: 'var(--db-text-muted)' },
    amber:   { bg: 'var(--db-accent)',        color: 'var(--db-text)' },
    emerald: { bg: 'var(--db-primary-soft)',  color: 'var(--db-primary)' },
    purple:  { bg: 'var(--db-primary-soft)',  color: 'var(--db-primary)' },
  };
  const iconStyle = iconStyleMap[variant] ?? { bg: 'var(--db-primary-soft)', color: 'var(--db-primary)' };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border p-5 transition-all duration-150"
      style={{
        borderColor: 'var(--db-border)',
        boxShadow: '0 1px 3px rgba(0,97,153,0.05)',
        cursor: onClick ? 'pointer' : undefined,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--db-primary-light)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,97,153,0.1)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--db-border)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,97,153,0.05)';
        }
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-1.5"
            style={{ color: 'var(--db-text-subtle)' }}
          >
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight font-sans" style={{ color: 'var(--db-text)' }}>
            {value}
          </p>
          {sub && (
            <p className="text-xs mt-1 font-medium" style={{ color: 'var(--db-text-subtle)' }}>
              {sub}
            </p>
          )}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: iconStyle.bg, color: iconStyle.color }}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

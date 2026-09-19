import React from 'react';
import { Menu, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardBreadcrumbs } from './DashboardBreadcrumbs';
import type { BreadcrumbItem } from './DashboardBreadcrumbs';

export interface DashboardHeaderProps {
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  baseHref?: string;
  baseLabel?: string;
  onOpenMobileNav: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  breadcrumbs,
  baseHref = '/dashboard',
  baseLabel = 'Dashboard',
  onOpenMobileNav,
}) => {
  const { user, role } = useAuth();

  const getInitials = () => {
    if (!user?.email) return 'U';
    return user.email.slice(0, 2).toUpperCase();
  };

  return (
    <header
      className="sticky top-0 z-30 h-16 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between border-b"
      style={{
        background: 'rgba(255,255,255,0.96)',
        borderColor: 'var(--db-border)',
      }}
    >
      {/* Left: Hamburger (mobile) + Breadcrumbs */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-lg transition focus:outline-hidden"
          style={{ color: 'var(--db-text-muted)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--db-primary-soft)';
            (e.currentTarget as HTMLElement).style.color = 'var(--db-primary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = '';
            (e.currentTarget as HTMLElement).style.color = 'var(--db-text-muted)';
          }}
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {breadcrumbs && breadcrumbs.length > 0 ? (
          <DashboardBreadcrumbs
            items={breadcrumbs}
            baseHref={baseHref}
            baseLabel={baseLabel}
          />
        ) : (
          <span className="font-semibold text-sm" style={{ color: 'var(--db-text)' }}>
            {baseLabel}
          </span>
        )}
      </div>

      {/* Right: Store shortcut & Profile */}
      <div className="flex items-center space-x-3">
        <Link
          to="/"
          className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150"
          style={{
            color: 'var(--db-primary)',
            borderColor: 'var(--db-border)',
            background: 'white',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--db-primary-soft)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--db-primary-light)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'white';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--db-border)';
          }}
        >
          <Store className="w-3.5 h-3.5" />
          <span>Shop</span>
        </Link>

        {/* User badge */}
        <div className="flex items-center space-x-2 pl-2 border-l" style={{ borderColor: 'var(--db-border)' }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-sans text-white"
            style={{ background: 'var(--db-primary)' }}
          >
            {getInitials()}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold leading-none truncate max-w-[130px]" style={{ color: 'var(--db-text)' }}>
              {user?.email?.split('@')[0]}
            </p>
            <p className="text-[10px] font-medium leading-tight mt-0.5 capitalize" style={{ color: 'var(--db-text-subtle)' }}>
              {role?.toLowerCase() || 'customer'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

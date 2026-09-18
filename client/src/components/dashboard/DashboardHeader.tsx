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
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-stone-200 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Hamburger (mobile) + Breadcrumbs */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition focus:outline-hidden"
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
          <span className="font-semibold text-stone-900 text-sm">{baseLabel}</span>
        )}
      </div>

      {/* Right: Store shortcut & Profile */}
      <div className="flex items-center space-x-3">
        <Link
          to="/"
          className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition"
        >
          <Store className="w-3.5 h-3.5" />
          <span>Shop</span>
        </Link>

        {/* User badge */}
        <div className="flex items-center space-x-2 pl-2 border-l border-stone-200">
          <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold font-sans">
            {getInitials()}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-stone-800 leading-none truncate max-w-[130px]">
              {user?.email?.split('@')[0]}
            </p>
            <p className="text-[10px] text-stone-400 font-medium leading-tight mt-0.5 capitalize">
              {role?.toLowerCase() || 'Customer'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

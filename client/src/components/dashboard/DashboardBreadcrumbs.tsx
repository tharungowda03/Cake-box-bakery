import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface DashboardBreadcrumbsProps {
  items: BreadcrumbItem[];
  baseHref?: string;
  baseLabel?: string;
}

export const DashboardBreadcrumbs: React.FC<DashboardBreadcrumbsProps> = ({
  items,
  baseHref = '/dashboard',
  baseLabel = 'Dashboard',
}) => {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-xs text-stone-500">
      <Link
        to={baseHref}
        className="flex items-center hover:text-stone-900 transition-colors font-medium"
      >
        <Home className="w-3.5 h-3.5 mr-1 text-stone-400" />
        <span>{baseLabel}</span>
      </Link>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3 h-3 text-stone-300 shrink-0" />
            {isLast || !item.href ? (
              <span className="font-semibold text-stone-900 truncate max-w-[160px] sm:max-w-none">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                className="hover:text-stone-900 transition-colors font-medium truncate max-w-[120px] sm:max-w-none"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

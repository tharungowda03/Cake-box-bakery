import React, { useState } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { DashboardMobileNav } from './DashboardMobileNav';
import type { BreadcrumbItem } from './DashboardBreadcrumbs';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'CUSTOMER' | 'OWNER';
  breadcrumbs?: BreadcrumbItem[];
  baseHref?: string;
  baseLabel?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  role,
  breadcrumbs,
  baseHref,
  baseLabel,
}) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#faf8f5] flex">
      {/* Desktop Sidebar (visible on lg+) */}
      <div className="hidden lg:block shrink-0 sticky top-0 h-screen">
        <DashboardSidebar role={role} />
      </div>

      {/* Mobile Drawer (visible on < lg) */}
      <DashboardMobileNav
        isOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        role={role}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          breadcrumbs={breadcrumbs}
          baseHref={baseHref || (role === 'OWNER' ? '/owner' : '/dashboard')}
          baseLabel={baseLabel || (role === 'OWNER' ? 'Owner Portal' : 'My Dashboard')}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

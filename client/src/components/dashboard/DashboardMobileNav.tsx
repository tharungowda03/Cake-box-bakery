import React from 'react';
import { X } from 'lucide-react';
import { DashboardSidebar } from './DashboardSidebar';

export interface DashboardMobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'CUSTOMER' | 'OWNER';
}

export const DashboardMobileNav: React.FC<DashboardMobileNavProps> = ({
  isOpen,
  onClose,
  role,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0f2231]/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl z-10 flex flex-col animate-in slide-in-from-left duration-200 border-r border-[#d1e3ef]">
        <div className="absolute top-4 right-3 z-20">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#4a6275] hover:text-[#006199] hover:bg-[#e0f3fd] transition"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <DashboardSidebar role={role} onNavigate={onClose} />
      </div>
    </div>
  );
};

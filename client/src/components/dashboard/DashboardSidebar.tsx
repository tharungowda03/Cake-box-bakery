import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Cake,
  MapPin,
  User,
  Bot,
  Package,
  Layers,
  Users,
  Truck,
  Settings,
  Database,
  Store,
  HelpCircle,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export interface DashboardSidebarProps {
  role: 'CUSTOMER' | 'OWNER';
  onNavigate?: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ role, onNavigate }) => {
  const location = useLocation();
  const { signOut, user } = useAuth();

  const customerNavItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, exact: true },
    { label: 'My Orders', href: '/dashboard/orders', icon: Package },
    { label: 'Custom Cakes', href: '/dashboard/custom-cakes', icon: Cake },
    { label: 'Addresses', href: '/dashboard/addresses', icon: MapPin },
    { label: 'Profile', href: '/dashboard/profile', icon: User },
    { label: 'AI Assistant', href: '/dashboard/assistant', icon: Bot },
  ];

  const ownerNavItems = [
    { label: 'Overview', href: '/owner', icon: LayoutDashboard, exact: true },
    { label: 'Orders', href: '/owner/orders', icon: ShoppingBag },
    { label: 'Custom Cakes', href: '/owner/custom-cakes', icon: Cake },
    { label: 'Products', href: '/owner/products', icon: Package },
    { label: 'Categories', href: '/owner/categories', icon: Layers },
    { label: 'Customers', href: '/owner/customers', icon: Users },
    { label: 'Delivery & Pickup', href: '/owner/delivery', icon: Truck },
    { label: 'Business Settings', href: '/owner/settings', icon: Settings },
    { label: 'AI Knowledge', href: '/owner/knowledge', icon: Database },
  ];

  const navItems = role === 'OWNER' ? ownerNavItems : customerNavItems;

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-white border-r border-stone-200 flex flex-col h-full shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-stone-100 flex items-center justify-between">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center space-x-2.5 group"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-700 font-serif font-bold text-lg group-hover:scale-105 transition-transform">
            CB
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-serif font-bold text-base text-stone-900 leading-none">
                Cake Box
              </span>
              {role === 'OWNER' && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-400 font-sans mt-0.5">Kakinada, AP</p>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">
          {role === 'OWNER' ? 'Bakery Management' : 'My Account'}
        </p>
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                active
                  ? 'bg-stone-900 text-white font-semibold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-400' : 'text-stone-400'}`} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* User / Quick Actions Footer */}
      <div className="p-3 border-t border-stone-100 bg-stone-50/50 space-y-1">
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-100/80 transition"
        >
          <Store className="w-4 h-4 text-stone-400" />
          <span>Return to Storefront</span>
        </Link>
        <Link
          to="/contact"
          onClick={onNavigate}
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-100/80 transition"
        >
          <HelpCircle className="w-4 h-4 text-stone-400" />
          <span>Help & Support</span>
        </Link>
        <button
          onClick={() => {
            signOut();
            if (onNavigate) onNavigate();
          }}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs text-red-600 hover:bg-red-50/70 transition text-left"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span>Sign Out</span>
        </button>

        <div className="pt-2 border-t border-stone-200/60 mt-2 px-2 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-[11px] font-semibold text-stone-800 truncate">
              {user?.email}
            </p>
            <p className="text-[10px] text-stone-400 capitalize">{role.toLowerCase()}</p>
          </div>
          {role === 'OWNER' && (
            <Shield className="w-4 h-4 text-amber-600 shrink-0" />
          )}
        </div>
      </div>
    </aside>
  );
};

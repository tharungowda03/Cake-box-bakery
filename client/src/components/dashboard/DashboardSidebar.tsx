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
    if (exact) return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-white border-r flex flex-col h-full shrink-0" style={{ borderColor: 'var(--db-border)' }}>
      {/* Brand Header */}
      <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: 'var(--db-border-light)' }}>
        <Link to="/" onClick={onNavigate} className="flex items-center space-x-2.5 group">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-serif font-bold text-lg group-hover:scale-105 transition-transform text-white"
            style={{ background: 'var(--db-primary)' }}
          >
            CB
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-serif font-bold text-base leading-none" style={{ color: 'var(--db-text)' }}>
                Cake Box
              </span>
              {role === 'OWNER' && (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{ background: 'var(--db-accent)', color: 'var(--db-text)' }}
                >
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-[11px] mt-0.5 font-sans" style={{ color: 'var(--db-text-subtle)' }}>
              Kakinada, AP
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p
          className="px-3 text-[10px] font-bold uppercase tracking-wider mb-3"
          style={{ color: 'var(--db-text-subtle)' }}
        >
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
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150"
              style={
                active
                  ? {
                      background: 'var(--db-primary)',
                      color: '#ffffff',
                      fontWeight: 600,
                    }
                  : {
                      color: 'var(--db-text-muted)',
                    }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--db-primary-soft)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--db-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = '';
                  (e.currentTarget as HTMLElement).style.color = 'var(--db-text-muted)';
                }
              }}
            >
              <Icon
                className="w-4 h-4 shrink-0"
                style={{ color: active ? '#FFD444' : 'var(--db-text-subtle)' }}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="p-3 border-t space-y-0.5"
        style={{ borderColor: 'var(--db-border-light)', background: 'var(--db-bg)' }}
      >
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-xs transition-all duration-150"
          style={{ color: 'var(--db-text-muted)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--db-primary-soft)';
            (e.currentTarget as HTMLElement).style.color = 'var(--db-primary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = '';
            (e.currentTarget as HTMLElement).style.color = 'var(--db-text-muted)';
          }}
        >
          <Store className="w-4 h-4" style={{ color: 'var(--db-text-subtle)' }} />
          <span>Return to Storefront</span>
        </Link>
        <Link
          to="/contact"
          onClick={onNavigate}
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-xs transition-all duration-150"
          style={{ color: 'var(--db-text-muted)' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--db-primary-soft)';
            (e.currentTarget as HTMLElement).style.color = 'var(--db-primary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = '';
            (e.currentTarget as HTMLElement).style.color = 'var(--db-text-muted)';
          }}
        >
          <HelpCircle className="w-4 h-4" style={{ color: 'var(--db-text-subtle)' }} />
          <span>Help & Support</span>
        </Link>
        <button
          onClick={() => { signOut(); if (onNavigate) onNavigate(); }}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs transition-all duration-150 text-left text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span>Sign Out</span>
        </button>

        <div
          className="pt-2 border-t mt-2 px-2 flex items-center justify-between"
          style={{ borderColor: 'var(--db-border-light)' }}
        >
          <div className="truncate pr-2">
            <p className="text-[11px] font-semibold truncate" style={{ color: 'var(--db-text)' }}>
              {user?.email}
            </p>
            <p className="text-[10px] capitalize" style={{ color: 'var(--db-text-subtle)' }}>
              {role.toLowerCase()}
            </p>
          </div>
          {role === 'OWNER' && (
            <Shield className="w-4 h-4 shrink-0" style={{ color: 'var(--db-primary)' }} />
          )}
        </div>
      </div>
    </aside>
  );
};

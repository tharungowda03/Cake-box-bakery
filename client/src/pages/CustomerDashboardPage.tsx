import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Package,
  Cake,
  MapPin,
  Clock,
  Truck,
  CheckCircle2,
  ExternalLink,
  Plus,
  Trash2,
  Phone,
  Search,
  Send,
  Loader2,
  Calendar,
  Sparkles,
  ShoppingBag,
  Check,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  orderService,
  addressService,
  customCakeService,
  profileService,
  chatService,
  type ChatMessage,
} from '../services/apiService';
import type { Order, Address, CustomOrder } from '../types';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';

// Shared Dashboard Components
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { PageHeader } from '../components/dashboard/PageHeader';
import { StatCard } from '../components/dashboard/StatCard';
import { StatusBadge } from '../components/dashboard/StatusBadge';
import { EmptyState } from '../components/dashboard/EmptyState';
import { LoadingState } from '../components/dashboard/LoadingState';
import { ErrorState } from '../components/dashboard/ErrorState';
import { SectionCard } from '../components/dashboard/SectionCard';
import { ConfirmDialog } from '../components/dashboard/ConfirmDialog';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTimeGreeting(name: string) {
  const hour = new Date().getHours();
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  else if (hour >= 17) greeting = 'Good evening';

  const firstName = name ? name.split(' ')[0] : 'there';
  return `${greeting}, ${firstName}`;
}

// ---------------------------------------------------------------------------
// 1. Overview Tab
// ---------------------------------------------------------------------------

interface OverviewTabProps {
  orders: Order[];
  customOrders: CustomOrder[];
  loading: boolean;
  onViewOrder: (id: string) => void;
  onNavigateTab: (tab: string) => void;
  customerName: string;
}

const CustomerOverviewTab: React.FC<OverviewTabProps> = ({
  orders,
  customOrders,
  loading,
  onViewOrder,
  onNavigateTab,
  customerName,
}) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingState type="stats" />
        <LoadingState type="card" count={2} />
      </div>
    );
  }

  // Calculate real metrics
  const activeOrders = orders.filter(
    (o) => !['DELIVERED', 'PICKED_UP', 'CANCELLED'].includes(o.status)
  );
  const completedOrders = orders.filter((o) =>
    ['DELIVERED', 'PICKED_UP'].includes(o.status)
  );
  const activeCustomCakes = customOrders.filter(
    (c) => !['CANCELLED', 'REJECTED'].includes(c.status)
  );

  // Most recent active order
  const activeOrder = activeOrders[0];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 font-sans">
          {getTimeGreeting(customerName)}
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Here's what's happening with your orders.
        </p>
      </div>

      {/* Real Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Orders"
          value={orders.length}
          icon={Package}
          variant="stone"
          onClick={() => onNavigateTab('/dashboard/orders')}
        />
        <StatCard
          label="Active Orders"
          value={activeOrders.length}
          sub={activeOrders.length ? 'In progress' : 'No active orders'}
          icon={Clock}
          variant="amber"
          onClick={() => onNavigateTab('/dashboard/orders')}
        />
        <StatCard
          label="Completed"
          value={completedOrders.length}
          icon={CheckCircle2}
          variant="emerald"
          onClick={() => onNavigateTab('/dashboard/orders')}
        />
        <StatCard
          label="Custom Cakes"
          value={activeCustomCakes.length}
          sub={
            customOrders.some((c) => c.status === 'QUOTED')
              ? 'Quote ready to review!'
              : undefined
          }
          icon={Cake}
          variant={customOrders.some((c) => c.status === 'QUOTED') ? 'amber' : 'purple'}
          onClick={() => onNavigateTab('/dashboard/custom-cakes')}
        />
      </div>

      {/* Active Order Progress Tracker */}
      {activeOrder && (
        <SectionCard
          title={`Active Order #${activeOrder.order_number}`}
          subtitle={`Placed on ${new Date(activeOrder.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}`}
          action={
            <Link
              to={`/orders/${activeOrder.id}`}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center space-x-1"
            >
              <span>View Order</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-stone-500">Fulfilment:</span>
                <span className="text-xs font-semibold text-stone-800 uppercase tracking-wider flex items-center gap-1">
                  {activeOrder.delivery_type === 'DELIVERY' ? (
                    <>
                      <Truck className="w-3.5 h-3.5 text-amber-600" /> Delivery
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5 text-teal-600" /> Store Pickup
                    </>
                  )}
                </span>
              </div>
              <div>
                <StatusBadge status={activeOrder.status} size="md" />
              </div>
            </div>

            {/* Lifecycle Progress Bar */}
            <OrderProgressIndicator
              deliveryType={activeOrder.delivery_type}
              currentStatus={activeOrder.status}
            />

            {/* Items Summary */}
            <div className="bg-stone-50/70 rounded-xl p-3 border border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
              <p className="text-stone-700 font-medium">
                {activeOrder.order_items?.map((item) => `${item.quantity}x ${item.product_name_snapshot}`).join(', ') ||
                  'Items in preparation'}
              </p>
              <p className="font-bold text-stone-900 text-sm">
                ₹{Number(activeOrder.total).toFixed(2)}
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Recent Orders Section */}
      <SectionCard
        title="Recent Orders"
        subtitle="Your latest bakery orders"
        action={
          orders.length > 3 ? (
            <button
              onClick={() => onNavigateTab('/dashboard/orders')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800"
            >
              View All Orders ({orders.length})
            </button>
          ) : undefined
        }
      >
        {orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No orders yet"
            description="Explore our freshly baked treats and place your first order."
            actionLabel="Browse Menu"
            actionHref="/menu"
          />
        ) : (
          <div className="divide-y divide-stone-100">
            {orders.slice(0, 4).map((order) => (
              <div
                key={order.id}
                className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 hover:bg-stone-50/40 -mx-2 px-2 rounded-lg transition"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-stone-900 text-xs sm:text-sm">
                      #{order.order_number}
                    </span>
                    <span className="text-[11px] text-stone-400">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    <span className="text-[10px] font-semibold text-stone-500 uppercase">
                      • {order.delivery_type}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
                    {order.order_items?.map((i) => `${i.quantity}x ${i.product_name_snapshot}`).join(', ') || 'Bakery Items'}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span className="font-bold text-stone-800 text-xs sm:text-sm">
                    ₹{Number(order.total).toFixed(2)}
                  </span>
                  <StatusBadge status={order.status} />
                  <button
                    onClick={() => onViewOrder(order.id)}
                    className="p-1.5 text-stone-400 hover:text-stone-900 rounded-md hover:bg-stone-100 transition"
                    title="View details"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Custom Cake Inquiries Preview */}
      {customOrders.length > 0 && (
        <SectionCard
          title="Custom Cake Requests"
          subtitle="Status of your bespoke celebration cakes"
          action={
            <button
              onClick={() => onNavigateTab('/dashboard/custom-cakes')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-800"
            >
              Manage ({customOrders.length})
            </button>
          }
        >
          <div className="space-y-3">
            {customOrders.slice(0, 3).map((co) => (
              <div
                key={co.id}
                className="p-3.5 rounded-xl border border-stone-100 bg-stone-50/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-stone-900">
                      {co.occasion || co.theme || 'Custom Cake'} ({co.flavour || 'Standard'})
                    </span>
                    {co.weight && (
                      <span className="text-[11px] text-stone-500">
                        • {co.weight} kg
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    Event: {co.required_date ? new Date(co.required_date).toLocaleDateString('en-IN') : 'TBD'}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  {co.status === 'QUOTED' && co.final_price ? (
                    <div className="text-right">
                      <span className="text-[10px] text-amber-700 font-semibold uppercase block">Quoted</span>
                      <span className="text-xs font-bold text-stone-900">₹{co.final_price}</span>
                    </div>
                  ) : null}
                  <StatusBadge status={co.status} />
                  {co.status === 'QUOTED' && (
                    <button
                      onClick={() => onNavigateTab('/dashboard/custom-cakes')}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition shadow-2xs"
                    >
                      Review Quote
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Order Progress Indicator (Horizontal on Desktop, Vertical on Mobile)
// ---------------------------------------------------------------------------

function OrderProgressIndicator({
  deliveryType,
  currentStatus,
}: {
  deliveryType: 'DELIVERY' | 'PICKUP';
  currentStatus: string;
}) {
  const deliverySteps = ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const pickupSteps = ['CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP'];

  const steps = deliveryType === 'DELIVERY' ? deliverySteps : pickupSteps;

  const stepLabels: Record<string, string> = {
    CONFIRMED: 'Confirmed',
    PREPARING: 'Preparing',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    READY: 'Ready for Pickup',
    PICKED_UP: 'Picked Up',
  };

  const currentIndex = steps.indexOf(currentStatus);

  return (
    <div className="py-2">
      {/* Desktop Horizontal Stepper */}
      <div className="hidden sm:flex items-center justify-between relative">
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-stone-200 -z-0" />
        <div
          className="absolute top-4 left-6 h-0.5 bg-amber-600 transition-all duration-300 -z-0"
          style={{
            width:
              currentIndex <= 0
                ? '0%'
                : `${(currentIndex / (steps.length - 1)) * 100}%`,
          }}
        />

        {steps.map((step, idx) => {
          const isDone = currentIndex > idx;
          const isCurrent = currentIndex === idx;
          return (
            <div key={step} className="flex flex-col items-center relative z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  isDone
                    ? 'bg-amber-600 text-white shadow-xs'
                    : isCurrent
                    ? 'bg-amber-500 text-white ring-4 ring-amber-100'
                    : 'bg-white border-2 border-stone-300 text-stone-400'
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span
                className={`text-[11px] mt-2 font-medium ${
                  isCurrent
                    ? 'text-stone-900 font-bold'
                    : isDone
                    ? 'text-stone-700'
                    : 'text-stone-400'
                }`}
              >
                {stepLabels[step]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Mobile Vertical Stepper */}
      <div className="sm:hidden space-y-3">
        {steps.map((step, idx) => {
          const isDone = currentIndex > idx;
          const isCurrent = currentIndex === idx;
          return (
            <div key={step} className="flex items-center space-x-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  isDone
                    ? 'bg-amber-600 text-white'
                    : isCurrent
                    ? 'bg-amber-500 text-white ring-2 ring-amber-100'
                    : 'bg-stone-100 border border-stone-300 text-stone-400'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span
                className={`text-xs ${
                  isCurrent
                    ? 'font-bold text-stone-900'
                    : isDone
                    ? 'text-stone-700'
                    : 'text-stone-400'
                }`}
              >
                {stepLabels[step]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Orders Tab
// ---------------------------------------------------------------------------

const CustomerOrdersTab: React.FC<{
  orders: Order[];
  loading: boolean;
}> = ({ orders, loading }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'DELIVERY' | 'PICKUP' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ALL');

  if (loading) return <LoadingState type="table" count={5} />;

  const filteredOrders = orders.filter((o) => {
    // Search match
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesNum = o.order_number.toLowerCase().includes(q);
      const matchesItem = o.order_items?.some((i) =>
        i.product_name_snapshot.toLowerCase().includes(q)
      );
      if (!matchesNum && !matchesItem) return false;
    }

    // Filter match
    if (filter === 'DELIVERY') return o.delivery_type === 'DELIVERY';
    if (filter === 'PICKUP') return o.delivery_type === 'PICKUP';
    if (filter === 'ACTIVE')
      return !['DELIVERED', 'PICKED_UP', 'CANCELLED'].includes(o.status);
    if (filter === 'COMPLETED')
      return ['DELIVERED', 'PICKED_UP'].includes(o.status);
    if (filter === 'CANCELLED') return o.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Orders"
        subtitle="Track, view and manage all your bakery orders."
      />

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order # or item..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'DELIVERY', label: 'Delivery' },
            { id: 'PICKUP', label: 'Pickup' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition shrink-0 ${
                filter === tab.id
                  ? 'bg-stone-900 text-white font-semibold shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={search ? 'No matching orders found' : 'No orders in this view'}
          description={
            search
              ? `No orders matching "${search}". Try searching for another order # or product name.`
              : 'You have no orders matching this filter category.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-xs hover:border-amber-300 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2.5">
                  <span className="font-bold text-stone-900 text-sm">
                    #{order.order_number}
                  </span>
                  <StatusBadge status={order.status} />
                  <span className="text-[11px] font-semibold text-stone-500 uppercase px-2 py-0.5 bg-stone-100 rounded-md">
                    {order.delivery_type}
                  </span>
                </div>
                <p className="text-xs text-stone-400">
                  Ordered on{' '}
                  {new Date(order.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-xs text-stone-600 line-clamp-1 pt-1">
                  {order.order_items?.map((i) => `${i.quantity}x ${i.product_name_snapshot}`).join(', ') ||
                    'Bakery items'}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                <div className="sm:text-right">
                  <p className="text-[10px] text-stone-400 uppercase font-semibold">Total Amount</p>
                  <p className="font-bold text-stone-900 text-base">₹{Number(order.total).toFixed(2)}</p>
                </div>
                <Link
                  to={`/orders/${order.id}`}
                  className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 shadow-2xs"
                >
                  <span>View Details</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3. Custom Cakes Tab
// ---------------------------------------------------------------------------

const CustomerCustomCakesTab: React.FC<{
  customOrders: CustomOrder[];
  loading: boolean;
  onRefresh: () => void;
}> = ({ customOrders, loading, onRefresh }) => {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  if (loading) return <LoadingState type="card" count={3} />;

  const handleConfirmQuote = async (id: string) => {
    setConfirmLoading(true);
    try {
      await customCakeService.confirmQuote(id);
      onRefresh();
      setConfirmingId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to confirm quote');
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Cake Requests"
        subtitle="Manage your bespoke celebration cakes and review pricing quotes."
        action={
          <Link
            to="/custom-cake"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Request a Custom Cake</span>
          </Link>
        }
      />

      {customOrders.length === 0 ? (
        <EmptyState
          icon={Cake}
          title="No custom cake requests"
          description="Have an upcoming birthday, wedding or event? Request a customized designer cake from our master bakers."
          actionLabel="Request Custom Cake"
          actionHref="/custom-cake"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {customOrders.map((co) => (
            <div
              key={co.id}
              className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">
                      {co.occasion || co.theme || 'Custom Cake'}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Flavour: <span className="font-semibold text-stone-700">{co.flavour || 'Standard'}</span>
                      {co.weight && (
                        <> • Weight: <span className="font-semibold text-stone-700">{co.weight} kg</span></>
                      )}
                    </p>
                  </div>
                  <StatusBadge status={co.status} />
                </div>

                <div className="mt-3 text-xs text-stone-600 space-y-1.5 bg-stone-50/70 p-3 rounded-lg border border-stone-100">
                  <p className="flex items-center gap-1.5 text-stone-700">
                    <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>Event Date: <strong>{co.required_date ? new Date(co.required_date).toLocaleDateString('en-IN') : 'Not specified'}</strong></span>
                  </p>
                  {co.cake_message && (
                    <p className="text-stone-700">
                      Message: <span className="italic">"{co.cake_message}"</span>
                    </p>
                  )}
                  {co.additional_requirements && (
                    <p className="text-stone-500 text-[11px] line-clamp-2">
                      Notes: {co.additional_requirements}
                    </p>
                  )}
                </div>

                {/* Reference Image Preview */}
                {co.reference_image_path && (
                  <div className="mt-3">
                    <p className="text-[11px] font-semibold text-stone-400 mb-1">Reference Image</p>
                    <a
                      href={
                        co.reference_image_path.startsWith('http')
                          ? co.reference_image_path
                          : supabase.storage.from('custom-cake-references').getPublicUrl(co.reference_image_path).data.publicUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block relative rounded-lg overflow-hidden border border-stone-200 group"
                    >
                      <img
                        src={
                          co.reference_image_path.startsWith('http')
                            ? co.reference_image_path
                            : supabase.storage.from('custom-cake-references').getPublicUrl(co.reference_image_path).data.publicUrl
                        }
                        alt="Reference"
                        className="w-20 h-20 object-cover group-hover:scale-105 transition"
                      />
                    </a>
                  </div>
                )}
              </div>

              {/* Action / Quote Status */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <div>
                  {co.final_price ? (
                    <div>
                      <p className="text-[10px] text-stone-400 uppercase font-semibold">Quoted Price</p>
                      <p className="font-bold text-stone-900 text-base">₹{co.final_price}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400 italic">Quotation pending</p>
                  )}
                </div>

                {co.status === 'QUOTED' ? (
                  <Button
                    onClick={() => setConfirmingId(co.id)}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3.5 py-1.5 h-auto"
                  >
                    Confirm & Accept Quote
                  </Button>
                ) : co.status === 'CONFIRMED' ? (
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Confirmed
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmingId)}
        title="Accept Cake Quotation?"
        description="By confirming this quotation, you agree to place this custom order. Our bakery team will begin planning your cake."
        confirmLabel="Accept Quote"
        loading={confirmLoading}
        onConfirm={() => confirmingId && handleConfirmQuote(confirmingId)}
        onCancel={() => setConfirmingId(null)}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// 4. Addresses Tab
// ---------------------------------------------------------------------------

const CustomerAddressesTab: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // New address form
  const [form, setForm] = useState({
    recipient_name: '',
    phone: '',
    house_flat_building: '',
    street: '',
    area_locality: '',
    landmark: '',
    city: 'Kakinada',
    state: 'Andhra Pradesh',
    postal_code: '533001',
    is_default: false,
  });

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load addresses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addressService.createAddress(form);
      setShowAddModal(false);
      setForm({
        recipient_name: '',
        phone: '',
        house_flat_building: '',
        street: '',
        area_locality: '',
        landmark: '',
        city: 'Kakinada',
        state: 'Andhra Pradesh',
        postal_code: '533001',
        is_default: false,
      });
      loadAddresses();
    } catch (err: any) {
      alert(err.message || 'Failed to save address');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await addressService.deleteAddress(deletingId);
      setDeletingId(null);
      loadAddresses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete address');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved Addresses"
        subtitle="Manage your delivery addresses for seamless checkout."
        action={
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-stone-900 hover:bg-stone-800 text-white text-xs px-3.5 py-2 h-auto flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Address</span>
          </Button>
        }
      />

      {loading ? (
        <LoadingState type="card" count={2} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadAddresses} />
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          description="Add your home or office address for quicker delivery orders."
          actionLabel="Add Address"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="bg-white rounded-xl border border-stone-200/80 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 text-sm">
                    {addr.recipient_name || 'Delivery Address'}
                  </span>
                  {addr.is_default && (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[10px] font-bold">
                      DEFAULT
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  {[addr.house_flat_building, addr.street, addr.area_locality, addr.landmark].filter(Boolean).join(', ')}
                </p>
                <p className="text-xs text-stone-500">
                  {addr.city}, {addr.state} - {addr.postal_code}
                </p>
                {addr.phone && (
                  <p className="text-xs text-stone-500 mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-stone-400" /> {addr.phone}
                  </p>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-end">
                <button
                  onClick={() => setDeletingId(addr.id)}
                  className="p-1.5 text-stone-400 hover:text-red-600 rounded-md transition"
                  title="Delete address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Address Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 max-w-md w-full shadow-xl">
            <h3 className="font-bold text-stone-900 text-base mb-4">Add Delivery Address</h3>
            <form onSubmit={handleCreateAddress} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Recipient Name</label>
                <input
                  type="text"
                  required
                  value={form.recipient_name}
                  onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">House / Flat / Building</label>
                  <input
                    type="text"
                    required
                    value={form.house_flat_building}
                    onChange={(e) => setForm({ ...form, house_flat_building: e.target.value })}
                    placeholder="D.No / Flat 402"
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Street</label>
                  <input
                    type="text"
                    required
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    placeholder="Main Road"
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Area / Locality</label>
                  <input
                    type="text"
                    required
                    value={form.area_locality}
                    onChange={(e) => setForm({ ...form, area_locality: e.target.value })}
                    placeholder="Suryaraopeta"
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Landmark (Optional)</label>
                  <input
                    type="text"
                    value={form.landmark}
                    onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                    placeholder="Near Temple"
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">PIN Code</label>
                  <input
                    type="text"
                    required
                    value={form.postal_code}
                    onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Contact Phone</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={form.is_default}
                  onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
                  className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="is_default" className="text-stone-700 font-medium">Set as default address</label>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="text-xs px-3 py-1.5 h-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-stone-900 text-white text-xs px-4 py-1.5 h-auto"
                >
                  Save Address
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        title="Delete Address"
        description="Are you sure you want to remove this saved delivery address?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// 5. Profile Tab
// ---------------------------------------------------------------------------

const CustomerProfileTab: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ full_name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        setProfile({
          full_name: data?.full_name || '',
          phone: data?.phone || '',
          email: user.email || '',
        });
        setLoading(false);
      });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    try {
      await profileService.updateProfile({
        full_name: profile.full_name,
        phone: profile.phone,
      });
      setSavedMsg('Profile updated successfully.');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState type="card" count={1} />;

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader
        title="Account Profile"
        subtitle="Manage your personal details and contact settings."
      />

      <SectionCard title="Personal Information">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-stone-700 block mb-1">Email Address</label>
            <input
              type="email"
              disabled
              value={profile.email}
              className="w-full p-2.5 bg-stone-100 text-stone-500 border border-stone-200 rounded-lg cursor-not-allowed"
            />
            <p className="text-[11px] text-stone-400 mt-1">Managed via authentication provider.</p>
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1">Full Name</label>
            <input
              type="text"
              required
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="Your full name"
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1">Phone Number</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+91 99939 99528"
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:border-amber-500"
            />
          </div>

          {savedMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold">
              {savedMsg}
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="bg-stone-900 text-white text-xs px-4 py-2 h-auto"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </Button>
          </div>
        </form>
      </SectionCard>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 6. AI Assistant Tab
// ---------------------------------------------------------------------------

const CustomerAssistantTab: React.FC = () => {
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'assistant'; text: string }[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am your Cake Box Assistant. Ask me anything about our store hours, menu items, pickup options, delivery radius, or how custom cake inquiries work!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const starterChips = [
    'Where is Cake Box?',
    'What are your store timings?',
    'How does delivery work?',
    'Do you offer pickup?',
    'How can I request a custom cake?',
    'What cakes are available?',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input.trim();
    if (!textToSend || loading) return;

    const userMsgId = `u-${Date.now()}`;
    setMessages((prev) => [...prev, { id: userMsgId, role: 'user', text: textToSend }]);
    setInput('');
    setLoading(true);

    try {
      const history: ChatMessage[] = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          content: m.text,
        }));

      const reply = await chatService.sendMessage(textToSend, history);
      setMessages((prev) => [
        ...prev,
        { id: `b-${Date.now()}`, role: 'assistant', text: reply },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          role: 'assistant',
          text: 'Sorry, I am temporarily having trouble reaching the knowledge base. Please call us directly at +91 99939 99528.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="AI Bakery Assistant"
        subtitle="Instant answers grounded in verified Cake Box Kakinada store data."
      />

      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden flex flex-col h-[560px]">
        {/* Header note */}
        <div className="px-5 py-3 border-b border-stone-100 bg-stone-50/70 flex items-center justify-between text-xs">
          <span className="font-semibold text-stone-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Cake Box Assistant
          </span>
          <span className="text-[10px] text-stone-500 bg-stone-200/70 px-2 py-0.5 rounded-full">
            Verified Store Data
          </span>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[82%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-stone-900 text-white rounded-tr-xs'
                    : 'bg-stone-100 text-stone-800 rounded-tl-xs border border-stone-200/60'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-stone-100 text-stone-500 p-3 rounded-2xl text-xs flex items-center space-x-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                <span>Checking verified store records...</span>
              </div>
            </div>
          )}
        </div>

        {/* Starter Chips */}
        <div className="px-4 py-2 bg-stone-50/40 border-t border-stone-100 flex items-center gap-1.5 overflow-x-auto">
          {starterChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              className="text-[11px] bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 px-2.5 py-1 rounded-full whitespace-nowrap transition"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 border-t border-stone-200 bg-white flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about products, pickup, delivery charge, store hours..."
            className="flex-1 p-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:border-amber-500"
          />
          <Button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-stone-900 text-white px-4 py-2 h-auto rounded-xl"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>

      <p className="text-[11px] text-stone-400 text-center">
        Disclaimer: Answers are based on verified Cake Box Kakinada information and current live menu prices.
      </p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Customer Dashboard Shell
// ---------------------------------------------------------------------------

export const CustomerDashboardPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);

  // Normalize current active subroute (strip trailing slash, map /account to /dashboard)
  const normalized = location.pathname.replace(/\/$/, '') || '/dashboard';
  const cleanPath = normalized.startsWith('/account')
    ? normalized.replace(/^\/account/, '/dashboard')
    : normalized;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersData, coData] = await Promise.all([
        orderService.getOrders(),
        customCakeService.getCustomOrders(),
      ]);
      setOrders(ordersData);
      setCustomOrders(coData);

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        if (data?.full_name) {
          setCustomerName(data.full_name);
        }
      }
    } catch (err) {
      console.error('[CustomerDashboard] loadData error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Breadcrumbs builder
  const getBreadcrumbs = () => {
    if (cleanPath.includes('/orders')) {
      return [{ label: 'My Orders' }];
    }
    if (cleanPath.includes('/custom-cakes')) {
      return [{ label: 'Custom Cakes' }];
    }
    if (cleanPath.includes('/addresses')) {
      return [{ label: 'Addresses' }];
    }
    if (cleanPath.includes('/profile')) {
      return [{ label: 'Profile' }];
    }
    if (cleanPath.includes('/assistant')) {
      return [{ label: 'AI Assistant' }];
    }
    return [];
  };

  const renderContent = () => {
    if (cleanPath === '/dashboard/orders') {
      return <CustomerOrdersTab orders={orders} loading={loading} />;
    }
    if (cleanPath === '/dashboard/custom-cakes') {
      return (
        <CustomerCustomCakesTab
          customOrders={customOrders}
          loading={loading}
          onRefresh={loadData}
        />
      );
    }
    if (cleanPath === '/dashboard/addresses') {
      return <CustomerAddressesTab />;
    }
    if (cleanPath === '/dashboard/profile') {
      return <CustomerProfileTab />;
    }
    if (cleanPath === '/dashboard/assistant') {
      return <CustomerAssistantTab />;
    }
    // Default to Overview (/dashboard or unknown)
    return (
      <CustomerOverviewTab
        orders={orders}
        customOrders={customOrders}
        loading={loading}
        customerName={customerName}
        onViewOrder={(id) => navigate(`/orders/${id}`)}
        onNavigateTab={(path) => navigate(path)}
      />
    );
  };

  return (
    <DashboardLayout
      role="CUSTOMER"
      baseHref="/dashboard"
      baseLabel="Customer Dashboard"
      breadcrumbs={getBreadcrumbs()}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default CustomerDashboardPage;

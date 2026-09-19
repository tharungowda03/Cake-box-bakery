import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag,
  Cake,
  Package,
  Users,
  Truck,
  RefreshCw,
  Search,
  ArrowRight,
  XCircle,
  Check,
  IndianRupee,
  Clock,
  CheckCircle2,
  User,
  Phone,
  Pencil,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  MapPin,
  ToggleLeft,
  ToggleRight,
  Info,
  Cpu,
  BookOpen,
  FileText,
  Table2,
  EyeOff,
  AlertTriangle,
  Plus,
  ExternalLink,
  Tag,
  Star,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { ownerService, type OwnerStats } from '../services/apiService';
import { REGULAR_ORDER_RULES } from '../config/businessPolicy';

// Shared dashboard components
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

function getNextStatuses(
  deliveryType: 'DELIVERY' | 'PICKUP',
  currentStatus: string
): string[] {
  const transitions = REGULAR_ORDER_RULES.statusTransitions[deliveryType] as Record<
    string,
    readonly string[]
  >;
  return [...(transitions?.[currentStatus] || [])];
}

function formatCurrency(val: number | string) {
  return `₹${Number(val).toFixed(0)}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// 1. OVERVIEW TAB
// ---------------------------------------------------------------------------

const OwnerOverviewTab: React.FC<{ stats: OwnerStats | null; error: string }> = ({
  stats,
  error,
}) => {
  const [catalogueStats, setCatalogueStats] = useState<any>(null);
  const [catalogueLoading, setCatalogueLoading] = useState(true);

  useEffect(() => {
    ownerService
      .getCatalogueStats()
      .then(setCatalogueStats)
      .catch(() => {})
      .finally(() => setCatalogueLoading(false));
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!stats) return <LoadingState type="stats" />;

  const { orders: o, custom_orders: co } = stats;
  const active =
    (o.by_status['CONFIRMED'] || 0) +
    (o.by_status['PREPARING'] || 0) +
    (o.by_status['OUT_FOR_DELIVERY'] || 0) +
    (o.by_status['READY'] || 0);

  const statusDisplay: { key: string; label: string; color: string }[] = [
    { key: 'PENDING', label: 'Pending', color: 'text-yellow-700' },
    { key: 'CONFIRMED', label: 'Confirmed', color: 'text-blue-700' },
    { key: 'PREPARING', label: 'Preparing', color: 'text-purple-700' },
    { key: 'READY', label: 'Ready', color: 'text-teal-700' },
    { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: 'text-orange-700' },
    { key: 'DELIVERED', label: 'Delivered', color: 'text-green-700' },
    { key: 'PICKED_UP', label: 'Picked Up', color: 'text-emerald-700' },
    { key: 'CANCELLED', label: 'Cancelled', color: 'text-red-700' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 font-sans">
          Bakery Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Real-time overview of Cake Box Kakinada operations.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Revenue"
          value={formatCurrency(o.today_revenue)}
          icon={IndianRupee}
          variant="emerald"
          sub="Live today"
        />
        <StatCard
          label="Total Orders"
          value={o.total}
          icon={ShoppingBag}
          variant="stone"
          sub={`${o.by_status['DELIVERED'] || 0} delivered`}
        />
        <StatCard
          label="Active Orders"
          value={active}
          icon={Clock}
          variant="amber"
          sub="In progress"
        />
        <StatCard
          label="Pending Enquiries"
          value={co.by_status['PENDING'] || 0}
          icon={Cake}
          variant="purple"
          sub="Custom cake requests"
        />
      </div>

      {/* Order Status Breakdown */}
      <SectionCard title="Order Status Breakdown" subtitle="All-time order distribution">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statusDisplay.map(({ key, label, color }) => {
            const count = o.by_status[key] || 0;
            return (
              <div
                key={key}
                className="text-center p-4 bg-stone-50/60 rounded-xl border border-stone-100"
              >
                <p className={`text-2xl font-bold ${color}`}>{count}</p>
                <p className="text-[11px] text-stone-500 mt-0.5 font-medium">{label}</p>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Revenue & Custom Cake Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="All-time Revenue" subtitle="Cumulative from all orders">
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-emerald-700">
              {formatCurrency(o.total_revenue)}
            </span>
            <span className="text-xs text-stone-400 mb-1">from {o.total} orders</span>
          </div>
          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
              Today
            </p>
            <span className="text-xl font-bold text-stone-900">
              {formatCurrency(o.today_revenue)}
            </span>
          </div>
        </SectionCard>

        <SectionCard title="Custom Cake Enquiries" subtitle="Bespoke order pipeline">
          <div className="space-y-2">
            {[
              { label: 'Pending Review', key: 'PENDING', color: 'bg-yellow-100 text-yellow-800' },
              { label: 'Accepted', key: 'ACCEPTED', color: 'bg-blue-100 text-blue-800' },
              { label: 'Quote Sent', key: 'QUOTED', color: 'bg-amber-100 text-amber-800' },
              { label: 'Confirmed', key: 'CONFIRMED', color: 'bg-green-100 text-green-800' },
              { label: 'Rejected', key: 'REJECTED', color: 'bg-red-100 text-red-800' },
            ].map(({ label, key, color }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-stone-600">{label}</span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${color}`}
                >
                  {co.by_status[key] || 0}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Catalogue Analytics */}
      <SectionCard
        title="Catalogue Summary"
        subtitle="Live product availability snapshot from the database"
        action={
          <Link
            to="/owner/products"
            className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
          >
            Manage Products <ExternalLink className="w-3 h-3" />
          </Link>
        }
      >
        {catalogueLoading ? (
          <div className="h-20 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
          </div>
        ) : !catalogueStats ? (
          <p className="text-xs text-stone-400 italic">Could not load catalogue data.</p>
        ) : (
          <div className="space-y-4">
            {/* Summary numbers */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Total Products', value: catalogueStats.total, color: 'text-stone-900' },
                { label: 'Available', value: catalogueStats.available, color: 'text-emerald-700' },
                { label: 'Unavailable', value: catalogueStats.unavailable, color: 'text-stone-500' },
                { label: 'Hidden', value: catalogueStats.hidden, color: 'text-stone-400' },
                { label: 'Variants', value: catalogueStats.variants, color: 'text-amber-700' },
                { label: 'Categories', value: catalogueStats.categories, color: 'text-blue-700' },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center p-3 bg-stone-50/60 rounded-xl border border-stone-100">
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-[10px] text-stone-500 mt-0.5 font-medium">{label}</p>
                </div>
              ))}
            </div>

            {/* Category Breakdown */}
            {catalogueStats.category_breakdown?.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                  Products by Category
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {catalogueStats.category_breakdown.map((cat: any) => (
                    <div key={cat.id} className="flex items-center justify-between px-3 py-2 bg-white border border-stone-100 rounded-lg">
                      <span className="text-xs text-stone-700 truncate pr-2">{cat.name}</span>
                      <span className="text-xs font-bold text-stone-900 shrink-0">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. ORDERS TAB
// ---------------------------------------------------------------------------

const OwnerOrdersTab: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    orderId: string;
    status: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.delivery_type = filterType;
      setOrders(await ownerService.getOrders(params));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    setConfirmAction(null);
    try {
      await ownerService.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = o.order_number?.toLowerCase().includes(q);
      const matchCustomer = (o.profiles?.full_name || '').toLowerCase().includes(q);
      if (!matchNum && !matchCustomer) return false;
    }
    return true;
  });

  const statusOptions = [
    'CONFIRMED',
    'PREPARING',
    'READY',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'PICKED_UP',
    'CANCELLED',
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Order Management" subtitle="View, filter, and update all customer orders." />

      {/* Controls */}
      <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order # or customer..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs border border-stone-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-amber-400 flex-1 sm:flex-none"
          >
            <option value="">All Statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs border border-stone-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-amber-400 flex-1 sm:flex-none"
          >
            <option value="">All Types</option>
            <option value="DELIVERY">Delivery</option>
            <option value="PICKUP">Pickup</option>
          </select>
          <button
            onClick={load}
            className="p-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState type="table" count={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders found"
          description="No orders match your current filters."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const nextStatuses = getNextStatuses(order.delivery_type, order.status);
            const isUpdating = updatingId === order.id;
            const isExpanded = expandedId === order.id;
            const customer = order.profiles as any;

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-stone-200/80 shadow-xs overflow-hidden"
              >
                {/* Order Header Row */}
                <div
                  className="p-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-stone-50/50 transition"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">
                        #{order.order_number}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          order.delivery_type === 'DELIVERY'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-teal-50 text-teal-700 border-teal-200'
                        }`}
                      >
                        {order.delivery_type}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-stone-400">{formatDateTime(order.created_at)}</p>
                    {customer && (
                      <p className="text-xs text-stone-600 flex items-center gap-1.5">
                        <User className="w-3 h-3 text-stone-400" />
                        {customer.full_name || 'Customer'}
                        {customer.phone && ` · ${customer.phone}`}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-stone-900 text-sm">
                      {formatCurrency(order.total)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-stone-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-stone-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-stone-100 p-4 space-y-4 bg-stone-50/30">
                    {/* Items */}
                    {order.order_items?.length > 0 && (
                      <div className="bg-white rounded-xl border border-stone-100 overflow-hidden">
                        <div className="px-4 py-2 bg-stone-50 border-b border-stone-100">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                            Order Items
                          </p>
                        </div>
                        <div className="divide-y divide-stone-50">
                          {order.order_items.map((item: any) => (
                            <div key={item.id} className="px-4 py-2.5 flex justify-between text-xs">
                              <span className="text-stone-700">
                                {item.quantity}× {item.product_name_snapshot}
                                <span className="text-stone-400 ml-1">({item.variant_name_snapshot})</span>
                              </span>
                              <span className="font-semibold text-stone-900">
                                {formatCurrency(item.line_total)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {order.customer_notes && (
                      <div className="bg-amber-50 rounded-xl px-4 py-2.5 border border-amber-100 text-xs text-stone-700">
                        <span className="font-semibold text-amber-700">Customer note: </span>
                        {order.customer_notes}
                      </div>
                    )}

                    {/* Delivery address */}
                    {order.delivery_type === 'DELIVERY' && order.delivery_address && (
                      <div className="text-xs text-stone-500 flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
                        <span>
                          {order.delivery_address.address_line1},{' '}
                          {order.delivery_address.city}
                        </span>
                      </div>
                    )}

                    {/* Status transition buttons */}
                    {nextStatuses.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
                        <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider self-center mr-1">
                          Move to:
                        </span>
                        {nextStatuses
                          .filter((s) => s !== 'CANCELLED')
                          .map((next) => (
                            <button
                              key={next}
                              onClick={() => setConfirmAction({ orderId: order.id, status: next })}
                              disabled={isUpdating}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-700 text-white font-semibold hover:bg-amber-800 disabled:opacity-50 transition"
                            >
                              {isUpdating ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <ArrowRight className="w-3 h-3" />
                              )}
                              {next.replace(/_/g, ' ')}
                            </button>
                          ))}
                        {nextStatuses.includes('CANCELLED') && (
                          <button
                            onClick={() =>
                              setConfirmAction({ orderId: order.id, status: 'CANCELLED' })
                            }
                            disabled={isUpdating}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 font-semibold hover:bg-red-100 disabled:opacity-50 transition"
                          >
                            <XCircle className="w-3 h-3" /> Cancel Order
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Status Transition Dialog */}
      <ConfirmDialog
        isOpen={Boolean(confirmAction)}
        title={
          confirmAction?.status === 'CANCELLED'
            ? 'Cancel Order?'
            : `Move to "${confirmAction?.status?.replace(/_/g, ' ')}"`
        }
        description={
          confirmAction?.status === 'CANCELLED'
            ? 'This will cancel the order. This action cannot be undone.'
            : `Update order status to "${confirmAction?.status?.replace(/_/g, ' ')}". The customer will see this change.`
        }
        confirmLabel={
          confirmAction?.status === 'CANCELLED' ? 'Yes, Cancel Order' : 'Confirm Update'
        }
        variant={confirmAction?.status === 'CANCELLED' ? 'danger' : 'primary'}
        loading={updatingId === confirmAction?.orderId}
        onConfirm={() =>
          confirmAction &&
          handleStatusUpdate(confirmAction.orderId, confirmAction.status)
        }
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3. CUSTOM CAKES TAB
// ---------------------------------------------------------------------------

const OwnerCustomCakesTab: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [quoteInputs, setQuoteInputs] = useState<Record<string, string>>({});
  const [notesInputs, setNotesInputs] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectConfirmId, setRejectConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setOrders(await ownerService.getCustomOrders(filterStatus || undefined));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpdate = async (
    id: string,
    payload: { status?: string; final_price?: number; owner_notes?: string }
  ) => {
    setUpdatingId(id);
    try {
      const updated = await ownerService.updateCustomOrder(id, payload);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const statusFilters = [
    { id: '', label: 'All' },
    { id: 'PENDING', label: 'Pending' },
    { id: 'ACCEPTED', label: 'Accepted' },
    { id: 'QUOTED', label: 'Quote Sent' },
    { id: 'CONFIRMED', label: 'Confirmed' },
    { id: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Cake Requests"
        subtitle="Review enquiries, accept or reject, send pricing quotes."
      />

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-xs flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          {statusFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                filterStatus === f.id
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={load}
          className="p-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <LoadingState type="card" count={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Cake}
          title="No custom cake enquiries"
          description="Custom cake enquiries from customers will appear here."
        />
      ) : (
        <div className="space-y-4">
          {orders.map((co) => {
            const customer = co.profiles as any;
            const isUpdating = updatingId === co.id;
            const isExpanded = expandedId === co.id;

            return (
              <div
                key={co.id}
                className="bg-white rounded-xl border border-stone-200/80 shadow-xs overflow-hidden"
              >
                {/* Header */}
                <div
                  className="p-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-stone-50/50 transition"
                  onClick={() => setExpandedId(isExpanded ? null : co.id)}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">
                        {co.occasion || 'Custom Cake'}
                      </span>
                      <StatusBadge status={co.status} />
                    </div>
                    <p className="text-xs text-stone-400">
                      Event: {co.required_date ? formatDate(co.required_date) : 'TBD'}
                      {co.preferred_time && ` at ${co.preferred_time}`}
                    </p>
                    {customer && (
                      <p className="text-xs text-stone-600 flex items-center gap-1.5">
                        <User className="w-3 h-3 text-stone-400" />
                        {customer.full_name || 'Customer'} · {co.mobile_number}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {co.final_price && (
                      <span className="text-sm font-bold text-stone-900">
                        {formatCurrency(co.final_price)}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-stone-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-stone-400" />
                    )}
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-stone-100 p-4 space-y-4 bg-stone-50/30">
                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Flavour', val: co.flavour },
                        { label: 'Weight', val: co.weight },
                        { label: 'Theme', val: co.theme },
                        { label: 'Delivery Type', val: co.delivery_type },
                        { label: 'Message on Cake', val: co.cake_message },
                      ]
                        .filter((r) => r.val)
                        .map(({ label, val }) => (
                          <div key={label} className="bg-white rounded-lg p-2.5 border border-stone-100">
                            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
                              {label}
                            </p>
                            <p className="text-xs font-medium text-stone-800 mt-0.5">{val}</p>
                          </div>
                        ))}
                    </div>

                    {co.additional_requirements && (
                      <div className="text-xs text-stone-600 bg-stone-50 rounded-xl px-3 py-2.5 border border-stone-100">
                        <span className="font-semibold">Additional Requirements: </span>
                        {co.additional_requirements}
                      </div>
                    )}

                    {/* Internal Notes */}
                    <div>
                      <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                        Internal Notes
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={notesInputs[co.id] ?? (co.owner_notes || '')}
                          onChange={(e) =>
                            setNotesInputs((prev) => ({
                              ...prev,
                              [co.id]: e.target.value,
                            }))
                          }
                          placeholder="Add internal notes..."
                          className="flex-1 text-xs border border-stone-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-400"
                        />
                        <button
                          onClick={() =>
                            handleUpdate(co.id, {
                              owner_notes:
                                notesInputs[co.id] ?? co.owner_notes,
                            })
                          }
                          disabled={isUpdating}
                          className="px-3 py-1.5 rounded-lg bg-stone-100 text-stone-700 text-xs font-semibold hover:bg-stone-200 transition disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-stone-100 flex flex-wrap gap-2">
                      {co.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdate(co.id, { status: 'ACCEPTED' })}
                            disabled={isUpdating}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 font-semibold hover:bg-green-100 disabled:opacity-50 transition"
                          >
                            <Check className="w-3 h-3" /> Accept
                          </button>
                          <button
                            onClick={() => setRejectConfirmId(co.id)}
                            disabled={isUpdating}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 font-semibold hover:bg-red-100 disabled:opacity-50 transition"
                          >
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                        </>
                      )}

                      {co.status === 'ACCEPTED' && (
                        <div className="flex items-end gap-2 w-full">
                          <div className="flex-1">
                            <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
                              Quote Price (₹)
                            </label>
                            <input
                              type="number"
                              min={1}
                              value={quoteInputs[co.id] || ''}
                              onChange={(e) =>
                                setQuoteInputs((prev) => ({
                                  ...prev,
                                  [co.id]: e.target.value,
                                }))
                              }
                              placeholder="e.g. 750"
                              className="w-full text-sm border border-amber-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 bg-amber-50"
                            />
                          </div>
                          <button
                            onClick={() => {
                              const price = parseFloat(quoteInputs[co.id]);
                              if (isNaN(price) || price <= 0) {
                                alert('Enter a valid price.');
                                return;
                              }
                              handleUpdate(co.id, {
                                status: 'QUOTED',
                                final_price: price,
                              });
                            }}
                            disabled={isUpdating || !quoteInputs[co.id]}
                            className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-lg bg-amber-700 text-white font-semibold hover:bg-amber-800 disabled:opacity-50 transition"
                          >
                            {isUpdating ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <IndianRupee className="w-3.5 h-3.5" />
                            )}
                            Send Quote
                          </button>
                        </div>
                      )}

                      {co.status === 'QUOTED' && co.final_price && (
                        <div className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Quote sent: {formatCurrency(co.final_price)} — awaiting customer
                          confirmation
                        </div>
                      )}

                      {co.status === 'CONFIRMED' && (
                        <div className="text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Customer confirmed — {formatCurrency(co.final_price || 0)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Reject Custom Cake Dialog */}
      <ConfirmDialog
        isOpen={Boolean(rejectConfirmId)}
        title="Reject Custom Cake Enquiry?"
        description="Are you sure you want to reject this custom cake enquiry? The customer will be notified that the bakery cannot fulfill this request."
        confirmLabel="Yes, Reject Enquiry"
        variant="danger"
        onConfirm={() => {
          if (rejectConfirmId) {
            handleUpdate(rejectConfirmId, { status: 'REJECTED' });
            setRejectConfirmId(null);
          }
        }}
        onCancel={() => setRejectConfirmId(null)}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Availability Badge Helper
// ---------------------------------------------------------------------------

function AvailabilityBadge({ availability }: { availability: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    AVAILABLE: { label: 'Available', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    UNAVAILABLE: { label: 'Unavailable', cls: 'bg-stone-100 text-stone-600 border-stone-300' },
    HIDDEN: { label: 'Hidden', cls: 'bg-stone-50 text-stone-400 border-stone-200' },
  };
  const { label, cls } = map[availability] || { label: availability, cls: 'bg-stone-100 text-stone-600 border-stone-200' };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// 4. PRODUCTS TAB — Professional catalogue management
// ---------------------------------------------------------------------------

const OwnerProductsTab: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [catalogueStats, setCatalogueStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);
  const [editingVariant, setEditingVariant] = useState<{ id: string; name: string; price: number } | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [showAddWarning, setShowAddWarning] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    category_id: '',
    variant_name: 'Standard',
    price: '',
    availability: 'AVAILABLE',
  });
  const [addSaving, setAddSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [prods, cats, stats] = await Promise.all([
        ownerService.getProducts({
          category_id: filterCategory || undefined,
          search: search.trim() || undefined,
          availability: filterAvailability || undefined,
        }),
        ownerService.getCategories(),
        ownerService.getCatalogueStats(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setCatalogueStats(stats);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterAvailability, search]);

  // Debounce search
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchInput = (val: string) => {
    setSearch(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(load, 500);
  };

  useEffect(() => {
    load();
  }, [filterCategory, filterAvailability]);

  // Cycle availability: AVAILABLE → UNAVAILABLE → HIDDEN → AVAILABLE
  const handleCycleAvailability = async (productId: string, current: string) => {
    const cycle: Record<string, 'AVAILABLE' | 'UNAVAILABLE' | 'HIDDEN'> = {
      AVAILABLE: 'UNAVAILABLE',
      UNAVAILABLE: 'HIDDEN',
      HIDDEN: 'AVAILABLE',
    };
    const next = cycle[current] || 'UNAVAILABLE';
    setTogglingId(productId);
    try {
      await ownerService.updateProductAvailability(productId, next);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, availability: next } : p))
      );
      // Refresh stats count after change
      ownerService.getCatalogueStats().then(setCatalogueStats).catch(() => {});
    } catch (e: any) {
      alert(e.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleFeatured = async (productId: string, currentFeatured: boolean, availability: string) => {
    if (!currentFeatured && availability !== 'AVAILABLE') {
      alert('Only AVAILABLE products can be marked as Featured.');
      return;
    }
    setTogglingFeaturedId(productId);
    try {
      await ownerService.updateProductFeatured(productId, !currentFeatured);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, is_featured: !currentFeatured } : p))
      );
    } catch (e: any) {
      alert(e.message || 'Failed to update featured status');
    } finally {
      setTogglingFeaturedId(null);
    }
  };

  const handleSavePrice = async () => {
    if (!editingVariant) return;
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      alert('Enter a valid price.');
      return;
    }
    setSavingPrice(true);
    try {
      await ownerService.updateVariantPrice(editingVariant.id, price);
      setProducts((prev) =>
        prev.map((p) => ({
          ...p,
          product_variants: p.product_variants?.map((v: any) =>
            v.id === editingVariant.id ? { ...v, price } : v
          ),
          variants: p.variants?.map((v: any) =>
            v.id === editingVariant.id ? { ...v, price } : v
          ),
        }))
      );
      setEditingVariant(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingPrice(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.category_id || !addForm.price) return;
    const price = parseFloat(addForm.price);
    if (isNaN(price) || price <= 0) { alert('Enter a valid price.'); return; }
    setAddSaving(true);
    try {
      // NOTE: This creates a manual product. Owner has been warned about catalogue provenance.
      // The product is created via Supabase directly (service role not exposed — this uses anon key + RLS owner check)
      // For now we inform the owner this must be done through the data pipeline and close the form.
      alert('To add new approved catalogue items, please use the data import script (scripts/) or contact your developer. Only import verified Cake Box Kakinada menu items.');
      setShowAddForm(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAddSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900">Products</h2>
          <p className="text-xs text-stone-500 mt-0.5">Manage catalogue availability and variant pricing.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddWarning(true)}
            className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg bg-stone-900 text-white font-semibold hover:bg-stone-800 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Product
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      {catalogueStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total', value: catalogueStats.total, color: 'text-stone-900' },
            { label: 'Available', value: catalogueStats.available, color: 'text-emerald-700' },
            { label: 'Unavailable', value: catalogueStats.unavailable, color: 'text-stone-600' },
            { label: 'Hidden', value: catalogueStats.hidden, color: 'text-stone-400' },
            { label: 'Variants', value: catalogueStats.variants, color: 'text-amber-700' },
            { label: 'Categories', value: catalogueStats.categories, color: 'text-blue-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-stone-200/80 shadow-xs px-4 py-3 text-center">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-[10px] text-stone-500 font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Controls Toolbar */}
      <div className="bg-white rounded-xl border border-stone-200/80 p-3 shadow-xs flex flex-wrap gap-2 items-center">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="text-xs border border-stone-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-amber-400 flex-1 sm:flex-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={filterAvailability}
          onChange={(e) => setFilterAvailability(e.target.value)}
          className="text-xs border border-stone-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-amber-400 flex-1 sm:flex-none"
        >
          <option value="">All Availability</option>
          <option value="AVAILABLE">Available</option>
          <option value="UNAVAILABLE">Unavailable</option>
          <option value="HIDDEN">Hidden</option>
        </select>

        {(filterCategory || filterAvailability || search) && (
          <button
            onClick={() => { setFilterCategory(''); setFilterAvailability(''); setSearch(''); }}
            className="text-xs text-stone-500 hover:text-stone-800 px-2 py-1.5 rounded-lg hover:bg-stone-100 transition flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}

        <button
          onClick={load}
          className="p-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition ml-auto"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <LoadingState type="table" count={8} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : products.length === 0 ? (
        <EmptyState icon={Package} title="No products found" description="Try adjusting your filters." />
      ) : (
        <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs overflow-hidden">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] px-4 py-2.5 bg-stone-50 border-b border-stone-100 text-[10px] font-bold uppercase tracking-wider text-stone-400 gap-3">
            <span>Product</span>
            <span>Category</span>
            <span>Variants</span>
            <span>Price</span>
            <span>Availability</span>
            <span>Source</span>
            <span className="w-28 text-right">Actions</span>
          </div>

          <div className="divide-y divide-stone-100">
            {products.map((product) => {
              const isExpanded = expandedProductId === product.id;
              const isToggling = togglingId === product.id;
              // Support both server response shapes
              const variants = product.product_variants || product.variants || [];
              const primaryVariant = variants[0];
              const displayPrice = primaryVariant?.price ?? product.price ?? null;
              const source = product.source || primaryVariant?.source || 'Cake_Box_Kakinada_Menu.xlsx';
              const isMenuSource = source?.toLowerCase().includes('menu') || source?.toLowerCase().includes('xlsx');

              return (
                <div key={product.id}>
                  {/* Main Row */}
                  <div className="px-4 py-3 grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-3 items-center">
                    {/* Product */}
                    <div className="flex items-center gap-3 min-w-0">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-9 h-9 rounded-lg object-cover shrink-0 border border-stone-100"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                          <Cake className="w-4 h-4 text-stone-300" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-stone-900 text-sm truncate">{product.name}</p>
                          {product.is_featured && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-100 text-amber-800 shrink-0">
                              <Star className="w-2.5 h-2.5 fill-amber-600 text-amber-600" /> Featured
                            </span>
                          )}
                        </div>
                        {product.veg_status && (
                          <span className={`text-[9px] font-bold uppercase ${
                            product.veg_status.toLowerCase().includes('non') ? 'text-rose-600' : 'text-emerald-600'
                          }`}>
                            {product.veg_status}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Category */}
                    <div className="hidden md:block">
                      <span className="text-xs text-stone-500 truncate block">
                        {product.category?.name || '—'}
                      </span>
                    </div>

                    {/* Variants */}
                    <div className="hidden md:block">
                      <span className="text-xs font-medium text-stone-700">
                        {variants.length} {variants.length === 1 ? 'variant' : 'variants'}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="hidden md:block">
                      {displayPrice !== null ? (
                        <span className="text-xs font-bold text-stone-900">
                          ₹{Number(displayPrice).toFixed(0)}
                          {variants.length > 1 && <span className="text-stone-400 font-normal"> onwards</span>}
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400 italic">—</span>
                      )}
                    </div>

                    {/* Availability */}
                    <div className="hidden md:block">
                      <AvailabilityBadge availability={product.availability} />
                    </div>

                    {/* Source */}
                    <div className="hidden md:block">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isMenuSource
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {isMenuSource ? 'Approved Menu' : 'Manual'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 justify-end shrink-0">
                      {/* Featured Toggle */}
                      <button
                        onClick={() => handleToggleFeatured(product.id, !!product.is_featured, product.availability)}
                        disabled={togglingFeaturedId === product.id || (product.availability !== 'AVAILABLE' && !product.is_featured)}
                        title={
                          product.is_featured
                            ? 'Featured on Home (Popular Picks). Click to unfeature.'
                            : product.availability === 'AVAILABLE'
                            ? 'Feature on Home (Popular Picks)'
                            : 'Only AVAILABLE products can be featured'
                        }
                        className={`p-1.5 rounded-lg transition disabled:opacity-30 ${
                          product.is_featured
                            ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700'
                            : 'text-stone-300 hover:text-amber-600 hover:bg-stone-100'
                        }`}
                      >
                        {togglingFeaturedId === product.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Star className={`w-4 h-4 ${product.is_featured ? 'fill-amber-500 text-amber-500' : ''}`} />
                        )}
                      </button>

                      {/* Cycle Availability */}
                      <button
                        onClick={() => handleCycleAvailability(product.id, product.availability)}
                        disabled={isToggling}
                        title={`Currently ${product.availability}. Click to cycle.`}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition disabled:opacity-50"
                      >
                        {isToggling ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : product.availability === 'HIDDEN' ? (
                          <EyeOff className="w-4 h-4" />
                        ) : product.availability === 'AVAILABLE' ? (
                          <ToggleRight className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-stone-400" />
                        )}
                      </button>

                      {/* Expand Variants */}
                      <button
                        onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                        title="Manage variants"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {/* View Product */}
                      <a
                        href={`/product/${product.slug || product.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-stone-400 hover:text-amber-700 hover:bg-amber-50 transition"
                        title="View in storefront"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Mobile pill row */}
                  <div className="md:hidden px-4 pb-3 -mt-1 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-stone-400">{product.category?.name}</span>
                    <AvailabilityBadge availability={product.availability} />
                    {product.is_featured && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Featured
                      </span>
                    )}
                    {displayPrice !== null && (
                      <span className="text-xs font-bold text-stone-900">₹{Number(displayPrice).toFixed(0)}</span>
                    )}
                  </div>

                  {/* Expanded Variants */}
                  {isExpanded && variants.length > 0 && (
                    <div className="border-t border-stone-100 bg-stone-50/40">
                      <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        Variants
                      </div>
                      {variants.map((v: any) => (
                        <div
                          key={v.id}
                          className="px-4 py-2.5 flex items-center justify-between gap-3 border-t border-stone-100/70"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Tag className="w-3.5 h-3.5 text-stone-300 shrink-0" />
                            <span className="text-xs text-stone-700 flex-1 truncate">{v.name}</span>
                            <AvailabilityBadge availability={v.availability || 'AVAILABLE'} />
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-stone-900">
                              ₹{Number(v.price).toFixed(0)}
                            </span>
                            <button
                              onClick={() => {
                                setEditingVariant({ id: v.id, name: v.name, price: v.price });
                                setNewPrice(String(v.price));
                              }}
                              className="p-1 rounded text-stone-400 hover:text-amber-700 hover:bg-amber-50 transition"
                              title="Edit price"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Price Modal */}
      {editingVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900">Edit Variant Price</h3>
              <button
                onClick={() => setEditingVariant(null)}
                className="p-1 rounded text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-stone-600 mb-4">
              <span className="font-semibold">{editingVariant.name}</span>
            </p>
            <div className="mb-4">
              <label className="text-xs font-semibold text-stone-600 block mb-1.5">
                New Price (₹)
              </label>
              <input
                type="number"
                min={1}
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingVariant(null)}
                className="flex-1 px-4 py-2 text-sm rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrice}
                disabled={savingPrice || !newPrice}
                className="flex-1 px-4 py-2 text-sm rounded-xl bg-amber-700 text-white font-semibold hover:bg-amber-800 disabled:opacity-50 transition"
              >
                {savingPrice ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Save Price'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product — Catalogue Provenance Warning Dialog */}
      <ConfirmDialog
        isOpen={showAddWarning}
        title="Add Product — Important Notice"
        description="Cake Box Kakinada's product catalogue was imported from the approved menu spreadsheet (Cake_Box_Kakinada_Menu.xlsx). Manually created products that are NOT from the verified catalogue must NOT be published to customers. Only use this for items explicitly confirmed by bakery management. Proceed only if you have verified this item against the approved menu."
        confirmLabel="I understand — Proceed"
        variant="primary"
        onConfirm={() => { setShowAddWarning(false); setShowAddForm(true); }}
        onCancel={() => setShowAddWarning(false)}
      />

      {/* Add Product Form — gated behind warning */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-stone-900">Add Verified Product</h3>
              <button onClick={() => setShowAddForm(false)} className="p-1 rounded text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Strong provenance warning */}
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
              <p className="text-[11px] text-amber-800 leading-relaxed">
                <strong>Catalogue Warning:</strong> Only add items verified against the approved Cake Box Kakinada menu. Unverified products must not be published to customers.
              </p>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Product Name (from approved menu)</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Black Forest Cake"
                  className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Category</label>
                <select
                  required
                  value={addForm.category_id}
                  onChange={(e) => setAddForm({ ...addForm, category_id: e.target.value })}
                  className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Variant Name</label>
                  <input
                    type="text"
                    required
                    value={addForm.variant_name}
                    onChange={(e) => setAddForm({ ...addForm, variant_name: e.target.value })}
                    placeholder="Standard"
                    className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={addForm.price}
                    onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
                    placeholder="0"
                    className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">Availability</label>
                <select
                  value={addForm.availability}
                  onChange={(e) => setAddForm({ ...addForm, availability: e.target.value })}
                  className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="UNAVAILABLE">Unavailable</option>
                  <option value="HIDDEN">Hidden</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 text-sm rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSaving}
                  className="flex-1 px-4 py-2 text-sm rounded-xl bg-amber-700 text-white font-semibold hover:bg-amber-800 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {addSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to Catalogue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 5. CATEGORIES TAB
// ---------------------------------------------------------------------------

const OwnerCategoriesTab: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCategories(await ownerService.getCategories());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Categories"
        subtitle={`${categories.length} categories in your catalogue.`}
      />

      {loading ? (
        <LoadingState type="table" count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : (
        <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs overflow-hidden">
          <div className="divide-y divide-stone-100">
            {categories.map((cat, idx) => (
              <div key={cat.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-600 text-[11px] font-bold flex items-center justify-center shrink-0">
                    {cat.display_order || idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-stone-900 text-sm truncate">{cat.name}</p>
                    {cat.description && (
                      <p className="text-[11px] text-stone-400 truncate">{cat.description}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-stone-100 text-stone-700 rounded-full shrink-0">
                  {cat.product_count ?? 0} products
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 6. CUSTOMERS TAB
// ---------------------------------------------------------------------------

const OwnerCustomersTab: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCustomers(await ownerService.getCustomers());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.full_name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} registered customers.`}
      />

      <div className="bg-white rounded-xl border border-stone-200/80 p-4 shadow-xs flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:border-amber-500"
          />
        </div>
        <button
          onClick={load}
          className="p-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <LoadingState type="table" count={8} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No customers found" description="Registered customers will appear here." />
      ) : (
        <div className="bg-white rounded-xl border border-stone-200/80 shadow-xs overflow-hidden">
          {/* Desktop header */}
          <div className="hidden sm:grid grid-cols-4 px-5 py-3 bg-stone-50 border-b border-stone-100 text-[11px] font-bold uppercase tracking-wider text-stone-400">
            <span>Customer</span>
            <span>Contact</span>
            <span className="text-center">Orders</span>
            <span className="text-right">Total Spent</span>
          </div>

          <div className="divide-y divide-stone-100">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="px-5 py-3.5 grid sm:grid-cols-4 gap-2 sm:gap-0 items-center"
              >
                <div>
                  <p className="font-semibold text-stone-900 text-xs sm:text-sm">
                    {c.full_name || '—'}
                  </p>
                  <p className="text-[11px] text-stone-400 truncate">{c.email}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-stone-600">
                  {c.phone ? (
                    <>
                      <Phone className="w-3 h-3 text-stone-400" />
                      {c.phone}
                    </>
                  ) : (
                    <span className="text-stone-300 italic">No phone</span>
                  )}
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-stone-800">
                    {c.order_count || 0}
                  </span>
                  <span className="text-[10px] text-stone-400 ml-1 sm:hidden">orders</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-700">
                    {formatCurrency(c.total_spend || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 7. DELIVERY & PICKUP TAB
// ---------------------------------------------------------------------------

const OwnerDeliveryTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery & Pickup"
        subtitle="Verified operational configuration for Cake Box Kakinada."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Delivery Configuration" subtitle="Active delivery rules">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2.5 border-b border-stone-100">
              <div className="flex items-center gap-2 text-xs text-stone-600">
                <MapPin className="w-4 h-4 text-amber-600" />
                <span>Maximum Delivery Radius</span>
              </div>
              <span className="text-sm font-bold text-stone-900">10 km</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-stone-100">
              <div className="flex items-center gap-2 text-xs text-stone-600">
                <IndianRupee className="w-4 h-4 text-amber-600" />
                <span>Delivery Charge</span>
              </div>
              <span className="text-sm font-bold text-stone-900">₹7 per km</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2 text-xs text-stone-600">
                <Truck className="w-4 h-4 text-amber-600" />
                <span>Free Delivery Threshold</span>
              </div>
              <span className="text-sm font-bold text-stone-500 italic">None</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Pickup Configuration" subtitle="In-store pickup settings">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2.5 border-b border-stone-100">
              <div className="flex items-center gap-2 text-xs text-stone-600">
                <IndianRupee className="w-4 h-4 text-teal-600" />
                <span>Pickup Charge</span>
              </div>
              <span className="text-sm font-bold text-green-700">Free (₹0)</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-stone-100">
              <div className="flex items-center gap-2 text-xs text-stone-600">
                <MapPin className="w-4 h-4 text-teal-600" />
                <span>Pickup Location</span>
              </div>
              <span className="text-xs font-semibold text-stone-700 text-right max-w-[160px]">
                Cake Box Store, Kakinada
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2 text-xs text-stone-600">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Available Hours</span>
              </div>
              <span className="text-sm font-bold text-stone-900">10 AM – 10 PM</span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Order Lifecycle */}
      <SectionCard title="Order Lifecycle Reference" subtitle="Status flow for each fulfilment type">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              type: 'Delivery Orders',
              color: 'orange',
              steps: ['CONFIRMED', 'PREPARING', 'OUT FOR DELIVERY', 'DELIVERED'],
            },
            {
              type: 'Pickup Orders',
              color: 'teal',
              steps: ['CONFIRMED', 'PREPARING', 'READY FOR PICKUP', 'PICKED UP'],
            },
          ].map(({ type, color, steps }) => (
            <div key={type} className={`bg-${color}-50/50 rounded-xl p-4 border border-${color}-100`}>
              <p className={`text-xs font-bold text-${color}-700 mb-3`}>{type}</p>
              <div className="flex flex-col gap-1.5">
                {steps.map((step, idx) => (
                  <div key={step} className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full bg-${color}-100 text-${color}-700 text-[11px] font-bold flex items-center justify-center shrink-0`}
                    >
                      {idx + 1}
                    </div>
                    <span className="text-xs text-stone-700 font-medium">{step}</span>
                    {idx < steps.length - 1 && (
                      <ArrowRight className={`w-3 h-3 text-${color}-400 ml-auto`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 8. SETTINGS TAB
// ---------------------------------------------------------------------------

const OwnerSettingsTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Settings"
        subtitle="Verified configuration for Cake Box Kakinada."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Business Information" subtitle="Store details">
          <div className="space-y-3 text-sm">
            {[
              { label: 'Business Name', value: 'Cake Box Kakinada' },
              { label: 'Location', value: 'Kakinada, Andhra Pradesh' },
              { label: 'Phone', value: '+91 99939 99528' },
              { label: 'Service Area', value: 'Kakinada city (within 10 km)' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4 py-2 border-b border-stone-100 last:border-0">
                <span className="text-xs text-stone-500 shrink-0">{label}</span>
                <span className="text-xs font-semibold text-stone-800 text-right">{value}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Operating Hours" subtitle="Store open hours">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-stone-100">
              <span className="text-stone-500">Monday – Sunday</span>
              <span className="font-bold text-stone-900">10:00 AM – 10:00 PM</span>
            </div>
            <div className="py-2 bg-amber-50 rounded-lg px-3 border border-amber-100 text-amber-800 text-[11px]">
              <Info className="w-3.5 h-3.5 inline mr-1.5" />
              Open every day of the week, including public holidays.
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Policies" subtitle="Business and customer service policies">
        <div className="space-y-4 text-xs text-stone-700 leading-relaxed">
          <div>
            <p className="font-bold text-stone-900 mb-1">Cancellation Policy</p>
            <p>
              Orders can be cancelled before they reach the PREPARING status. Once the bakery
              begins preparation, cancellations may not be possible. Please contact the store
              at +91 99939 99528 for assistance.
            </p>
          </div>
          <div className="border-t border-stone-100 pt-3">
            <p className="font-bold text-stone-900 mb-1">Refund Policy</p>
            <p>
              Refunds are evaluated on a case-by-case basis. Quality issues reported within 2
              hours of delivery or pickup may be eligible for a replacement or store credit.
              Contact us directly.
            </p>
          </div>
          <div className="border-t border-stone-100 pt-3">
            <p className="font-bold text-stone-900 mb-1">Custom Cake Policy</p>
            <p>
              Custom cakes require a confirmed quotation before preparation begins. Payment terms
              are agreed upon acceptance of the quote. Minimum 24–48 hours notice required
              depending on complexity.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 9. AI KNOWLEDGE TAB
// ---------------------------------------------------------------------------

const OwnerKnowledgeTab: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setStats(await ownerService.getKnowledgeStats());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Knowledge Base"
        subtitle="RAG knowledge base powering the Cake Box AI Assistant."
      />

      {loading ? (
        <LoadingState type="stats" />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Chunks"
              value={stats.total_chunks || 0}
              icon={BookOpen}
              variant="amber"
            />
            <StatCard
              label="DOCX Chunks"
              value={stats.sources?.['docx:master_info'] ?? stats.by_source?.['docx:master_info'] ?? 0}
              icon={FileText}
              variant="stone"
              sub="Master info document"
            />
            <StatCard
              label="XLSX Chunks"
              value={stats.sources?.['xlsx:menu'] ?? stats.by_source?.['xlsx:menu'] ?? 0}
              icon={Table2}
              variant="purple"
              sub="Menu data"
            />
            <StatCard
              label="With Embeddings"
              value={stats.embedded_chunks ?? stats.chunks_with_embeddings ?? stats.total_chunks ?? 0}
              icon={Cpu}
              variant="emerald"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectionCard title="Embedding Model" subtitle="Active AI embedding configuration">
              <div className="space-y-3 text-xs">
                {[
                  { label: 'Model', value: 'gemini-embedding-2' },
                  { label: 'Dimensions', value: '768' },
                  { label: 'Provider', value: 'Google Gemini API' },
                  { label: 'Storage', value: 'Supabase pgvector' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-1.5 border-b border-stone-100 last:border-0">
                    <span className="text-stone-500">{label}</span>
                    <span className="font-semibold text-stone-800">{value}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Knowledge Sources" subtitle="Indexed document breakdown">
              <div className="space-y-3">
                {[
                  {
                    label: 'Master Information Doc',
                    source: 'docx:master_info',
                    icon: FileText,
                    color: 'text-blue-700',
                    bg: 'bg-blue-50',
                  },
                  {
                    label: 'Menu & Pricing Sheet',
                    source: 'xlsx:menu',
                    icon: Table2,
                    color: 'text-green-700',
                    bg: 'bg-green-50',
                  },
                ].map(({ label, source, icon: Icon, color, bg }) => {
                  const count = (stats.sources?.[source] ?? stats.by_source?.[source]) || 0;
                  return (
                    <div
                      key={source}
                      className="flex items-center justify-between p-3 rounded-xl border border-stone-100 bg-stone-50/50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}
                        >
                          <Icon className={`w-4 h-4 ${color}`} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-stone-800">{label}</p>
                          <p className="text-[11px] text-stone-400">{source}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-stone-900">{count} chunks</span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="System Status" subtitle="Live AI assistant health">
            <div className="space-y-2">
              {[
                { label: 'RAG table (rag_knowledge_base)', status: 'Active' },
                { label: 'pgvector extension', status: 'Enabled' },
                { label: 'Gemini API key', status: 'Server-side only' },
                { label: 'Chat endpoint (/api/chat)', status: 'Operational' },
                { label: 'Product prices', status: 'Live DB (not from RAG)' },
              ].map(({ label, status }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0 text-xs"
                >
                  <span className="text-stone-600">{label}</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      ) : null}
    </div>
  );
};

// ---------------------------------------------------------------------------
// MAIN OWNER DASHBOARD PAGE
// ---------------------------------------------------------------------------

const ROUTE_META: Record<
  string,
  { breadcrumb: string }
> = {
  '/owner': { breadcrumb: '' },
  '/owner/orders': { breadcrumb: 'Orders' },
  '/owner/custom-cakes': { breadcrumb: 'Custom Cakes' },
  '/owner/products': { breadcrumb: 'Products' },
  '/owner/categories': { breadcrumb: 'Categories' },
  '/owner/customers': { breadcrumb: 'Customers' },
  '/owner/delivery': { breadcrumb: 'Delivery & Pickup' },
  '/owner/settings': { breadcrumb: 'Settings' },
  '/owner/knowledge': { breadcrumb: 'AI Knowledge' },
};

export const OwnerDashboardPage: React.FC = () => {
  const { role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [statsError, setStatsError] = useState('');

  // Role guard
  useEffect(() => {
    if (!authLoading && role !== 'OWNER') {
      navigate('/', { replace: true });
    }
  }, [role, authLoading, navigate]);

  useEffect(() => {
    if (role !== 'OWNER') return;
    ownerService
      .getStats()
      .then(setStats)
      .catch((e) => setStatsError(e.message));
  }, [role]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }
  if (role !== 'OWNER') return null;

  const pathname = location.pathname.replace(/\/$/, '') || '/owner';
  const meta = ROUTE_META[pathname] || { breadcrumb: '' };
  const breadcrumbs = meta.breadcrumb ? [{ label: meta.breadcrumb }] : [];

  const renderContent = () => {
    if (pathname === '/owner') {
      return <OwnerOverviewTab stats={stats} error={statsError} />;
    }
    if (pathname === '/owner/orders') return <OwnerOrdersTab />;
    if (pathname === '/owner/custom-cakes') return <OwnerCustomCakesTab />;
    if (pathname === '/owner/products') return <OwnerProductsTab />;
    if (pathname === '/owner/categories') return <OwnerCategoriesTab />;
    if (pathname === '/owner/customers') return <OwnerCustomersTab />;
    if (pathname === '/owner/delivery') return <OwnerDeliveryTab />;
    if (pathname === '/owner/settings') return <OwnerSettingsTab />;
    if (pathname === '/owner/knowledge') return <OwnerKnowledgeTab />;

    // Unrecognised sub-route → redirect
    return (
      <div className="text-center py-16">
        <p className="text-stone-500 text-sm">Page not found in owner portal.</p>
        <button
          onClick={() => navigate('/owner')}
          className="mt-3 text-xs text-amber-700 font-semibold hover:underline"
        >
          Go to Overview
        </button>
      </div>
    );
  };

  return (
    <DashboardLayout
      role="OWNER"
      baseHref="/owner"
      baseLabel="Owner Portal"
      breadcrumbs={breadcrumbs}
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default OwnerDashboardPage;

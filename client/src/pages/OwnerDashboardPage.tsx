import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Cake,
  Clock,
  XCircle,
  RefreshCw,
  IndianRupee,
  Package,
  User,
  ArrowRight,
  AlertCircle,
  Check,
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ownerService, type OwnerStats } from '../services/apiService';
import { Spinner } from '../components/ui/Spinner';
import { REGULAR_ORDER_RULES } from '../config/businessPolicy';

type OwnerTab = 'overview' | 'orders' | 'custom-orders';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PENDING: { label: 'Pending', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    CONFIRMED: { label: 'Confirmed', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    PREPARING: { label: 'Preparing', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
    READY: { label: 'Ready', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
    OUT_FOR_DELIVERY: { label: 'Out for Delivery', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
    DELIVERED: { label: 'Delivered', cls: 'bg-green-50 text-green-700 border-green-200' },
    PICKED_UP: { label: 'Picked Up', cls: 'bg-green-50 text-green-700 border-green-200' },
    CANCELLED: { label: 'Cancelled', cls: 'bg-red-50 text-red-700 border-red-200' },
    ACCEPTED: { label: 'Accepted', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    QUOTED: { label: 'Quote Sent', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    REJECTED: { label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'bg-stone-50 text-stone-600 border-stone-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  );
}

function getNextStatuses(deliveryType: 'DELIVERY' | 'PICKUP', currentStatus: string): string[] {
  const transitions = REGULAR_ORDER_RULES.statusTransitions[deliveryType] as Record<string, readonly string[]>;
  return [...(transitions?.[currentStatus] || [])];
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.replace('text-', 'bg-').replace('-700', '-50').replace('-600', '-50')}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview Tab
// ---------------------------------------------------------------------------

function OverviewTab({ stats }: { stats: OwnerStats | null }) {
  if (!stats) return <div className="flex justify-center py-12"><Spinner /></div>;

  const { orders: o, custom_orders: co } = stats;
  const active = (o.by_status['CONFIRMED'] || 0) + (o.by_status['PREPARING'] || 0) +
    (o.by_status['OUT_FOR_DELIVERY'] || 0) + (o.by_status['READY'] || 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Today's Revenue" value={`₹${o.today_revenue.toFixed(0)}`} icon={IndianRupee} color="text-green-700" />
        <StatCard label="Total Orders" value={o.total} sub={`${o.by_status['DELIVERED'] || 0} delivered`} icon={Package} color="text-blue-700" />
        <StatCard label="Active Orders" value={active} sub="In progress" icon={Clock} color="text-amber-700" />
        <StatCard label="Custom Enquiries" value={co.by_status['PENDING'] || 0} sub="Awaiting review" icon={Cake} color="text-purple-700" />
      </div>

      {/* Order status breakdown */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-stone-800 mb-4">Order Status Breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(o.by_status).map(([status, count]) => (
            <div key={status} className="text-center p-3 bg-stone-50 rounded-xl">
              <p className="text-xl font-bold text-stone-900">{count}</p>
              <p className="text-[11px] text-stone-500 mt-0.5">{status.replace(/_/g, ' ')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue summary */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5">
        <h3 className="text-sm font-bold text-stone-800 mb-1">All-time Revenue</h3>
        <p className="text-3xl font-bold text-green-700">₹{o.total_revenue.toFixed(0)}</p>
        <p className="text-xs text-stone-400 mt-1">From {o.total} total orders</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Orders Tab
// ---------------------------------------------------------------------------

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  useEffect(() => { load(); }, [load]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await ownerService.updateOrderStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="text-sm border border-stone-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-amber-400"
        >
          <option value="">All Statuses</option>
          {['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'PICKED_UP', 'CANCELLED'].map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="text-sm border border-stone-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-amber-400"
        >
          <option value="">All Types</option>
          <option value="DELIVERY">Delivery</option>
          <option value="PICKUP">Pickup</option>
        </select>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-10 h-10 text-amber-200 mx-auto mb-3" />
          <p className="text-stone-500">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const nextStatuses = getNextStatuses(order.delivery_type, order.status);
            const isUpdating = updatingId === order.id;
            const customer = order.profiles as any;
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
                <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                  <div>
                    <p className="font-bold text-stone-900">{order.order_number}</p>
                    <p className="text-xs text-stone-400">{new Date(order.created_at).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${order.delivery_type === 'DELIVERY' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-teal-50 text-teal-700 border-teal-200'}`}>
                      {order.delivery_type}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                </div>

                {customer && (
                  <div className="flex items-center gap-3 text-xs text-stone-600 mb-3">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span>{customer.full_name || 'Customer'}</span>
                    {customer.phone && <span>· {customer.phone}</span>}
                  </div>
                )}

                {/* Items summary */}
                {order.order_items?.length > 0 && (
                  <div className="bg-stone-50 rounded-xl px-3 py-2 mb-3 text-xs text-stone-600">
                    {order.order_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between">
                        <span>{item.quantity}× {item.product_name_snapshot} ({item.variant_name_snapshot})</span>
                        <span className="font-semibold">₹{Number(item.line_total).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm font-bold text-stone-900">Total: ₹{Number(order.total).toFixed(0)}</p>

                  {/* Status controls */}
                  {nextStatuses.length > 0 && (
                    <div className="flex gap-1.5">
                      {nextStatuses.filter(s => s !== 'CANCELLED').map(next => (
                        <button
                          key={next}
                          onClick={() => handleStatusUpdate(order.id, next)}
                          disabled={isUpdating}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-amber-700 text-white font-semibold hover:bg-amber-800 disabled:opacity-50 transition-colors"
                        >
                          {isUpdating ? <Spinner className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                          → {next.replace(/_/g, ' ')}
                        </button>
                      ))}
                      {nextStatuses.includes('CANCELLED') && (
                        <button
                          onClick={() => {
                            if (confirm('Cancel this order?')) handleStatusUpdate(order.id, 'CANCELLED');
                          }}
                          disabled={isUpdating}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          <XCircle className="w-3 h-3" /> Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {order.customer_notes && (
                  <p className="text-xs text-stone-500 mt-2 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                    💬 {order.customer_notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom Orders Tab
// ---------------------------------------------------------------------------

function CustomOrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [quoteInputs, setQuoteInputs] = useState<Record<string, string>>({});
  const [notesInputs, setNotesInputs] = useState<Record<string, string>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async (id: string, payload: { status?: string; final_price?: number; owner_notes?: string }) => {
    setUpdatingId(id);
    try {
      const updated = await ownerService.updateCustomOrder(id, payload);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updated } : o));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="text-sm border border-stone-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-amber-400"
        >
          <option value="">All Statuses</option>
          {['PENDING', 'ACCEPTED', 'QUOTED', 'CONFIRMED', 'REJECTED'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : error ? (
        <p className="text-red-600 text-sm">{error}</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <Cake className="w-10 h-10 text-amber-200 mx-auto mb-3" />
          <p className="text-stone-500">No custom cake enquiries found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(co => {
            const customer = co.profiles as any;
            const isUpdating = updatingId === co.id;
            return (
              <div key={co.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
                <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                  <div>
                    <p className="font-bold text-stone-900">{co.occasion || 'Custom Cake'}</p>
                    <p className="text-xs text-stone-400">
                      Required: {new Date(co.required_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {co.preferred_time && ` at ${co.preferred_time}`}
                    </p>
                  </div>
                  <StatusBadge status={co.status} />
                </div>

                {customer && (
                  <div className="flex items-center gap-3 text-xs text-stone-600 mb-3">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span>{customer.full_name || 'Customer'}</span>
                    <span>· {co.mobile_number}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 mb-3">
                  {co.flavour && <span><strong>Flavour:</strong> {co.flavour}</span>}
                  {co.weight && <span><strong>Weight:</strong> {co.weight}</span>}
                  {co.theme && <span><strong>Theme:</strong> {co.theme}</span>}
                  {co.cake_message && <span><strong>Message:</strong> "{co.cake_message}"</span>}
                  <span><strong>Type:</strong> {co.delivery_type}</span>
                </div>

                {co.additional_requirements && (
                  <p className="text-xs text-stone-600 bg-stone-50 rounded-xl px-3 py-2 mb-3 border border-stone-100">
                    {co.additional_requirements}
                  </p>
                )}

                {/* Owner notes input */}
                <div className="mb-3">
                  <label className="text-xs font-semibold text-stone-600 block mb-1">Internal Notes</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={notesInputs[co.id] ?? (co.owner_notes || '')}
                      onChange={e => setNotesInputs(prev => ({ ...prev, [co.id]: e.target.value }))}
                      placeholder="Add internal notes..."
                      className="flex-1 text-xs border border-stone-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
                    />
                    <button
                      onClick={() => handleUpdate(co.id, { owner_notes: notesInputs[co.id] ?? co.owner_notes })}
                      disabled={isUpdating}
                      className="px-3 py-2 rounded-xl bg-stone-100 text-stone-700 text-xs font-semibold hover:bg-stone-200 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>

                {/* Status actions */}
                <div className="flex flex-wrap gap-2">
                  {co.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleUpdate(co.id, { status: 'ACCEPTED' })}
                        disabled={isUpdating}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-green-50 text-green-700 border border-green-200 font-semibold hover:bg-green-100 disabled:opacity-50 transition-colors"
                      >
                        <Check className="w-3 h-3" /> Accept
                      </button>
                      <button
                        onClick={() => { if (confirm('Reject this enquiry?')) handleUpdate(co.id, { status: 'REJECTED' }); }}
                        disabled={isUpdating}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                    </>
                  )}

                  {co.status === 'ACCEPTED' && (
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-stone-600 block mb-1">Quote Price (₹)</label>
                        <input
                          type="number"
                          min={1}
                          value={quoteInputs[co.id] || ''}
                          onChange={e => setQuoteInputs(prev => ({ ...prev, [co.id]: e.target.value }))}
                          placeholder="e.g. 750"
                          className="w-full text-sm border border-amber-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 bg-amber-50"
                        />
                      </div>
                      <div className="mt-5">
                        <button
                          onClick={() => {
                            const price = parseFloat(quoteInputs[co.id]);
                            if (isNaN(price) || price <= 0) { alert('Enter a valid price.'); return; }
                            handleUpdate(co.id, { status: 'QUOTED', final_price: price });
                          }}
                          disabled={isUpdating || !quoteInputs[co.id]}
                          className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl bg-amber-700 text-white font-semibold hover:bg-amber-800 disabled:opacity-50 transition-colors"
                        >
                          {isUpdating ? <Spinner className="w-3.5 h-3.5" /> : <IndianRupee className="w-3.5 h-3.5" />}
                          Send Quote
                        </button>
                      </div>
                    </div>
                  )}

                  {co.status === 'QUOTED' && co.final_price && (
                    <p className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                      Quote sent: ₹{Number(co.final_price).toFixed(0)} — awaiting customer confirmation
                    </p>
                  )}

                  {co.status === 'CONFIRMED' && (
                    <p className="text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-xl border border-green-200">
                      ✓ Customer confirmed — ₹{Number(co.final_price).toFixed(0)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

const TABS: { id: OwnerTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'custom-orders', label: 'Custom Cakes', icon: Cake },
];

export const OwnerDashboardPage: React.FC = () => {
  const { role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<OwnerTab>('overview');
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
    ownerService.getStats()
      .then(setStats)
      .catch(e => setStatsError(e.message));
  }, [role]);

  if (authLoading) return <div className="flex justify-center py-24"><Spinner /></div>;
  if (role !== 'OWNER') return null;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif text-stone-900 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-amber-700" />
            Owner Dashboard
          </h1>
          <p className="text-sm text-stone-500 mt-1">Cake Box Kakinada — Business Management</p>
        </div>
        <button
          onClick={() => ownerService.getStats().then(setStats).catch(e => setStatsError(e.message))}
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {statsError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {statsError}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100 rounded-xl p-1 mb-6">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              id={`owner-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold flex-1 justify-center transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white text-amber-800 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab stats={stats} />}
      {activeTab === 'orders' && <OrdersTab />}
      {activeTab === 'custom-orders' && <CustomOrdersTab />}
    </div>
  );
};

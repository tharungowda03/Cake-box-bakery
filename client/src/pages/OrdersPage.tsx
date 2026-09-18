import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Sparkles } from 'lucide-react';
import { orderService, customCakeService } from '../services/apiService';
import type { Order, CustomOrder } from '../types';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { Button } from '../components/ui/Button';

export const OrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'REGULAR' | 'CUSTOM'>('REGULAR');
  const [regularOrders, setRegularOrders] = useState<Order[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const [reg, cust] = await Promise.all([
        orderService.getOrders(),
        customCakeService.getCustomerCustomOrders(),
      ]);
      setRegularOrders(reg);
      setCustomOrders(cust);
    } catch (e) {
      console.error('Failed to load orders', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleConfirmQuote = async (id: string) => {
    if (!window.confirm('Do you want to accept this quotation and confirm your order?')) return;
    setConfirmingId(id);
    try {
      await customCakeService.confirmQuote(id);
      await fetchOrders();
    } catch (e: any) {
      alert(e.message || 'Failed to confirm custom cake quote.');
    } finally {
      setConfirmingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge variant="success">Confirmed</Badge>;
      case 'PREPARING':
        return <Badge variant="warning">Preparing in Kitchen</Badge>;
      case 'OUT_FOR_DELIVERY':
        return <Badge variant="info">Out for Delivery</Badge>;
      case 'DELIVERED':
        return <Badge variant="success">Delivered</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
      case 'PENDING':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'QUOTED':
        return <Badge variant="info">Quote Issued</Badge>;
      case 'ACCEPTED':
        return <Badge variant="info">Accepted</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">Declined</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
          My Orders & Requests
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Track your bakery orders and review bespoke custom cake inquiries.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200">
        <button
          onClick={() => setActiveTab('REGULAR')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'REGULAR'
              ? 'border-amber-800 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Bakery Orders ({regularOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('CUSTOM')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'CUSTOM'
              ? 'border-amber-800 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          Custom Cake Requests ({customOrders.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'REGULAR' ? (
        regularOrders.length > 0 ? (
          <div className="space-y-4">
            {regularOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100 text-xs">
                  <div>
                    <span className="font-bold text-stone-900 text-sm block">
                      Order #{order.order_number}
                    </span>
                    <span className="text-stone-400">
                      Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <Link
                      to={`/orders/${order.id}`}
                      className="inline-flex items-center text-xs font-semibold text-amber-800 hover:text-amber-900"
                    >
                      Details <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Items preview */}
                <div className="space-y-1.5 text-xs text-stone-600">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <span>
                        {item.quantity}x {item.product_name_snapshot}{' '}
                        <span className="text-stone-400">({item.variant_name_snapshot})</span>
                      </span>
                      <span className="font-semibold text-stone-900">₹{item.line_total}</span>
                    </div>
                  ))}
                </div>

                {/* Order Summary & Footer */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <div className="space-x-3 text-stone-500">
                    <span>
                      Method: <strong>{order.delivery_type}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Payment: <strong>Cash ({order.payment_status})</strong>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-stone-500 mr-2">Total:</span>
                    <span className="text-base font-extrabold text-stone-900">₹{order.total}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-6">
            <Package className="w-12 h-12 text-stone-300 mx-auto mb-2" />
            <h3 className="font-bold text-stone-800 font-serif">No bakery orders yet</h3>
            <p className="text-xs text-stone-500 mt-1 mb-4">
              Explore our freshly baked treats and place your first order.
            </p>
            <Link to="/menu">
              <Button size="sm" variant="primary">
                Browse Menu
              </Button>
            </Link>
          </div>
        )
      ) : (
        /* Custom Orders Tab */
        customOrders.length > 0 ? (
          <div className="space-y-4">
            {customOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100 text-xs">
                  <div>
                    <span className="font-bold text-stone-900 text-sm block">
                      Custom Cake: {order.occasion || 'Celebration'}
                    </span>
                    <span className="text-stone-400">
                      Required by:{' '}
                      <strong>{new Date(order.required_date).toLocaleDateString('en-IN')}</strong>{' '}
                      {order.preferred_time && `(${order.preferred_time})`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">{getStatusBadge(order.status)}</div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 bg-stone-50 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Flavour</span>
                    <span className="font-semibold text-stone-800">{order.flavour || 'Standard'}</span>
                  </div>
                  <div className="p-2.5 bg-stone-50 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Weight</span>
                    <span className="font-semibold text-stone-800">{order.weight || '1 kg'}</span>
                  </div>
                  <div className="p-2.5 bg-stone-50 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Theme</span>
                    <span className="font-semibold text-stone-800">{order.theme || 'Custom design'}</span>
                  </div>
                </div>

                {order.cake_message && (
                  <div className="text-xs text-stone-600 bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
                    <span className="font-bold text-amber-900">Message on cake:</span> "
                    {order.cake_message}"
                  </div>
                )}

                {order.additional_requirements && (
                  <p className="text-xs text-stone-500">
                    <strong>Notes:</strong> {order.additional_requirements}
                  </p>
                )}

                {/* Quoted state actions */}
                {order.status === 'QUOTED' && order.final_price && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-amber-900 block">
                        Official Bakery Quote Issued
                      </span>
                      <span className="text-xl font-extrabold text-stone-900">
                        ₹{order.final_price}
                      </span>
                      {order.owner_notes && (
                        <p className="text-xs text-stone-600 mt-0.5">Note: {order.owner_notes}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      loading={confirmingId === order.id}
                      onClick={() => handleConfirmQuote(order.id)}
                    >
                      Accept Quote & Confirm Order
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-6">
            <Sparkles className="w-12 h-12 text-stone-300 mx-auto mb-2" />
            <h3 className="font-bold text-stone-800 font-serif">No custom cake requests</h3>
            <p className="text-xs text-stone-500 mt-1 mb-4">
              Planning a party? Design your bespoke celebration cake today.
            </p>
            <Link to="/custom-cake">
              <Button size="sm" variant="primary">
                Design Custom Cake
              </Button>
            </Link>
          </div>
        )
      )}
    </div>
  );
};

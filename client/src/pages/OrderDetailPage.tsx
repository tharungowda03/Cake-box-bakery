import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Truck, Store } from 'lucide-react';
import { orderService } from '../services/apiService';
import type { Order } from '../types';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!id) return;
      try {
        const data = await orderService.getOrderById(id);
        setOrder(data);
      } catch (e) {
        console.error('Failed to load order', e);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-[#d1e3ef]">
        <h2 className="text-2xl font-bold font-serif text-[#0f2231]">Order Not Found</h2>
        <Link to="/orders" className="inline-block mt-4 text-xs font-semibold text-[#006199]">
          Back to all orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <Link
        to="/orders"
        className="inline-flex items-center gap-2 text-xs font-semibold text-[#4a6275] hover:text-[#006199]"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Orders
      </Link>

      {/* Confirmation header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#d1e3ef] shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#e8f2f9]">
          <div>
            <span className="text-xs font-semibold text-[#006199] uppercase tracking-wider block">
              Order Receipt
            </span>
            <h1 className="text-2xl font-bold font-serif text-[#0f2231] mt-0.5">
              Order #{order.order_number}
            </h1>
            <p className="text-xs text-[#7a9db3] mt-1">
              Placed on {new Date(order.created_at).toLocaleString('en-IN')}
            </p>
          </div>
          <Badge variant="success" className="text-xs py-1 px-3">
            {order.status}
          </Badge>
        </div>

        {/* Itemized list */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#4a6275]">
            Order Items
          </h3>
          <div className="divide-y divide-[#e8f2f9]">
            {order.order_items?.map((item) => (
              <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                <div>
                  <span className="font-semibold text-[#0f2231] block">
                    {item.quantity}x {item.product_name_snapshot}
                  </span>
                  <span className="text-xs text-[#4a6275]">
                    Option: {item.variant_name_snapshot} • ₹{item.unit_price} each
                  </span>
                </div>
                <span className="font-bold text-[#0f2231]">₹{item.line_total}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="pt-4 border-t border-[#e8f2f9] space-y-2 text-xs text-[#4a6275]">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-semibold text-[#0f2231]">₹{order.subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span className="font-semibold text-[#0f2231]">
              {order.delivery_fee > 0 ? `₹${order.delivery_fee}` : 'FREE (Pickup)'}
            </span>
          </div>
          <div className="pt-2 border-t border-[#e8f2f9] flex justify-between items-baseline text-sm">
            <span className="font-bold text-[#0f2231]">Total Paid / Payable</span>
            <span className="text-xl font-extrabold text-[#0f2231]">₹{order.total}</span>
          </div>
        </div>

        {/* Fulfilment & Payment Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#e8f2f9] text-xs">
          <div className="p-4 bg-[#f0f5f9] rounded-xl space-y-1">
            <span className="font-bold uppercase tracking-wider text-[#4a6275] text-[10px] block">
              Fulfilment Method
            </span>
            <p className="font-semibold text-[#0f2231] flex items-center gap-1.5">
              {order.delivery_type === 'DELIVERY' ? (
                <>
                  <Truck className="w-4 h-4 text-[#006199]" /> Home Delivery
                </>
              ) : (
                <>
                  <Store className="w-4 h-4 text-[#006199]" /> Bakery Counter Pickup
                </>
              )}
            </p>
            {order.delivery_address_snapshot && (
              <p className="text-[#4a6275] pt-1 text-[11px] leading-relaxed">
                {order.delivery_address_snapshot.recipient_name},{' '}
                {order.delivery_address_snapshot.house_flat_building},{' '}
                {order.delivery_address_snapshot.street},{' '}
                {order.delivery_address_snapshot.area_locality},{' '}
                {order.delivery_address_snapshot.city}
              </p>
            )}
          </div>

          <div className="p-4 bg-[#f0f5f9] rounded-xl space-y-1">
            <span className="font-bold uppercase tracking-wider text-[#4a6275] text-[10px] block">
              Payment Information
            </span>
            <p className="font-semibold text-[#0f2231]">
              {order.payment_method} on {order.delivery_type === 'DELIVERY' ? 'Delivery' : 'Pickup'}
            </p>
            <p className="text-[#4a6275]">
              Payment Status: <strong className="text-[#006199]">{order.payment_status}</strong>
            </p>
          </div>
        </div>

        {/* Cancellation Notice Banner */}
        <div className="p-4 bg-[#F4EB6C]/30 rounded-xl border border-[#FFD444] text-xs text-[#004d7a] leading-relaxed">
          <span className="font-bold block mb-1">Cancellation & Refund Terms:</span>
          Standard items: Cancellations made at least 24 hours prior to scheduled fulfilment are eligible for 100% refund. Cancellations made less than 24 hours prior are non-refundable as baking has begun. Approved refunds are processed in 5–10 business days.
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, X } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

export const CartNotification: React.FC = () => {
  const { lastAddedNotification, dismissNotification } = useCart();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!lastAddedNotification) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Visible for 3 seconds before natural auto-dismiss
    timerRef.current = setTimeout(() => {
      dismissNotification();
      timerRef.current = null;
    }, 3000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [lastAddedNotification, dismissNotification]);

  if (!lastAddedNotification) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full transition-all duration-300 transform translate-y-0"
    >
      <div className="bg-stone-900/95 text-white backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-stone-700/60 flex items-start gap-3.5">
        {/* Success Icon */}
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400 mt-0.5">
          <CheckCircle2 className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              ✓ Added to cart
            </span>
            <button
              onClick={dismissNotification}
              className="text-stone-400 hover:text-white p-1 rounded-md transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm font-semibold text-stone-100 truncate mt-0.5 font-serif">
            {lastAddedNotification.product_name}
          </p>

          {lastAddedNotification.variant_name && (
            <p className="text-xs text-stone-400">
              {lastAddedNotification.variant_name} × {lastAddedNotification.quantity}
            </p>
          )}

          {/* Action Row */}
          <div className="mt-2.5 pt-2 border-t border-stone-800 flex items-center justify-between">
            <span className="text-xs font-medium text-stone-300">
              ₹{lastAddedNotification.unit_price * lastAddedNotification.quantity}
            </span>
            <Link
              to="/cart"
              onClick={dismissNotification}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>View Cart</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { Button } from '../components/ui/Button';

export const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal, totalItems } = useCart();

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center bg-white rounded-3xl border border-stone-200 p-8 shadow-xs">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 text-amber-700" />
        </div>
        <h2 className="text-2xl font-bold font-serif text-stone-900">Your Basket is Empty</h2>
        <p className="text-sm text-stone-500 mt-2 max-w-sm mx-auto">
          Explore our artisanal menu and treat yourself to fresh handcrafted delights.
        </p>
        <Link to="/menu" className="inline-block mt-6">
          <Button size="lg" variant="primary">
            Explore Menu <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
          Your Order Basket ({totalItems} {totalItems === 1 ? 'item' : 'items'})
        </h1>
        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
        >
          Clear Basket
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div
              key={item.variant_id}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 flex items-center justify-between gap-4 shadow-xs"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-16 h-16 rounded-xl bg-amber-50 border border-stone-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🍰</span>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="font-semibold text-stone-900 text-sm font-serif">
                    {item.product_name}
                  </h4>
                  <p className="text-xs text-stone-500 font-medium">
                    Option: {item.variant_name}
                  </p>
                  <p className="text-xs font-bold text-stone-800">
                    ₹{item.unit_price} each
                  </p>
                </div>
              </div>

              {/* Quantity controls & price */}
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-stone-300 rounded-lg bg-stone-50 overflow-hidden">
                  <button
                    onClick={() => updateQuantity(item.variant_id, item.quantity - 1)}
                    className="px-2.5 py-1 text-stone-600 hover:bg-stone-200 transition-colors text-xs font-bold"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-bold text-stone-900 min-w-8 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.variant_id, item.quantity + 1)}
                    className="px-2.5 py-1 text-stone-600 hover:bg-stone-200 transition-colors text-xs font-bold"
                  >
                    +
                  </button>
                </div>

                <div className="text-right min-w-16">
                  <span className="text-sm font-bold text-stone-900 block">
                    ₹{item.unit_price * item.quantity}
                  </span>
                </div>

                <button
                  onClick={() => removeFromCart(item.variant_id)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <Link
            to="/menu"
            className="inline-flex items-center gap-2 text-xs font-semibold text-amber-800 hover:text-amber-900 pt-2"
          >
            <ArrowLeft className="w-4 h-4" /> Add more items from menu
          </Link>
        </div>

        {/* Order Summary & Checkout CTA */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 space-y-6 shadow-xs">
          <h3 className="text-lg font-bold font-serif text-stone-900 border-b border-stone-100 pb-3">
            Summary
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-stone-900">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Delivery Fee</span>
              <span className="text-xs text-amber-800 font-medium">Calculated at checkout</span>
            </div>
            <div className="pt-3 border-t border-stone-100 flex justify-between items-baseline">
              <span className="font-bold text-stone-900 text-base">Estimated Total</span>
              <span className="font-extrabold text-stone-900 text-xl">₹{subtotal}</span>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-xs text-amber-900">
            <p className="font-medium">
              💡 Delivery charge will be accurately calculated based on your distance from our Kakinada branch.
            </p>
          </div>

          <Link to="/checkout" className="block">
            <Button size="lg" variant="primary" className="w-full">
              Proceed to Checkout <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

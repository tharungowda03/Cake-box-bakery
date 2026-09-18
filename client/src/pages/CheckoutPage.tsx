import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, MapPin, Truck, Store, ArrowLeft } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { addressService, orderService, settingsService } from '../services/apiService';
import type { Address } from '../types';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

export const CheckoutPage: React.FC = () => {
  const { cart, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [deliveryType, setDeliveryType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState('');

  // Address creation form state
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newHouse, setNewHouse] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newArea, setNewArea] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [newPostalCode] = useState('533001');

  // Calculation & submission state
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [serviceable, setServiceable] = useState<boolean>(true);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
      return;
    }

    async function loadData() {
      try {
        const userAddresses = await addressService.getAddresses();
        setAddresses(userAddresses);

        if (userAddresses.length > 0) {
          const def = userAddresses.find((a) => a.is_default) || userAddresses[0];
          setSelectedAddressId(def.id);
        } else {
          setShowNewAddress(true);
        }
      } catch (err) {
        console.error('Failed to load checkout addresses:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [cart, navigate]);

  // Recalculate delivery whenever selectedAddress or deliveryType changes
  useEffect(() => {
    async function checkDelivery() {
      if (deliveryType === 'PICKUP') {
        setDeliveryFee(0);
        setServiceable(true);
        setServiceError(null);
        return;
      }

      const activeAddress = addresses.find((a) => a.id === selectedAddressId);
      if (!activeAddress) return;

      const lat = activeAddress.latitude ? Number(activeAddress.latitude) : 16.9891;
      const lng = activeAddress.longitude ? Number(activeAddress.longitude) : 82.2475;

      try {
        const result = await settingsService.checkServiceability(lat, lng);
        if (result.serviceable) {
          setDeliveryFee(result.delivery_charge_inr);
          setServiceable(true);
          setServiceError(null);
        } else {
          setDeliveryFee(0);
          setServiceable(false);
          setServiceError(result.reason || 'Address outside service radius.');
        }
      } catch (e: any) {
        console.error('Serviceability check error', e);
        setServiceError(e.message);
      }
    }

    if (selectedAddressId && deliveryType === 'DELIVERY') {
      checkDelivery();
    }
  }, [selectedAddressId, deliveryType, addresses]);

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await addressService.createAddress({
        recipient_name: newRecipientName,
        phone: newPhone,
        house_flat_building: newHouse,
        street: newStreet,
        area_locality: newArea,
        landmark: newLandmark || null,
        city: 'Kakinada',
        state: 'Andhra Pradesh',
        postal_code: newPostalCode,
        is_default: addresses.length === 0,
      });
      setAddresses([created, ...addresses]);
      setSelectedAddressId(created.id);
      setShowNewAddress(false);
    } catch (err: any) {
      alert(`Could not save address: ${err.message}`);
    }
  };

  const handlePlaceOrder = async () => {
    if (deliveryType === 'DELIVERY' && (!selectedAddressId || !serviceable)) {
      alert('Please provide or select a valid delivery address within Kakinada.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: cart.map((i) => ({
          variant_id: i.variant_id,
          quantity: i.quantity,
        })),
        delivery_type: deliveryType,
        delivery_address_id: deliveryType === 'DELIVERY' ? selectedAddressId : undefined,
        customer_notes: customerNotes || undefined,
      };

      const order = await orderService.createOrder(payload);
      clearCart();
      navigate(`/orders/${order.id}`);
    } catch (err: any) {
      console.error('Order placement failure:', err);
      alert(err.message || 'Failed to complete order. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  const finalTotal = subtotal + (deliveryType === 'DELIVERY' ? deliveryFee : 0);

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <Link
        to="/cart"
        className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-amber-800"
      >
        <ArrowLeft className="w-4 h-4" /> Return to basket
      </Link>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
          Complete Your Order
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Review your details and place your cash on delivery order.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Delivery & Address */}
        <div className="lg:col-span-2 space-y-6">
          {/* Fulfilment Method Selector */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
              Fulfilment Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryType('DELIVERY')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  deliveryType === 'DELIVERY'
                    ? 'border-amber-800 bg-amber-50/50 ring-1 ring-amber-700/20'
                    : 'border-stone-200 hover:bg-stone-50'
                }`}
              >
                <Truck className={`w-5 h-5 mt-0.5 ${deliveryType === 'DELIVERY' ? 'text-amber-800' : 'text-stone-400'}`} />
                <div>
                  <span className="text-sm font-bold text-stone-900 block">Home Delivery</span>
                  <span className="text-[11px] text-stone-500 block">
                    Delivered to your doorstep within 10 km (₹7/km)
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeliveryType('PICKUP');
                  setDeliveryFee(0);
                  setServiceable(true);
                  setServiceError(null);
                }}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                  deliveryType === 'PICKUP'
                    ? 'border-amber-800 bg-amber-50/50 ring-1 ring-amber-700/20'
                    : 'border-stone-200 hover:bg-stone-50'
                }`}
              >
                <Store className={`w-5 h-5 mt-0.5 ${deliveryType === 'PICKUP' ? 'text-amber-800' : 'text-stone-400'}`} />
                <div>
                  <span className="text-sm font-bold text-stone-900 block">Bakery Pickup</span>
                  <span className="text-[11px] text-stone-500 block">
                    Collect in person from Cake Box Kakinada (Free)
                  </span>
                </div>
              </button>
            </div>

            {deliveryType === 'PICKUP' && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 space-y-1">
                <span className="font-bold text-stone-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-800" /> Pickup Location:
                </span>
                <p className="text-stone-600 pl-5">
                  Cake Box Kakinada, Pulavarthi Vari St / Digimarthi Vari St, Kakinada. Please collect your order from our bakery counter once ready.
                </p>
              </div>
            )}
          </div>

          {/* Delivery Address Section */}
          {deliveryType === 'DELIVERY' && (
            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-800" /> Delivery Address
                </h3>
                {addresses.length > 0 && !showNewAddress && (
                  <button
                    onClick={() => setShowNewAddress(true)}
                    className="text-xs font-semibold text-amber-800 hover:text-amber-900 cursor-pointer"
                  >
                    + Add New Address
                  </button>
                )}
              </div>

              {/* Saved Address Radios */}
              {!showNewAddress && addresses.length > 0 && (
                <div className="space-y-2">
                  {addresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`block p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedAddressId === addr.id
                          ? 'border-amber-800 bg-amber-50/40 ring-1 ring-amber-800'
                          : 'border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 text-amber-800 focus:ring-amber-700"
                        />
                        <div className="text-xs space-y-0.5">
                          <p className="font-bold text-stone-900 text-sm">
                            {addr.recipient_name} ({addr.phone})
                          </p>
                          <p className="text-stone-600">
                            {addr.house_flat_building}, {addr.street}, {addr.area_locality}
                          </p>
                          {addr.landmark && (
                            <p className="text-stone-400">Landmark: {addr.landmark}</p>
                          )}
                          <p className="text-stone-500">
                            {addr.city}, {addr.state} - {addr.postal_code}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Serviceability Warning */}
              {serviceError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{serviceError}</span>
                </div>
              )}

              {/* New Address Form */}
              {showNewAddress && (
                <form onSubmit={handleCreateAddress} className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-stone-600">Recipient Name</label>
                      <input
                        type="text"
                        required
                        value={newRecipientName}
                        onChange={(e) => setNewRecipientName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-amber-700 focus:border-amber-700 mt-1"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-600">Phone Number</label>
                      <input
                        type="tel"
                        required
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-amber-700 focus:border-amber-700 mt-1"
                        placeholder="e.g. 9876543210"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-600">Flat / House / Building</label>
                    <input
                      type="text"
                      required
                      value={newHouse}
                      onChange={(e) => setNewHouse(e.target.value)}
                      className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-amber-700 focus:border-amber-700 mt-1"
                      placeholder="e.g. Flat 301, Sri Sai Residency"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-stone-600">Street / Road</label>
                    <input
                      type="text"
                      required
                      value={newStreet}
                      onChange={(e) => setNewStreet(e.target.value)}
                      className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-amber-700 focus:border-amber-700 mt-1"
                      placeholder="e.g. Main Road, Bhanugudi Junction"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-stone-600">Area / Locality</label>
                      <input
                        type="text"
                        required
                        value={newArea}
                        onChange={(e) => setNewArea(e.target.value)}
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-amber-700 focus:border-amber-700 mt-1"
                        placeholder="e.g. Srinagar / Ramaraopeta"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-600">Landmark (Optional)</label>
                      <input
                        type="text"
                        value={newLandmark}
                        onChange={(e) => setNewLandmark(e.target.value)}
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:ring-amber-700 focus:border-amber-700 mt-1"
                        placeholder="e.g. Near Apollo Pharmacy"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="submit" size="sm" variant="primary">
                      Save Address
                    </Button>
                    {addresses.length > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowNewAddress(false)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Customer notes */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
              Instructions for Bakery / Delivery Partner (Optional)
            </label>
            <textarea
              rows={2}
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="e.g. Please add extra paper napkins, ring the doorbell twice..."
              className="w-full p-3 text-xs border rounded-xl focus:ring-amber-700 focus:border-amber-700"
            />
          </div>
        </div>

        {/* Right Column: Cost summary, Payment method & Policy */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 space-y-5 shadow-xs">
            <h3 className="text-base font-bold font-serif text-stone-900 border-b border-stone-100 pb-3">
              Order Total
            </h3>

            <div className="space-y-2.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-stone-900">₹{subtotal}</span>
              </div>

              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span className="font-semibold text-stone-900">
                  {deliveryType === 'DELIVERY' ? `₹${deliveryFee}` : 'FREE (Pickup)'}
                </span>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-between items-baseline text-sm">
                <span className="font-bold text-stone-900">Total Payable</span>
                <span className="text-xl font-extrabold text-stone-900">
                  ₹{finalTotal}
                </span>
              </div>
            </div>

            {/* Payment Method - CASH forced for MVP */}
            <div className="pt-4 border-t border-stone-100 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
                Payment Method
              </label>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-800">
                  {deliveryType === 'DELIVERY' ? '💵 Cash on Delivery' : '💵 Cash on Pickup'}
                </span>
                <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wide">
                  Default MVP
                </span>
              </div>
            </div>

            {/* Cancellation Notice Banner */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed">
              <span className="font-bold block mb-0.5">Cancellation Policy:</span>
              Standard items: 100% refund if cancelled 24+ hrs prior; non-refundable within 24 hrs. Perishable items prepared cannot be returned. Transport responsibility passes to customer upon handover. Approved refunds processed in 5–10 business days.
            </div>

            <Button
              size="lg"
              variant="primary"
              disabled={submitting || (deliveryType === 'DELIVERY' && !serviceable)}
              loading={submitting}
              onClick={handlePlaceOrder}
              className="w-full shadow-md"
            >
              Confirm & Place Order (₹{finalTotal})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

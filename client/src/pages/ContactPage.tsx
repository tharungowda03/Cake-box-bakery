import React from 'react';
import { MapPin, Clock, Phone } from 'lucide-react';

export const ContactPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900">
          Visit Our Bakery
        </h1>
        <p className="text-sm text-stone-500 max-w-md mx-auto">
          We'd love to welcome you to our Cake Box store in Kakinada.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 sm:p-10 rounded-3xl border border-stone-200">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 font-serif">Bakery Address</h4>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Cake Box Kakinada, Main Branch<br />
                Kakinada, Andhra Pradesh, India 533001
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 font-serif">Opening Hours</h4>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Monday – Sunday: 10:00 AM – 10:00 PM
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 font-serif">Direct Assistance</h4>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Counter support and custom order inquiries during bakery hours.
              </p>
            </div>
          </div>
        </div>

        {/* Fulfilment & Delivery zone callout */}
        <div className="bg-amber-50/60 p-6 rounded-2xl border border-amber-200/70 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Fulfilment Information
            </span>
            <h3 className="text-lg font-bold font-serif text-stone-900">
              Home Delivery & Bakery Pickup
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              We deliver across Kakinada within our 10 km radius (₹7/km), or you can choose Bakery Pickup to collect directly from our store with zero delivery fee.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs text-stone-700 leading-relaxed">
            <strong className="text-amber-900 block mb-1">Cancellation Policy:</strong>
            Standard retail items are eligible for 100% refund if cancelled at least 24 hours prior. Custom cakes receive full refund (less deposit) if cancelled 14+ days prior. Handover transfers transport responsibility to the customer.
          </div>
        </div>
      </div>
    </div>
  );
};

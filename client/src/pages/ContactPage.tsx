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

        {/* Delivery zone callout */}
        <div className="bg-amber-50/60 p-6 rounded-2xl border border-amber-200/70 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Home Delivery Information
            </span>
            <h3 className="text-lg font-bold font-serif text-stone-900">
              Delivering Across Kakinada
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              We service all major neighborhoods in Kakinada within our 10 km radius. Delivery charges are calculated based on your address distance.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs text-stone-700">
            <strong>Cancellation Notice:</strong> Cancellation policy to be confirmed by Cake Box Kakinada.
          </div>
        </div>
      </div>
    </div>
  );
};

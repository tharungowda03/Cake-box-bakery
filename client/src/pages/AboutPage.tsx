import React from 'react';
import { Sparkles } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-6">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-700" /> Authentic Bakery Story
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-stone-900">
          Cake Box Kakinada
        </h1>
        <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
          Kakinada's premier destination for celebration cakes, gourmet desserts, pastries, and savory bakery treats.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white p-8 sm:p-12 rounded-3xl border border-stone-200">
        <div className="space-y-4 text-sm text-stone-600 leading-relaxed">
          <h2 className="text-2xl font-bold font-serif text-stone-900">
            About Our Bakery
          </h2>
          <p>
            Cake Box operates in Kakinada offering a curated catalogue of handcrafted cakes, pastries, biscuits, desserts, rolls, and beverages.
          </p>
          <p>
            We serve celebration cakes for birthdays, anniversaries, and family events, alongside convenient home delivery within our verified local service radius in Kakinada.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 text-center">
            <span className="text-3xl font-extrabold text-amber-900 block font-serif">18</span>
            <span className="text-xs font-semibold text-stone-600 mt-1 block">Categories</span>
          </div>
          <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 text-center">
            <span className="text-3xl font-extrabold text-amber-900 block font-serif">112</span>
            <span className="text-xs font-semibold text-stone-600 mt-1 block">Catalogue Products</span>
          </div>
          <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 text-center">
            <span className="text-3xl font-extrabold text-amber-900 block font-serif">10 km</span>
            <span className="text-xs font-semibold text-stone-600 mt-1 block">Delivery Radius</span>
          </div>
          <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 text-center">
            <span className="text-3xl font-extrabold text-amber-900 block font-serif">₹7/km</span>
            <span className="text-xs font-semibold text-stone-600 mt-1 block">Delivery Rate</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { Cake, Phone, MapPin, Clock, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-8 border-t border-stone-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand and provenance */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Cake className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold font-serif text-white tracking-wide">
                Cake Box Kakinada
              </span>
            </div>
            <p className="text-stone-400 text-sm leading-relaxed">
              Kakinada's premier bakery crafting artisanal cakes, rich desserts, gourmet pastries, and celebratory creations baked with passion and premium ingredients.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
              <ShieldCheck className="w-4 h-4" /> 100% Verified Catalogue & Quality
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4 font-serif">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/menu" className="hover:text-amber-400 transition-colors">
                  Explore Full Menu
                </Link>
              </li>
              <li>
                <Link to="/custom-cake" className="hover:text-amber-400 transition-colors">
                  Order Custom Cake
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-amber-400 transition-colors">
                  Track Past Orders
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-amber-400 transition-colors">
                  Our Story & Craft
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-amber-400 transition-colors">
                  Visit Branch
                </Link>
              </li>
            </ul>
          </div>

          {/* Bakery Info */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4 font-serif">
              Bakery & Hours
            </h4>
            <ul className="space-y-3 text-sm text-stone-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>Cake Box, Kakinada, Andhra Pradesh 533001</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Mon – Sun: 10:00 AM – 10:00 PM</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Direct Bakery Service Counter</span>
              </li>
            </ul>
          </div>

          {/* Service & MVP Policies */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4 font-serif">
              Ordering & Delivery
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed mb-3">
              Home delivery available within 10 km from our Kakinada branch. Cash on Delivery supported.
            </p>
            <div className="p-3 bg-stone-800/80 rounded-lg border border-stone-700/60 text-xs text-amber-200">
              <span className="font-semibold block mb-1">Cancellation Notice:</span>
              Cancellation policy to be confirmed by Cake Box Kakinada.
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-stone-800 text-center sm:flex sm:justify-between sm:items-center text-xs text-stone-500">
          <p>© {new Date().getFullYear()} Cake Box Kakinada. All rights reserved.</p>
          <p className="flex items-center justify-center gap-1 mt-2 sm:mt-0">
            Handcrafted with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for dessert lovers in Kakinada
          </p>
        </div>
      </div>
    </footer>
  );
};

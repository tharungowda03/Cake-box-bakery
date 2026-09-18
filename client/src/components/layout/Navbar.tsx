import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Cake, User as UserIcon, Menu, X, Clock, MapPin } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { totalItems } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-900/10 shadow-xs">
      {/* Top micro-announcement bar */}
      <div className="bg-amber-900 text-amber-50 text-xs py-1.5 px-4 text-center flex items-center justify-center gap-6 font-medium">
        <span className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-amber-300" />
          Delivering fresh across Kakinada (within 10 km)
        </span>
        <span className="hidden sm:flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-300" />
          Store hours • 10:00 AM – 10:00 PM
        </span>
      </div>

      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group text-decoration-none">
          <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shadow-inner group-hover:bg-amber-200 transition-colors">
            <Cake className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 block font-serif">
              Cake Box
            </span>
            <span className="text-[11px] font-semibold tracking-wider text-amber-700 uppercase -mt-1 block">
              Kakinada
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className="text-sm font-semibold text-stone-700 hover:text-amber-800 transition-colors"
          >
            Home
          </Link>
          <Link
            to="/menu"
            className="text-sm font-semibold text-stone-700 hover:text-amber-800 transition-colors"
          >
            Menu & Catalogue
          </Link>
          <Link
            to="/custom-cake"
            className="text-sm font-semibold text-stone-700 hover:text-amber-800 transition-colors flex items-center gap-1.5"
          >
            <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse"></span>
            Custom Cakes
          </Link>
          <Link
            to="/about"
            className="text-sm font-semibold text-stone-700 hover:text-amber-800 transition-colors"
          >
            About Us
          </Link>
          <Link
            to="/contact"
            className="text-sm font-semibold text-stone-700 hover:text-amber-800 transition-colors"
          >
            Contact
          </Link>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Cart button */}
          <Link
            to="/cart"
            className="relative p-2.5 rounded-full bg-amber-50 text-amber-900 hover:bg-amber-100 transition-colors"
            title="Cart"
          >
            <ShoppingBag className="w-5 h-5 text-amber-800" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-700 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                {totalItems}
              </span>
            )}
          </Link>

          {/* User Auth */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/orders"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-stone-100 text-stone-800 hover:bg-stone-200 transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5 text-amber-700" />
                My Orders
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs font-medium text-stone-500 hover:text-stone-800 px-2 py-1 cursor-pointer"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg bg-amber-700 text-white hover:bg-amber-800 transition-colors shadow-xs"
            >
              Sign In
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-stone-200 px-4 pt-2 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-semibold text-stone-800 hover:text-amber-700 py-1"
          >
            Home
          </Link>
          <Link
            to="/menu"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-semibold text-stone-800 hover:text-amber-700 py-1"
          >
            Menu & Catalogue
          </Link>
          <Link
            to="/custom-cake"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-semibold text-stone-800 hover:text-amber-700 py-1"
          >
            Custom Cakes
          </Link>
          <Link
            to="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-semibold text-stone-800 hover:text-amber-700 py-1"
          >
            About Us
          </Link>
          <Link
            to="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-base font-semibold text-stone-800 hover:text-amber-700 py-1"
          >
            Contact
          </Link>
          {user && (
            <Link
              to="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-base font-semibold text-amber-800 hover:text-amber-900 py-1"
            >
              My Orders & Inquiries
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

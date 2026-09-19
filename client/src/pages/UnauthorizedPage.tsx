import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft } from 'lucide-react';

/**
 * UnauthorizedPage — shown when an authenticated user tries to access a route
 * they do not have permission for (e.g. a CUSTOMER navigating to /owner).
 *
 * This is a 403 Access Restricted experience, not a hard redirect, so the
 * user understands what happened rather than being silently bounced away.
 */
export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shadow-sm">
            <ShieldX className="w-10 h-10 text-red-500" />
          </div>
        </div>

        {/* Status code */}
        <p className="text-xs font-bold tracking-widest text-red-400 uppercase mb-2">
          403 — Access Restricted
        </p>

        {/* Heading */}
        <h1 className="text-3xl font-bold font-serif text-stone-900 mb-3">
          You don't have permission
        </h1>

        {/* Description */}
        <p className="text-stone-500 text-sm leading-relaxed mb-8">
          This area is restricted to authorised staff only. If you believe this
          is an error, please contact the bakery team.
        </p>

        {/* CTA */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-700 text-white text-sm font-semibold hover:bg-amber-800 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

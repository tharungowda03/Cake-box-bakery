import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Spinner } from '../ui/Spinner';
import { UnauthorizedPage } from '../../pages/UnauthorizedPage';

/**
 * OwnerRoute — wraps any route that should only be accessible to OWNER accounts.
 *
 * Decision flow (in strict order):
 *
 *   1. loading === true
 *      → Show spinner. Never make a routing decision while auth/role is unknown.
 *        This prevents the owner dashboard from briefly flashing before the role
 *        has been fetched from the database.
 *
 *   2. !user
 *      → Redirect to /login with return URL. User is not authenticated at all.
 *
 *   3. role !== 'OWNER'
 *      → Render UnauthorizedPage (403). User is authenticated but is not an owner.
 *        We render the 403 page rather than silently redirecting so the user
 *        understands what happened.
 *
 *   4. role === 'OWNER'
 *      → Render children. Access granted.
 *
 * SECURITY NOTE:
 * This component provides the frontend UX layer of owner protection.
 * The backend independently enforces OWNER role on every /api/owner/* endpoint
 * via the requireAuth + ownerGate middleware in server/src/routes/owner.ts.
 * Both layers must be present — neither alone is sufficient.
 */
export const OwnerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // ─── Step 1: Auth/role is still being determined ──────────────────────────
  // loading stays true until BOTH the session AND the profile role have been
  // fetched from Supabase (see AuthContext.tsx). Do not render anything yet.
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-xs text-stone-400 font-medium tracking-wide">
            Checking your account…
          </p>
        </div>
      </div>
    );
  }

  // ─── Step 2: Not authenticated at all ────────────────────────────────────
  if (!user) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  // ─── Step 3: Authenticated but not an owner ───────────────────────────────
  if (role !== 'OWNER') {
    return <UnauthorizedPage />;
  }

  // ─── Step 4: Authenticated owner — allow access ───────────────────────────
  return <>{children}</>;
};

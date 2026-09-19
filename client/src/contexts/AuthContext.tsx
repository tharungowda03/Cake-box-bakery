import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: 'CUSTOMER' | 'OWNER' | null;
  /** True while session OR profile role is still being determined. Never render
   *  role-gated UI until this is false. */
  loading: boolean;
  signInWithOtp: (email: string) => Promise<{ error: any }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithPassword: (email: string, password: string, fullName?: string, phone?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<'CUSTOMER' | 'OWNER' | null>(null);
  /**
   * loading remains TRUE until BOTH:
   *   1. The Supabase session is resolved, AND
   *   2. The profile role has been fetched from the database
   *
   * This prevents the owner route guard from making a routing decision while
   * the role is still unknown (which would cause a brief flash of the 403 page
   * or an incorrect redirect before the real role arrives).
   */
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Fetches the user's role from public.profiles.
   * Always resolves (never throws) — defaults to 'CUSTOMER' on any error.
   * Returns the resolved role so callers can chain on it.
   */
  const fetchProfileRole = async (userId: string): Promise<'CUSTOMER' | 'OWNER'> => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      const resolved = (data?.role as 'CUSTOMER' | 'OWNER' | undefined) ?? 'CUSTOMER';
      setRole(resolved);
      return resolved;
    } catch {
      setRole('CUSTOMER');
      return 'CUSTOMER';
    }
  };

  useEffect(() => {
    // -----------------------------------------------------------------------
    // Initial session load
    // -----------------------------------------------------------------------
    // We must NOT call setLoading(false) until fetchProfileRole() has resolved.
    // If we call it before, the OwnerRoute guard sees loading=false and role=null
    // and makes an incorrect routing decision.
    // -----------------------------------------------------------------------
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Await role resolution BEFORE marking loading done
        await fetchProfileRole(session.user.id);
      }
      // Role is now known (or user is logged out). Safe to stop loading.
      setLoading(false);
    });

    // -----------------------------------------------------------------------
    // Subsequent auth state changes (sign-in, sign-out, token refresh)
    // -----------------------------------------------------------------------
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Keep loading true while we re-fetch the role on auth change
        setLoading(true);
        await fetchProfileRole(session.user.id);
        setLoading(false);
      } else {
        // Signed out — clear role immediately
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithOtp = async (email: string) => {
    return await supabase.auth.signInWithOtp({ email });
  };

  const signInWithPassword = async (email: string, password: string) => {
    const res = await supabase.auth.signInWithPassword({ email, password });
    if (res.data.user) {
      setUser(res.data.user);
      setSession(res.data.session);
      await fetchProfileRole(res.data.user.id);
    }
    return { error: res.error };
  };

  const signUpWithPassword = async (
    email: string,
    password: string,
    fullName?: string,
    phone?: string
  ) => {
    const res = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone,
        },
      },
    });

    // If user created, update profile with provided full name/phone if profile exists
    if (res.data.user && (fullName || phone)) {
      await supabase
        .from('profiles')
        .update({ full_name: fullName, phone })
        .eq('id', res.data.user.id);
    }

    return { error: res.error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        loading,
        signInWithOtp,
        signInWithPassword,
        signUpWithPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

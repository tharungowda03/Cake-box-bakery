import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: 'CUSTOMER' | 'OWNER' | null;
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
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfileRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      if (data?.role) {
        setRole(data.role as 'CUSTOMER' | 'OWNER');
      } else {
        setRole('CUSTOMER');
      }
    } catch {
      setRole('CUSTOMER');
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileRole(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileRole(session.user.id);
      } else {
        setRole(null);
      }
      setLoading(false);
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

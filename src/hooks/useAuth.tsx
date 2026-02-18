import { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // stable handler so register/unregister use the same function identity
  const handleAuthChange = useCallback((_event: string, newSession: Session | null) => {
    // quick synchronous handler; avoid long async work here
    if (!mountedRef.current) return;
    setSession(newSession);
    setUser(newSession?.user ?? null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // subscribe with a stable callback
    const { data } = supabase.auth.onAuthStateChange(handleAuthChange);
    const subscription = data?.subscription;

    // If supabase returns the initial session synchronously, we still want to set it
    // (onAuthStateChange usually fires INITIAL_SESSION immediately on subscribe).
    // No extra getSession call required.

    return () => {
      // defensive: only call unsubscribe if available
      try {
        subscription?.unsubscribe();
      } catch (err) {
        // swallow errors during cleanup to avoid throwing during unmount
        // optionally log to console for debugging
        // console.warn('Failed to unsubscribe auth listener', err);
      }
    };
  }, [handleAuthChange]);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return 'incorrect email or password';
    return null;
  };

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error('sign out failed');
  };

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

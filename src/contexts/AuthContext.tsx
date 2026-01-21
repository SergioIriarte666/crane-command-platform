import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthUser, Profile, Tenant, AppRole } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  authUser: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshAuthUser: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  isSuperAdmin: () => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
    let timeoutId: number | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timeoutId = window.setTimeout(() => reject(new Error(`[auth] Timeout: ${label}`)), ms);
        }),
      ]);
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
    }
  };

  const fetchUserData = async (userId: string): Promise<AuthUser | null> => {
    // Never fail the whole auth bootstrap just because roles/tenant fetch failed.
    // We prefer returning at least the profile so the app can unlock tenant access.
    let profile: Profile | null = null;
    let roles: AppRole[] = [];
    let tenant: Tenant | null = null;

    try {
      const [{ data: profileData, error: profileError }, { data: rolesData, error: rolesError }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId),
      ]);

      if (profileError) {
        console.error('[auth] profile fetch failed:', profileError);
      } else {
        profile = (profileData as Profile) || null;
      }

      if (rolesError) {
        console.error('[auth] roles fetch failed:', rolesError);
      } else {
        roles = rolesData?.map(r => r.role as AppRole) || [];
      }

      // Tenant object is optional; some hooks can rely on profile.tenant_id directly.
      if (profile?.tenant_id) {
        try {
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', profile.tenant_id)
            .maybeSingle();
          if (!tenantError && tenantData) tenant = tenantData as Tenant;
        } catch (e) {
          console.warn('[auth] tenant fetch failed:', e);
        }
      }

      return {
        id: userId,
        email: profile?.email || '',
        profile,
        roles,
        tenant,
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Return minimal shape if possible
      return {
        id: userId,
        email: '',
        profile: null,
        roles: [],
        tenant: null,
      };
    }
  };

  useEffect(() => {
    let cancelled = false;

    const safe = (fn: () => void) => {
      if (!cancelled) fn();
    };

    // Failsafe: never block the UI indefinitely if auth init fails.
    const loadingTimeout = window.setTimeout(() => {
      safe(() => {
        console.warn('[auth] Initialization timeout reached. Forcing loading=false.');
        setLoading(false);
      });
    }, 12000);

    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      safe(() => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
      });

      try {
        if (nextSession?.user) {
          const userData = await withTimeout(
            fetchUserData(nextSession.user.id),
            8000,
            `fetchUserData (${event})`,
          );
          safe(() => setAuthUser(userData));
        } else {
          safe(() => setAuthUser(null));
        }
      } catch (error) {
        console.error('[auth] Error in onAuthStateChange:', error);
        safe(() => setAuthUser(null));
      } finally {
        safe(() => setLoading(false));
      }
    });

    // Fallback: try to read the session, but never block initialization.
    // Some environments can hang on getSession(); this timeout prevents lock-ups.
    (async () => {
      try {
        const { data, error } = await withTimeout(supabase.auth.getSession(), 4000, 'getSession');
        if (error) throw error;

        const existingSession = data.session;
        safe(() => {
          setSession(existingSession);
          setUser(existingSession?.user ?? null);
        });

        if (existingSession?.user) {
          const userData = await withTimeout(fetchUserData(existingSession.user.id), 8000, 'fetchUserData (getSession)');
          safe(() => setAuthUser(userData));
        }
      } catch (error) {
        // Don't clear state here: onAuthStateChange (INITIAL_SESSION) is the source of truth.
        console.warn('[auth] getSession fallback failed:', error);
      } finally {
        // If the listener didn't fire for any reason, this prevents the 12s failsafe delay.
        safe(() => setLoading(false));
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setAuthUser(null);
  };

  const refreshAuthUser = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const userData = await withTimeout(fetchUserData(user.id), 8000, 'refreshAuthUser');
      setAuthUser(userData);
    } catch (error) {
      console.error('[auth] refreshAuthUser failed:', error);
      setAuthUser(null);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: AppRole) => {
    return authUser?.roles.includes(role) || false;
  };

  const isSuperAdmin = () => hasRole('super_admin');
  const isAdmin = () => hasRole('admin') || hasRole('super_admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        authUser,
        loading,
        signIn,
        signUp,
        signOut,
        refreshAuthUser,
        hasRole,
        isSuperAdmin,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

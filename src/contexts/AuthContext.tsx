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
  const authUserRef = React.useRef<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Keep ref in sync with state to avoid stale closures in listeners
  useEffect(() => {
    authUserRef.current = authUser;
  }, [authUser]);

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
      // Even if this fails, user can proceed as long as profile.tenant_id exists.
      if (profile?.tenant_id) {
        try {
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', profile.tenant_id)
            .maybeSingle();
          
          if (tenantError) {
            console.warn('[auth] tenant fetch failed (non-blocking):', {
              tenantId: profile.tenant_id,
              code: tenantError.code,
              message: tenantError.message,
            });
          } else if (tenantData) {
            tenant = tenantData as Tenant;
          }
        } catch (e) {
          console.warn('[auth] tenant fetch exception (non-blocking):', e);
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
      // If fetching fails, return null so we can decide whether to keep stale data
      return null;
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

    // Initial session check
    const initAuth = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[auth] Initial session check failed:', sessionError);
          safe(() => setLoading(false));
          return;
        }

        if (initialSession?.user) {
          safe(() => {
            setSession(initialSession);
            setUser(initialSession.user);
          });
          
          const userData = await withTimeout(
            fetchUserData(initialSession.user.id),
            8000,
            'initial fetchUserData'
          );
          
          if (userData) {
            safe(() => setAuthUser(userData));
          }
        }
      } catch (err) {
        console.error('[auth] Init error:', err);
      } finally {
        safe(() => setLoading(false));
      }
    };

    // Start initialization
    initAuth();

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      safe(() => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
      });

      // If signed out, clear state immediately
      if (event === 'SIGNED_OUT' || !nextSession?.user) {
        safe(() => {
          setAuthUser(null);
          setLoading(false);
        });
        return;
      }

      // If signed in or token refreshed, fetch fresh data
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        // Avoid double-fetching on initial load since initAuth handles it
        if (event === 'INITIAL_SESSION') return;

        try {
          const userData = await withTimeout(
            fetchUserData(nextSession.user.id),
            8000,
            `fetchUserData (${event})`,
          );
          
          if (userData) {
            safe(() => setAuthUser(userData));
          }
        } catch (err) {
          console.error(`[auth] Error handling ${event}:`, err);
        } finally {
          safe(() => setLoading(false));
        }
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(loadingTimeout);
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
      if (userData) {
        setAuthUser(userData);
      } else {
        console.warn('[auth] refreshAuthUser returned null, keeping existing data');
      }
    } catch (error) {
      console.error('[auth] refreshAuthUser failed:', error);
      // Do not clear authUser on transient failure
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

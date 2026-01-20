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

  const fetchUserData = async (userId: string): Promise<AuthUser | null> => {
    try {
      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      // Fetch roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) throw rolesError;

      const roles = userRoles?.map(r => r.role as AppRole) || [];

      // Fetch tenant if profile has tenant_id
      let tenant: Tenant | null = null;
      if (profile?.tenant_id) {
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', profile.tenant_id)
          .maybeSingle();

        if (!tenantError && tenantData) {
          tenant = tenantData as Tenant;
        }
      }

      return {
        id: userId,
        email: profile?.email || '',
        profile: profile as Profile | null,
        roles,
        tenant,
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
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
          const userData = await fetchUserData(nextSession.user.id);
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

    // THEN check for existing session
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const existingSession = data.session;
        safe(() => {
          setSession(existingSession);
          setUser(existingSession?.user ?? null);
        });

        if (existingSession?.user) {
          try {
            const userData = await fetchUserData(existingSession.user.id);
            safe(() => setAuthUser(userData));
          } catch (error) {
            console.error('[auth] Error fetching user data in getSession:', error);
            safe(() => setAuthUser(null));
          }
        } else {
          safe(() => setAuthUser(null));
        }
      } catch (error) {
        console.error('[auth] getSession failed:', error);
        safe(() => {
          setSession(null);
          setUser(null);
          setAuthUser(null);
        });
      } finally {
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

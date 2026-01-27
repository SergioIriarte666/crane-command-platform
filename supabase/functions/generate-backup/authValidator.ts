import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface AuthResult {
  user: {
    id: string;
    email: string;
  };
  tenantId: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export class AuthValidator {
  constructor(private supabase: SupabaseClient) {}

  async validateRequest(authHeader: string | null): Promise<AuthResult> {
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    // Verify user is authenticated
    const { data: { user }, error: authError } = await this.supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      throw new Error('Usuario no autenticado');
    }

    // Get user's profile and tenant
    const { data: profile, error: profileError } = await this.supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.tenant_id) {
      throw new Error('Usuario sin tenant asociado');
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await this.supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin']);

    if (roleError || !roleData || roleData.length === 0) {
      throw new Error('Solo los administradores pueden generar respaldos');
    }

    const isSuperAdmin = roleData.some(r => r.role === 'super_admin');

    return {
      user: {
        id: user.id,
        email: user.email || ''
      },
      tenantId: profile.tenant_id,
      isAdmin: true,
      isSuperAdmin
    };
  }
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';

type Tenant = Tables<'tenants'>;
type Profile = Tables<'profiles'>;
type UserRole = Tables<'user_roles'>;

// Tenant Settings
export function useTenant() {
  const { authUser } = useAuth();
  
  return useQuery({
    queryKey: ['tenant', authUser?.tenant?.id],
    queryFn: async () => {
      if (!authUser?.tenant?.id) throw new Error('No tenant');
      
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', authUser.tenant.id)
        .single();
      
      if (error) throw error;
      return data as Tenant;
    },
    enabled: !!authUser?.tenant?.id,
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  const { authUser, isSuperAdmin } = useAuth();
  
  return useMutation({
    mutationFn: async (data: TablesUpdate<'tenants'>) => {
      if (!authUser?.tenant?.id) throw new Error('No tenant');
      
      // Filter out sensitive fields for non-super admins
      let updateData = { ...data };
      if (!isSuperAdmin()) {
        const { plan, max_users, max_cranes, is_active, ...safeData } = updateData;
        updateData = safeData;
      }

      const { error } = await supabase
        .from('tenants')
        .update(updateData)
        .eq('id', authUser.tenant.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', authUser?.tenant?.id] });
      toast.success('Configuración de empresa actualizada');
    },
    onError: (error) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });
}

// Users Management
export function useTenantUsers() {
  const { authUser, isSuperAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['tenant-users', authUser?.tenant?.id],
    queryFn: async () => {
      if (!authUser?.tenant?.id && !isSuperAdmin()) throw new Error('No tenant');
      
      // Fetch profiles
      let query = supabase
        .from('profiles')
        .select('*, tenants(name)')
        .order('created_at', { ascending: false });

      // If tenant exists, filter by it. If not (and isSuperAdmin), fetch all.
      if (authUser?.tenant?.id) {
        query = query.eq('tenant_id', authUser.tenant.id);
      }
      
      const { data: profiles, error: profilesError } = await query;
      
      if (profilesError) throw profilesError;
      
      // Fetch roles for these users
      const userIds = profiles.map(p => p.id);
      
      if (userIds.length === 0) return [];

      let rolesQuery = supabase
        .from('user_roles')
        .select('*')
        .in('user_id', userIds);

      if (authUser?.tenant?.id) {
        rolesQuery = rolesQuery.eq('tenant_id', authUser.tenant.id);
      }
      
      const { data: roles, error: rolesError } = await rolesQuery;
      
      if (rolesError) throw rolesError;
      
      // Combine data
      return profiles.map(profile => ({
        ...profile,
        user_roles: roles?.filter(r => r.user_id === profile.id) || [],
      })) as (Profile & { user_roles: UserRole[], tenants: { name: string } | null })[];
    },
    enabled: !!authUser?.tenant?.id || isSuperAdmin(),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Correo de restablecimiento enviado');
    },
    onError: (error) => {
      toast.error('Error al enviar correo: ' + error.message);
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  const { authUser } = useAuth();
  
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      if (!authUser?.tenant?.id) throw new Error('No tenant');
      
      // First, delete existing role for this user in this tenant
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('tenant_id', authUser.tenant.id);
      
      // Then insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: role as 'super_admin' | 'admin' | 'dispatcher' | 'operator',
          tenant_id: authUser.tenant.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
      toast.success('Rol de usuario actualizado');
    },
    onError: (error) => {
      toast.error('Error al actualizar rol: ' + error.message);
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
      toast.success('Estado de usuario actualizado');
    },
    onError: (error) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });
}

export function useAdminCreateUser() {
  const queryClient = useQueryClient();
  const { authUser, isSuperAdmin } = useAuth();

  return useMutation({
    mutationFn: async ({ email, fullName, role, tenantId, mustChangePassword }: { email: string; fullName: string; role: string; tenantId?: string; mustChangePassword?: boolean }) => {
      // Ensure tenantId is provided, defaulting to current context
      if (!tenantId) {
        tenantId = authUser?.tenant?.id;
      }

      const { data, error } = await supabase.functions.invoke('admin-create-user', {
        body: { email, fullName, role, tenantId, mustChangePassword },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
      // Success toast handled in component to show password
    },
    onError: (error: any) => {
      toast.error('Error al crear usuario: ' + error.message);
    },
  });
}

// Role descriptions for UI
export const roleDescriptions = {
  super_admin: {
    label: 'Super Admin',
    description: 'Acceso total al sistema, incluyendo gestión de empresas',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  admin: {
    label: 'Administrador',
    description: 'Administración completa de la empresa',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
  dispatcher: {
    label: 'Despachador',
    description: 'Gestión de servicios y operaciones',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  operator: {
    label: 'Operador',
    description: 'Visualización y ejecución de servicios asignados',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
};

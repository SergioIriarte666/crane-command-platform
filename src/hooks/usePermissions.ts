import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type Permission = {
  id: string;
  label: string;
  group_name: string;
  description: string | null;
  sort_order: number;
};

export type RolePermission = {
  id: string;
  role: string;
  permission_id: string;
  tenant_id: string | null;
};

export type AppRole = 'super_admin' | 'admin' | 'dispatcher' | 'operator';

// Fetch all available permissions
export function usePermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as Permission[];
    },
  });
}

// Fetch role permissions (system defaults + tenant overrides)
export function useRolePermissions() {
  const { authUser } = useAuth();
  
  return useQuery({
    queryKey: ['role-permissions', authUser?.tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*');
      
      if (error) throw error;
      return data as RolePermission[];
    },
    enabled: !!authUser,
  });
}

// Get effective permissions for a role (tenant-specific overrides system defaults)
export function getEffectiveRolePermissions(
  role: AppRole, 
  allRolePermissions: RolePermission[], 
  tenantId?: string
): string[] {
  if (!allRolePermissions) return [];
  
  // Get tenant-specific permissions for this role
  const tenantPermissions = allRolePermissions.filter(
    rp => rp.role === role && rp.tenant_id === tenantId
  );
  
  // If tenant has custom permissions, use those; otherwise use system defaults (tenant_id = null)
  if (tenantPermissions.length > 0) {
    return tenantPermissions.map(rp => rp.permission_id);
  }
  
  // Use system defaults
  return allRolePermissions
    .filter(rp => rp.role === role && rp.tenant_id === null)
    .map(rp => rp.permission_id);
}

// Hook version of getEffectiveRolePermissions
export function useEffectiveRolePermissions(role: AppRole): string[] {
  const { authUser } = useAuth();
  const { data: allRolePermissions } = useRolePermissions();
  
  return getEffectiveRolePermissions(role, allRolePermissions || [], authUser?.tenant?.id);
}

// Check if a role has a specific permission
export function useHasRolePermission(role: AppRole, permissionId: string): boolean {
  const effectivePermissions = useEffectiveRolePermissions(role);
  return effectivePermissions.includes(permissionId);
}

// Update permissions for a role (for admin/super_admin)
export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  const { authUser, isSuperAdmin } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      role, 
      permissionIds,
      tenantId 
    }: { 
      role: AppRole; 
      permissionIds: string[];
      tenantId: string | null;
    }) => {
      // Determine which tenant_id to use
      const resolvedTenantId = isSuperAdmin() && tenantId === null
        ? null
        : (tenantId || authUser?.tenant?.id);

      if (resolvedTenantId === undefined) {
        throw new Error('No tenant');
      }

      // Delete existing permissions for this role/tenant combo
      let deleteQuery = supabase
        .from('role_permissions')
        .delete()
        .eq('role', role);

      if (resolvedTenantId === null) {
        deleteQuery = deleteQuery.is('tenant_id', null);
      } else {
        deleteQuery = deleteQuery.eq('tenant_id', resolvedTenantId);
      }
      
      const { error: deleteError } = await deleteQuery;
      
      if (deleteError) throw deleteError;
      
      // Insert new permissions
      if (permissionIds.length > 0) {
        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(
            permissionIds.map(permId => ({
              role,
              permission_id: permId,
              tenant_id: targetTenantId,
            }))
          );
        
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success('Permisos actualizados correctamente');
    },
    onError: (error) => {
      toast.error('Error al actualizar permisos: ' + error.message);
    },
  });
}

// Get current user's permissions
export function useUserPermissions(): string[] {
  const { authUser } = useAuth();
  const { data: allRolePermissions } = useRolePermissions();
  
  if (!authUser || !allRolePermissions) return [];
  
  const userRoles = authUser.roles || [];
  const tenantId = authUser.tenant?.id;
  
  const permissionSet = new Set<string>();
  
  userRoles.forEach(role => {
    const effectivePerms = getEffectiveRolePermissions(
      role as AppRole, 
      allRolePermissions, 
      tenantId
    );
    effectivePerms.forEach(p => permissionSet.add(p));
  });
  
  return Array.from(permissionSet);
}

// Hook to check if current user has a permission
export function useHasPermission(permissionId: string): boolean {
  const { isSuperAdmin } = useAuth();
  const userPermissions = useUserPermissions();
  
  // Super admin always has all permissions
  if (isSuperAdmin()) return true;
  
  return userPermissions.includes(permissionId);
}

// Group permissions by group_name
export function groupPermissionsByGroup(permissions: Permission[]): Record<string, Permission[]> {
  return permissions.reduce((acc, perm) => {
    if (!acc[perm.group_name]) {
      acc[perm.group_name] = [];
    }
    acc[perm.group_name].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);
}

// Role metadata
export const roleMetadata: Record<AppRole, { label: string; description: string; color: string }> = {
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

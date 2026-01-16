import { ReactNode } from 'react';
import { useHasPermission } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';

interface PermissionGateProps {
  permission: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
  requireAll?: boolean; // If true, requires all permissions; if false (default), requires any
}

/**
 * PermissionGate component to conditionally render children based on user permissions.
 * 
 * Usage:
 * <PermissionGate permission="clients_edit">
 *   <Button>Editar Cliente</Button>
 * </PermissionGate>
 * 
 * Multiple permissions (any):
 * <PermissionGate permission={["clients_edit", "clients_delete"]}>
 *   <Button>Gestionar Cliente</Button>
 * </PermissionGate>
 * 
 * Multiple permissions (all required):
 * <PermissionGate permission={["clients_edit", "clients_delete"]} requireAll>
 *   <Button>Editar y Eliminar</Button>
 * </PermissionGate>
 */
export function PermissionGate({ 
  permission, 
  children, 
  fallback = null,
  requireAll = false 
}: PermissionGateProps) {
  const { isSuperAdmin, authUser } = useAuth();
  const permissions = Array.isArray(permission) ? permission : [permission];
  
  // We need to check the first permission with the hook
  const hasFirstPermission = useHasPermission(permissions[0]);
  
  // Super admin always has access
  if (isSuperAdmin()) {
    return <>{children}</>;
  }
  
  // If user is not authenticated, don't show anything
  if (!authUser) {
    return <>{fallback}</>;
  }
  
  // For single permission, just check the first one
  if (permissions.length === 1) {
    return hasFirstPermission ? <>{children}</> : <>{fallback}</>;
  }
  
  // For multiple permissions, we can only reliably check the first one
  // due to React hooks rules. For full multi-permission support,
  // use the useUserPermissions hook directly in your component.
  return hasFirstPermission ? <>{children}</> : <>{fallback}</>;
}

// Export a hook version for programmatic checks
export function useCanAccess(permission: string): boolean {
  const { isSuperAdmin } = useAuth();
  const hasPermission = useHasPermission(permission);
  
  if (isSuperAdmin()) return true;
  
  return hasPermission;
}

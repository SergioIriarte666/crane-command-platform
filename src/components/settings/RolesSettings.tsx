import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Shield, Eye, Edit, Trash2, Plus, Save, Loader2 } from 'lucide-react';
import { 
  usePermissions, 
  useRolePermissions, 
  useUpdateRolePermissions,
  groupPermissionsByGroup,
  roleMetadata,
  getEffectiveRolePermissions,
  type AppRole 
} from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const ROLES: AppRole[] = ['super_admin', 'admin', 'dispatcher', 'operator'];

export function RolesSettings() {
  const { isSuperAdmin } = useAuth();
  const { data: permissions, isLoading: loadingPermissions } = usePermissions();
  const { data: rolePermissions, isLoading: loadingRolePermissions } = useRolePermissions();
  const updateRolePermissions = useUpdateRolePermissions();
  
  // Local state for editing
  const [editedPermissions, setEditedPermissions] = useState<Record<AppRole, Set<string>>>({
    super_admin: new Set(),
    admin: new Set(),
    dispatcher: new Set(),
    operator: new Set(),
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [savingRole, setSavingRole] = useState<AppRole | null>(null);

  // Initialize edited permissions from database
  useEffect(() => {
    if (rolePermissions) {
      const newEdited: Record<AppRole, Set<string>> = {
        super_admin: new Set(),
        admin: new Set(),
        dispatcher: new Set(),
        operator: new Set(),
      };
      
      ROLES.forEach(role => {
        const perms = getEffectiveRolePermissions(role, rolePermissions, undefined);
        newEdited[role] = new Set(perms);
      });
      
      setEditedPermissions(newEdited);
    }
  }, [rolePermissions]);

  const canEdit = isSuperAdmin();
  const isLoading = loadingPermissions || loadingRolePermissions;

  const handlePermissionToggle = (role: AppRole, permissionId: string) => {
    if (!canEdit) return;
    
    setEditedPermissions(prev => {
      const newSet = new Set(prev[role]);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return { ...prev, [role]: newSet };
    });
    setHasChanges(true);
  };

  const handleSaveRole = async (role: AppRole) => {
    setSavingRole(role);
    try {
      await updateRolePermissions.mutateAsync({
        role,
        permissionIds: Array.from(editedPermissions[role]),
        tenantId: null, // System-wide defaults (super_admin only)
      });
      setHasChanges(false);
    } finally {
      setSavingRole(null);
    }
  };

  const handleSaveAll = async () => {
    for (const role of ROLES) {
      setSavingRole(role);
      await updateRolePermissions.mutateAsync({
        role,
        permissionIds: Array.from(editedPermissions[role]),
        tenantId: null,
      });
    }
    setSavingRole(null);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groupedPermissions = permissions ? groupPermissionsByGroup(permissions) : {};
  const groups = Object.keys(groupedPermissions);

  return (
    <div className="space-y-6">
      {/* Header with save button */}
      {canEdit && hasChanges && (
        <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm text-primary font-medium">
            Tienes cambios sin guardar en los permisos
          </p>
          <Button onClick={handleSaveAll} disabled={!!savingRole}>
            {savingRole ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Todos
              </>
            )}
          </Button>
        </div>
      )}

      {/* Role Cards */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Roles y Permisos</CardTitle>
              <CardDescription>
                {canEdit 
                  ? 'Administra los permisos asignados a cada rol del sistema'
                  : 'Visualiza los permisos asignados a cada rol del sistema'
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {ROLES.map((role) => {
              const info = roleMetadata[role];
              const perms = editedPermissions[role];

              return (
                <Card key={role} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className={info.color}>{info.label}</Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {perms.size} permisos
                        </span>
                        {canEdit && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleSaveRole(role)}
                            disabled={!!savingRole}
                          >
                            {savingRole === role ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                    <CardDescription className="mt-2">
                      {info.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {groups.map((group) => {
                        const groupPerms = groupedPermissions[group] || [];
                        const hasAnyPerm = groupPerms.some((p) => perms.has(p.id));

                        if (!hasAnyPerm) return null;

                        return (
                          <div key={group}>
                            <h4 className="text-sm font-medium mb-2">{group}</h4>
                            <div className="flex flex-wrap gap-2">
                              {groupPerms.map((perm) => {
                                const hasPerm = perms.has(perm.id);
                                if (!hasPerm) return null;

                                const Icon = perm.id.includes('view')
                                  ? Eye
                                  : perm.id.includes('edit') || perm.id.includes('create')
                                  ? Edit
                                  : perm.id.includes('delete')
                                  ? Trash2
                                  : Plus;

                                return (
                                  <Badge
                                    key={perm.id}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                  >
                                    <Icon className="h-3 w-3" />
                                    {perm.label.replace('Ver ', '').replace('Editar ', '').replace('Eliminar ', '').replace('Crear ', '').replace('Gestionar ', '')}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Permission Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Permisos</CardTitle>
          <CardDescription>
            {canEdit 
              ? 'Haz clic en los checkboxes para modificar los permisos de cada rol'
              : 'Vista detallada de todos los permisos por rol'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Permiso</th>
                  {ROLES.map((role) => (
                    <th key={role} className="text-center py-3 px-2 font-medium">
                      <Badge className={roleMetadata[role].color} variant="secondary">
                        {roleMetadata[role].label}
                      </Badge>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <>
                    <tr key={`group-${group}`} className="bg-muted/50">
                      <td colSpan={ROLES.length + 1} className="py-2 px-2 font-medium">
                        {group}
                      </td>
                    </tr>
                    {(groupedPermissions[group] || []).map((perm) => (
                      <tr key={perm.id} className="border-b border-muted">
                        <td className="py-2 px-2 pl-6">
                          <div>
                            <span>{perm.label}</span>
                            {perm.description && (
                              <p className="text-xs text-muted-foreground">{perm.description}</p>
                            )}
                          </div>
                        </td>
                        {ROLES.map((role) => (
                          <td key={`${role}-${perm.id}`} className="text-center py-2 px-2">
                            <Checkbox
                              checked={editedPermissions[role].has(perm.id)}
                              disabled={!canEdit}
                              onCheckedChange={() => handlePermissionToggle(role, perm.id)}
                              className={canEdit ? 'cursor-pointer' : 'pointer-events-none opacity-50'}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

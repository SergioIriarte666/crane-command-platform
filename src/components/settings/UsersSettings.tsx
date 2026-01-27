import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { useTenantUsers, useUpdateUserRole, useToggleUserStatus, useResetPassword, useAdminCreateUser, roleDescriptions } from '@/hooks/useSettings';
import { useAuth } from '@/contexts/AuthContext';
import { usePendingInvitations, useCreateInvitation, useDeleteInvitation, useResendInvitation } from '@/hooks/useInvitations';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { Loader2, Search, UserPlus, Users, Phone, Clock, Trash2, RefreshCw, Copy, Check, Link2, MoreVertical, Key, UserCheck, ChevronDown, ChevronRight } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AppRole } from '@/types/auth';

export function UsersSettings() {
  const { data: users, isLoading } = useTenantUsers();
  const { isSuperAdmin } = useAuth();
  const { canCreateUser } = usePlanLimits();
  const { data: pendingInvitations, isLoading: invitationsLoading } = usePendingInvitations();
  const updateRole = useUpdateUserRole();
  const toggleStatus = useToggleUserStatus();
  const resetPassword = useResetPassword();
  const adminCreateUser = useAdminCreateUser();
  const createInvitation = useCreateInvitation();
  const deleteInvitation = useDeleteInvitation();
  const resendInvitation = useResendInvitation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('dispatcher');
  
  // Manual Create User State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createFullName, setCreateFullName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createRole, setCreateRole] = useState<AppRole>('operator');
  const [createMustChangePassword, setCreateMustChangePassword] = useState(true);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdUserCredentials, setCreatedUserCredentials] = useState<{email: string, password: string} | null>(null);

  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const filteredUsers = users?.filter((user) =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    try {
      const saved = sessionStorage.getItem('usersSettings_collapsedGroups');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    sessionStorage.setItem('usersSettings_collapsedGroups', JSON.stringify(collapsedGroups));
  }, [collapsedGroups]);

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const groupedUsers = filteredUsers?.reduce((groups, user) => {
    const tenantName = user.tenants?.name || 'Empresa Principal';
    if (!groups[tenantName]) {
      groups[tenantName] = [];
    }
    groups[tenantName].push(user);
    return groups;
  }, {} as Record<string, typeof filteredUsers>);

  const handleRoleChange = (userId: string, role: string) => {
    updateRole.mutate({ userId, role });
  };

  const handleStatusToggle = (userId: string, currentStatus: boolean | null) => {
    toggleStatus.mutate({ userId, isActive: !currentStatus });
  };

  const handleResetPassword = (email: string) => {
    if (confirm(`¿Estás seguro de enviar un correo de restablecimiento de contraseña a ${email}?`)) {
      resetPassword.mutate(email);
    }
  };

  const handleCreateUser = async () => {
    if (!createEmail || !createFullName) {
      toast.error('Todos los campos son obligatorios');
      return;
    }

    try {
      const result = await adminCreateUser.mutateAsync({
        email: createEmail,
        fullName: createFullName,
        role: createRole,
        mustChangePassword: createMustChangePassword
      });
      
      setCreatedUserCredentials({
        email: createEmail,
        password: result.tempPassword
      });
      setSuccessDialogOpen(true);
      setCreateDialogOpen(false);
      
      // Reset form
      setCreateFullName('');
      setCreateEmail('');
      setCreateRole('operator');
      setCreateMustChangePassword(true);
      
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail) {
      toast.error('Ingresa un email válido');
      return;
    }
    
    await createInvitation.mutateAsync({ 
      email: inviteEmail, 
      role: inviteRole 
    });
    
    setInviteDialogOpen(false);
    setInviteEmail('');
    setInviteRole('dispatcher');
  };

  const copyInvitationLink = async (token: string) => {
    const link = `${window.location.origin}/auth/invitation/${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedToken(token);
    toast.success('Enlace copiado al portapapeles');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  type TenantUser = NonNullable<typeof users>[number] & {
    user_roles?: Array<{ role: string }> | null;
  };

  const getUserRole = (user: TenantUser) => {
    const role = user.user_roles?.[0]?.role;
    return role || 'operator';
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'super_admin': 'Super Admin',
      'admin': 'Administrador',
      'dispatcher': 'Despachador',
      'operator': 'Operador',
    };
    return labels[role] || role;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>
                  Administra los usuarios y sus permisos
                </CardDescription>
              </div>
            </div>
            {canCreateUser ? (
              <div className="flex gap-2">
                {isSuperAdmin() && (
                  <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <UserCheck className="h-4 w-4 mr-2" />
                        Crear Manualmente
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                        <DialogDescription>
                          Crea un usuario directamente y obtén una contraseña temporal.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="create-fullname">Nombre Completo</Label>
                          <Input
                            id="create-fullname"
                            placeholder="Juan Pérez"
                            value={createFullName}
                            onChange={(e) => setCreateFullName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="create-email">Email</Label>
                          <Input
                            id="create-email"
                            type="email"
                            placeholder="usuario@ejemplo.com"
                            value={createEmail}
                            onChange={(e) => setCreateEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="create-role">Rol</Label>
                          <Select value={createRole} onValueChange={(v) => setCreateRole(v as AppRole)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="dispatcher">Despachador</SelectItem>
                              <SelectItem value="operator">Operador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                          <Checkbox 
                            id="must-change-password" 
                            checked={createMustChangePassword}
                            onCheckedChange={(checked) => setCreateMustChangePassword(checked as boolean)}
                          />
                          <Label 
                            htmlFor="must-change-password" 
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Obligar cambio de contraseña en primer inicio
                          </Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleCreateUser}
                          disabled={adminCreateUser.isPending}
                        >
                          {adminCreateUser.isPending && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Crear Usuario
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}

                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invitar Usuario
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invitar Nuevo Usuario</DialogTitle>
                      <DialogDescription>
                        Se generará un enlace de invitación para que el usuario se registre
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="invite-email">Email</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          placeholder="usuario@ejemplo.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invite-role">Rol</Label>
                        <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="dispatcher">Despachador</SelectItem>
                            <SelectItem value="operator">Operador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleInviteUser}
                        disabled={createInvitation.isPending}
                      >
                        {createInvitation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Link2 className="h-4 w-4 mr-2" />
                        )}
                        Crear Invitación
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <Button disabled variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Límite de usuarios alcanzado
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList>
              <TabsTrigger value="users">
                Usuarios ({users?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="invitations">
                Invitaciones pendientes ({pendingInvitations?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedUsers && Object.entries(groupedUsers).map(([tenantName, groupUsers]) => (
                      <>
                        <TableRow 
                          key={`group-${tenantName}`}
                          className="bg-muted/30 hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleGroup(tenantName)}
                        >
                          <TableCell colSpan={6} className="py-2">
                            <div className="flex items-center font-semibold text-sm">
                              {collapsedGroups[tenantName] ? (
                                <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" />
                              )}
                              {tenantName} 
                              <span className="ml-2 text-muted-foreground font-normal text-xs">
                                ({groupUsers?.length || 0} usuarios)
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {!collapsedGroups[tenantName] && groupUsers?.map((user) => {
                          const role = getUserRole(user);
                          const roleInfo = roleDescriptions[role as keyof typeof roleDescriptions];
                          
                          return (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-9 w-9">
                                    <AvatarImage src={user.avatar_url || undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                      {getInitials(user.full_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{user.full_name || 'Sin nombre'}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {user.phone && (
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {user.phone}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={role}
                                  onValueChange={(value) => handleRoleChange(user.id, value)}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue>
                                      <Badge className={roleInfo?.color}>
                                        {roleInfo?.label || role}
                                      </Badge>
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                    <SelectItem value="dispatcher">Despachador</SelectItem>
                                    <SelectItem value="operator">Operador</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={user.is_active ?? true}
                                    onCheckedChange={() => handleStatusToggle(user.id, user.is_active)}
                                  />
                                  <span className="text-sm">
                                    {user.is_active ? 'Activo' : 'Inactivo'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {user.created_at
                                  ? format(new Date(user.created_at), 'dd MMM yyyy', { locale: es })
                                  : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleResetPassword(user.email)}>
                                      <Key className="mr-2 h-4 w-4" />
                                      Restablecer contraseña
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </>
                    ))}
                    {(!filteredUsers || filteredUsers.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No se encontraron usuarios
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="invitations" className="space-y-4">
              {invitationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : pendingInvitations?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay invitaciones pendientes</p>
                  <p className="text-sm">Invita usuarios usando el botón de arriba</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Expira</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingInvitations?.map((invitation) => (
                        <TableRow key={invitation.id}>
                          <TableCell className="font-medium">
                            {invitation.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getRoleLabel(invitation.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(invitation.expires_at), {
                                addSuffix: true,
                                locale: es,
                              })}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyInvitationLink(invitation.token)}
                              >
                                {copiedToken === invitation.token ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resendInvitation.mutate(invitation)}
                                disabled={resendInvitation.isPending}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => deleteInvitation.mutate(invitation.id)}
                                disabled={deleteInvitation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuario Creado Exitosamente</DialogTitle>
            <DialogDescription>
              El usuario ha sido creado. Por favor, copia la contraseña temporal y envíala al usuario.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-muted rounded-md space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <div className="font-medium">{createdUserCredentials?.email}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Contraseña Temporal</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-background px-2 py-1 rounded border font-mono flex-1">
                  {createdUserCredentials?.password}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (createdUserCredentials?.password) {
                      navigator.clipboard.writeText(createdUserCredentials.password);
                      toast.success('Contraseña copiada');
                    }
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSuccessDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

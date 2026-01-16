import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Truck,
  LayoutDashboard,
  Users,
  Car,
  UserCog,
  ClipboardList,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  Building2,
  Package,
  Warehouse,
  Bell,
  CreditCard,
  Calculator,
  ChevronUp,
  LogOut,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const menuItems = [
  {
    group: 'Principal',
    items: [
      { title: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    ],
  },
  {
    group: 'Operación',
    items: [
      { title: 'Clientes', icon: Users, href: '/clientes' },
      { title: 'Flota', icon: Car, href: '/flota' },
      { title: 'Operadores', icon: UserCog, href: '/operadores' },
      { title: 'Proveedores', icon: Building2, href: '/proveedores' },
      { title: 'Inventario', icon: Warehouse, href: '/inventario' },
    ],
  },
  {
    group: 'Servicios',
    items: [
      { title: 'Servicios', icon: ClipboardList, href: '/servicios' },
    ],
  },
  {
    group: 'Finanzas',
    items: [
      { title: 'Facturación', icon: FileText, href: '/facturacion' },
      { title: 'Conciliación', icon: CreditCard, href: '/conciliacion' },
      { title: 'Cierres', icon: Calculator, href: '/cierres' },
      { title: 'Comisiones', icon: DollarSign, href: '/comisiones' },
      { title: 'Costos', icon: Package, href: '/costos' },
    ],
  },
  {
    group: 'Análisis',
    items: [
      { title: 'Reportes', icon: BarChart3, href: '/reportes' },
      { title: 'Notificaciones', icon: Bell, href: '/notificaciones' },
    ],
  },
];

const adminMenuItems = [
  {
    group: 'Administración',
    items: [
      { title: 'Configuración', icon: Settings, href: '/configuracion' },
    ],
  },
];

const superAdminMenuItems = [
  {
    group: 'Super Admin',
    items: [
      { title: 'Empresas', icon: Building2, href: '/admin/tenants' },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { authUser, signOut, isAdmin, isSuperAdmin } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const allMenuItems = [
    ...menuItems,
    ...(isAdmin() ? adminMenuItems : []),
    ...(isSuperAdmin() ? superAdminMenuItems : []),
  ];

  const tenantLogo = authUser?.tenant?.logo_url;
  const tenantName = authUser?.tenant?.name || 'NTMS';

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <Link to="/dashboard" className="flex items-center gap-3">
          {tenantLogo ? (
            <img 
              src={tenantLogo} 
              alt="Logo" 
              className="w-10 h-10 object-contain rounded-xl shrink-0"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-lg text-sidebar-foreground">{tenantName}</span>
              <span className="text-xs text-sidebar-foreground/60 truncate">
                Sistema de Gestión
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {allMenuItems.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50 px-3 mb-2">
              {group.group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = location.pathname === item.href || 
                    (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className="h-10 px-3"
                      >
                        <Link to={item.href}>
                          <item.icon className="w-5 h-5" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`w-full flex items-center gap-3 rounded-lg hover:bg-sidebar-accent transition-colors ${isCollapsed ? 'p-1 justify-center' : 'p-3'}`}>
              <Avatar className="w-9 h-9 shrink-0">
                <AvatarImage src={authUser?.profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials(authUser?.profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {authUser?.profile?.full_name || 'Usuario'}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 truncate">
                      {authUser?.email}
                    </p>
                  </div>
                  <ChevronUp className="w-4 h-4 text-sidebar-foreground/60" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link to="/perfil">Mi Perfil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/configuracion">Configuración</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => signOut()}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

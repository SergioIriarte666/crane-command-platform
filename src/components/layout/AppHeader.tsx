import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Settings, LogOut, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NotificationsPopover } from '@/components/notifications/NotificationsPopover';
import { GlobalSearchDialog } from './GlobalSearchDialog';

export function AppHeader() {
  const { authUser, signOut } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = () => {
    if (!authUser?.roles.length) return null;
    const role = authUser.roles[0];
    const roleLabels: Record<string, string> = {
      super_admin: 'Super Admin',
      admin: 'Administrador',
      dispatcher: 'Despachador',
      operator: 'Operador',
    };
    const roleColors: Record<string, string> = {
      super_admin: 'bg-gradient-purple text-white',
      admin: 'bg-gradient-primary text-white',
      dispatcher: 'bg-gradient-success text-white',
      operator: 'bg-secondary text-secondary-foreground',
    };
    return (
      <Badge className={`${roleColors[role]} text-xs`}>
        {roleLabels[role]}
      </Badge>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-6">
          <SidebarTrigger className="-ml-2" />

          {/* Search Trigger */}
          <div className="flex-1 max-w-xl">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex items-center w-full h-10 px-3 gap-2 rounded-md bg-muted/50 text-muted-foreground hover:bg-muted transition-colors text-sm"
            >
              <Search className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">Buscar servicios, clientes, grúas...</span>
              <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <NotificationsPopover />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 gap-2 px-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={authUser?.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {getInitials(authUser?.profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {authUser?.profile?.full_name || 'Usuario'}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {authUser?.profile?.full_name || 'Usuario'}
                    </p>
                    <p className="text-xs text-muted-foreground">{authUser?.email}</p>
                    <div className="pt-1">{getRoleBadge()}</div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/perfil">
                    <User className="mr-2 h-4 w-4" />
                    Mi Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/configuracion">
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Global Search Dialog */}
      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

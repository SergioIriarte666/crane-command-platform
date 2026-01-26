import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Loader2, Clock, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useApplyPreferences } from '@/hooks/useUserPreferences';
import { TrialBanner } from '@/components/layout/TrialBanner';
import { useTrialNotifications } from '@/hooks/useTrialNotifications';

export default function DashboardLayout() {
  const { user, loading, authUser, isSuperAdmin, signOut, refreshAuthUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Apply tenant's primary color to theme
  useThemeColor();
  
  // Apply user appearance preferences (compact mode, animations, high contrast)
  useApplyPreferences();

  // Handle trial notifications
  useTrialNotifications();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check if user must change password
  if (authUser?.profile?.must_change_password) {
    return <Navigate to="/auth/change-password" replace />;
  }

  // Check if user has a tenant assigned (or is super_admin)
  // Use profile.tenant_id as source of truth (it's always set), 
  // authUser.tenant is optional enrichment that may fail
  const hasTenant = Boolean(authUser?.profile?.tenant_id) || Boolean(authUser?.tenant?.id);
  const isSuper = isSuperAdmin();

  // If user has no tenant and is not super_admin, show pending access screen
  if (!hasTenant && !isSuper) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
        <Card className="w-full max-w-md shadow-2xl border-border/50">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Acceso Pendiente</CardTitle>
              <CardDescription className="mt-2">
                Tu cuenta ha sido creada pero aún no has sido asignado a ninguna empresa.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Contacta a tu administrador</p>
                  <p className="text-sm text-muted-foreground">
                    El administrador de tu empresa debe invitarte para que puedas acceder al sistema.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground text-center">
                Conectado como: <strong>{authUser?.profile?.email || user?.email}</strong>
              </p>
              
              <div className="text-xs text-muted-foreground bg-muted p-2 rounded overflow-hidden">
                <p>ID: {user?.id}</p>
                <p>Roles: {authUser?.roles?.length ? authUser.roles.join(', ') : 'Ninguno'}</p>
              </div>

              <Button 
                variant="default"
                onClick={() => refreshAuthUser()}
                className="w-full"
              >
                Reintentar
              </Button>
              <Button 
                variant="outline" 
                onClick={() => signOut()}
                className="w-full"
              >
                Cerrar sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <TrialBanner />
          <AppHeader />
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

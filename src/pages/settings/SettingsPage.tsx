import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, Shield, Bell, Palette, Database, Crown, CreditCard, HardDrive } from 'lucide-react';
import { CompanySettings } from '@/components/settings/CompanySettings';
import { UsersSettings } from '@/components/settings/UsersSettings';
import { RolesSettings } from '@/components/settings/RolesSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { CatalogSettings } from '@/components/settings/CatalogSettings';
import { TenantsSettings } from '@/components/settings/TenantsSettings';
import { PlansConfigSettings } from '@/components/settings/PlansConfigSettings';
import TrialConfigSettings from '@/components/settings/TrialConfigSettings';
import { BackupManagementSection } from '@/components/settings/BackupManagementSection';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company');
  const { isSuperAdmin, isAdmin } = useAuth();

  const baseTabs = [
    { id: 'company', label: 'Empresa', icon: Building2 },
    { id: 'users', label: 'Usuarios', icon: Users },
    { id: 'roles', label: 'Roles', icon: Shield },
    { id: 'catalogs', label: 'Catálogos', icon: Database },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'appearance', label: 'Apariencia', icon: Palette },
  ];

  // Solo admins pueden ver respaldos
  const adminTabs = isAdmin() ? [
    { id: 'backups', label: 'Respaldos', icon: HardDrive },
  ] : [];

  const superAdminTabs = isSuperAdmin() ? [
    { id: 'tenants', label: 'Empresas', icon: Crown },
    { id: 'plans', label: 'Planes', icon: CreditCard },
    { id: 'trials', label: 'Pruebas', icon: Shield },
  ] : [];

  const tabs = [...baseTabs, ...adminTabs, ...superAdminTabs];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">
          Administra la configuración de tu empresa y sistema
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 h-auto gap-2 bg-transparent p-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="company">
          <CompanySettings />
        </TabsContent>

        <TabsContent value="users">
          <UsersSettings />
        </TabsContent>

        <TabsContent value="roles">
          <RolesSettings />
        </TabsContent>

        <TabsContent value="catalogs">
          <CatalogSettings />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceSettings />
        </TabsContent>

        {isAdmin() && (
          <TabsContent value="backups">
            <BackupManagementSection />
          </TabsContent>
        )}

        {isSuperAdmin() && (
          <>
            <TabsContent value="tenants">
              <TenantsSettings />
            </TabsContent>
            <TabsContent value="plans">
              <PlansConfigSettings />
            </TabsContent>
            <TabsContent value="trials">
              <TrialConfigSettings />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

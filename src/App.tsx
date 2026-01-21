import { Toaster } from "@/components/ui/toaster";
import VipClientPipeline from "./pages/vip/VipClientPipeline";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { ThemeProvider } from "next-themes";

// Layout
import DashboardLayout from "@/components/layout/DashboardLayout";

// Auth Pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Onboarding from "@/pages/auth/Onboarding";
import InvitationAccept from "@/pages/auth/InvitationAccept";

// Main Pages
import Dashboard from "@/pages/Dashboard";
import NotFound from "./pages/NotFound";

// Clients
import ClientsPage from "@/pages/clients/ClientsPage";
import ClientFormPage from "@/pages/clients/ClientFormPage";
import ClientDetailPage from "@/pages/clients/ClientDetailPage";

// Fleet
import CranesPage from "@/pages/fleet/CranesPage";
import CraneFormPage from "@/pages/fleet/CraneFormPage";
import CraneDetailPage from "@/pages/fleet/CraneDetailPage";
import CraneMaintenancePage from "@/pages/fleet/CraneMaintenancePage";
import CraneDocumentsPage from "@/pages/fleet/CraneDocumentsPage";

// Operators
import OperatorsPage from "@/pages/operators/OperatorsPage";
import OperatorFormPage from "@/pages/operators/OperatorFormPage";
import OperatorDetailPage from "@/pages/operators/OperatorDetailPage";
import OperatorDocumentsPage from "@/pages/operators/OperatorDocumentsPage";

// Suppliers
import SuppliersPage from "@/pages/suppliers/SuppliersPage";
import SupplierFormPage from "@/pages/suppliers/SupplierFormPage";
import SupplierDetailPage from "@/pages/suppliers/SupplierDetailPage";

// Inventory
import InventoryPage from "@/pages/inventory/InventoryPage";
import InventoryFormPage from "@/pages/inventory/InventoryFormPage";
import InventoryDetailPage from "@/pages/inventory/InventoryDetailPage";

// Services
import ServicesPage from "@/pages/services/ServicesPage";

// Finance
import InvoicesPage from "@/pages/finance/InvoicesPage";
import ClosuresPage from "@/pages/finance/ClosuresPage";
import CommissionsPage from "@/pages/finance/CommissionsPage";
import ReconciliationPage from "@/pages/finance/ReconciliationPage";

// Costs
import CostsPage from "@/pages/costs/CostsPage";
import CostFormPage from "@/pages/costs/CostFormPage";

// Reports
import ReportsPage from "@/pages/reports/ReportsPage";

// Settings
import SettingsPage from "@/pages/settings/SettingsPage";

// Profile
import ProfilePage from "@/pages/profile/ProfilePage";

// Admin
import TenantsAdminPage from "@/pages/admin/TenantsAdminPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationsProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            {/* Onboarding disabled - only super admin creates tenants */}
            <Route path="/auth/onboarding" element={<Onboarding />} />
            <Route path="/auth/invitation/:token" element={<InvitationAccept />} />

            {/* Protected Routes */}
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Clients */}
              <Route path="/clientes" element={<ClientsPage />} />
              <Route path="/clientes/nuevo" element={<ClientFormPage />} />
              <Route path="/clientes/:id" element={<ClientDetailPage />} />
              <Route path="/clientes/:id/editar" element={<ClientFormPage />} />
              
              {/* Fleet */}
              <Route path="/flota" element={<Navigate to="/flota/gruas" replace />} />
              <Route path="/flota/gruas" element={<CranesPage />} />
              <Route path="/flota/gruas/nuevo" element={<CraneFormPage />} />
              <Route path="/flota/gruas/:id" element={<CraneDetailPage />} />
              <Route path="/flota/gruas/:id/editar" element={<CraneFormPage />} />
              <Route path="/flota/gruas/:id/mantenimiento" element={<CraneMaintenancePage />} />
              <Route path="/flota/gruas/:id/documentos" element={<CraneDocumentsPage />} />
              
              {/* Operators */}
              <Route path="/operadores" element={<OperatorsPage />} />
              <Route path="/operadores/nuevo" element={<OperatorFormPage />} />
              <Route path="/operadores/:id" element={<OperatorDetailPage />} />
              <Route path="/operadores/:id/editar" element={<OperatorFormPage />} />
              <Route path="/operadores/:id/documentos" element={<OperatorDocumentsPage />} />
              
              {/* Suppliers */}
              <Route path="/proveedores" element={<SuppliersPage />} />
              <Route path="/proveedores/nuevo" element={<SupplierFormPage />} />
              <Route path="/proveedores/:id" element={<SupplierDetailPage />} />
              <Route path="/proveedores/:id/editar" element={<SupplierFormPage />} />
              
              {/* Inventory */}
              <Route path="/inventario" element={<InventoryPage />} />
              <Route path="/inventario/nuevo" element={<InventoryFormPage />} />
              <Route path="/inventario/:id" element={<InventoryDetailPage />} />
              <Route path="/inventario/:id/editar" element={<InventoryFormPage />} />
              
              {/* Services */}
              <Route path="/servicios" element={<ServicesPage />} />
              <Route path="/servicios/nuevo" element={<Navigate to="/servicios" replace />} />
              <Route path="/servicios/:id/editar" element={<Navigate to="/servicios" replace />} />
              
              
              {/* Finance Routes */}
              <Route path="/facturacion" element={<InvoicesPage />} />
              <Route path="/conciliacion" element={<ReconciliationPage />} />
              <Route path="/cierres" element={<ClosuresPage />} />
              <Route path="/comisiones" element={<CommissionsPage />} />
              
              {/* Costs */}
              <Route path="/costos" element={<CostsPage />} />
              <Route path="/costos/nuevo" element={<CostFormPage />} />
              <Route path="/costos/:id/editar" element={<CostFormPage />} />
              
              {/* Reports */}
              <Route path="/reportes" element={<ReportsPage />} />
              
              {/* Settings */}
              <Route path="/configuracion" element={<SettingsPage />} />
              
              {/* Profile */}
              <Route path="/perfil" element={<ProfilePage />} />
              
              {/* Placeholder routes */}
              <Route path="/notificaciones" element={<ComingSoon title="Notificaciones" />} />
              <Route path="/admin/tenants" element={<TenantsAdminPage />} />
              
              {/* VIP Pipeline */}
              <Route path="/vip/cliente/:clientId" element={<VipClientPipeline />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
      </NotificationsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mb-6">
        <span className="text-4xl">🚧</span>
      </div>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground max-w-md">
        Este módulo está en desarrollo. Pronto estará disponible.
      </p>
    </div>
  );
}

export default App;

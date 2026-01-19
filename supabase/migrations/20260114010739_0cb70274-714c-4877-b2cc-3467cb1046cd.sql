-- Create permissions table (master list of all available permissions)
CREATE TABLE public.permissions (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  group_name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create role_permissions table (which permissions each role has)
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission_id TEXT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (role, permission_id, tenant_id)
);

-- Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Permissions table policies (read-only for all authenticated users)
CREATE POLICY "Anyone can view permissions"
ON public.permissions FOR SELECT
USING (true);

-- Role permissions policies
CREATE POLICY "Users can view role permissions for their tenant"
ON public.role_permissions FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  OR tenant_id IS NULL
  OR is_super_admin(auth.uid())
);

CREATE POLICY "Super admins can manage all role permissions"
ON public.role_permissions FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Admins can manage role permissions for their tenant"
ON public.role_permissions FOR ALL
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Insert all system permissions
INSERT INTO public.permissions (id, label, group_name, description, sort_order) VALUES
-- Dashboard
('dashboard_view', 'Ver Dashboard', 'Dashboard', 'Ver panel principal con estadísticas', 1),

-- Clients
('clients_view', 'Ver Clientes', 'Clientes', 'Ver listado de clientes', 10),
('clients_create', 'Crear Clientes', 'Clientes', 'Crear nuevos clientes', 11),
('clients_edit', 'Editar Clientes', 'Clientes', 'Modificar información de clientes', 12),
('clients_delete', 'Eliminar Clientes', 'Clientes', 'Eliminar clientes del sistema', 13),

-- Services
('services_view', 'Ver Servicios', 'Servicios', 'Ver listado de servicios', 20),
('services_create', 'Crear Servicios', 'Servicios', 'Crear nuevos servicios', 21),
('services_edit', 'Editar Servicios', 'Servicios', 'Modificar servicios existentes', 22),
('services_delete', 'Eliminar Servicios', 'Servicios', 'Eliminar servicios del sistema', 23),

-- Fleet
('fleet_view', 'Ver Flota', 'Flota', 'Ver grúas y vehículos', 30),
('fleet_create', 'Crear Unidades', 'Flota', 'Agregar nuevas grúas', 31),
('fleet_edit', 'Editar Unidades', 'Flota', 'Modificar información de grúas', 32),
('fleet_delete', 'Eliminar Unidades', 'Flota', 'Eliminar grúas del sistema', 33),

-- Operators
('operators_view', 'Ver Operadores', 'Operadores', 'Ver listado de operadores', 40),
('operators_create', 'Crear Operadores', 'Operadores', 'Agregar nuevos operadores', 41),
('operators_edit', 'Editar Operadores', 'Operadores', 'Modificar información de operadores', 42),
('operators_delete', 'Eliminar Operadores', 'Operadores', 'Eliminar operadores del sistema', 43),

-- Finance
('finance_view', 'Ver Finanzas', 'Finanzas', 'Ver módulo financiero', 50),
('invoices_create', 'Crear Facturas', 'Finanzas', 'Crear nuevas facturas', 51),
('invoices_edit', 'Editar Facturas', 'Finanzas', 'Modificar facturas existentes', 52),
('payments_manage', 'Gestionar Pagos', 'Finanzas', 'Registrar y gestionar pagos', 53),
('commissions_manage', 'Gestionar Comisiones', 'Finanzas', 'Administrar comisiones de operadores', 54),

-- Inventory
('inventory_view', 'Ver Inventario', 'Inventario', 'Ver items de inventario', 60),
('inventory_create', 'Crear Items', 'Inventario', 'Agregar nuevos items', 61),
('inventory_edit', 'Editar Items', 'Inventario', 'Modificar items existentes', 62),
('inventory_delete', 'Eliminar Items', 'Inventario', 'Eliminar items del inventario', 63),

-- Reports
('reports_view', 'Ver Reportes', 'Reportes', 'Acceso a reportes y estadísticas', 70),
('reports_export', 'Exportar Reportes', 'Reportes', 'Descargar reportes en diferentes formatos', 71),

-- Settings
('settings_view', 'Ver Configuración', 'Configuración', 'Ver configuración del sistema', 80),
('settings_edit', 'Editar Configuración', 'Configuración', 'Modificar configuración del sistema', 81),
('users_manage', 'Gestionar Usuarios', 'Configuración', 'Administrar usuarios del tenant', 82),
('roles_manage', 'Gestionar Roles', 'Configuración', 'Administrar permisos de roles', 83);

-- Insert default permissions for each role (tenant_id NULL = system defaults)
-- Super Admin gets all permissions
INSERT INTO public.role_permissions (role, permission_id, tenant_id)
SELECT 'super_admin'::app_role, id, NULL FROM public.permissions;

-- Admin gets all except roles_manage (only super_admin can manage roles by default)
INSERT INTO public.role_permissions (role, permission_id, tenant_id)
SELECT 'admin'::app_role, id, NULL FROM public.permissions 
WHERE id NOT IN ('roles_manage');

-- Dispatcher gets operational permissions
INSERT INTO public.role_permissions (role, permission_id, tenant_id)
SELECT 'dispatcher'::app_role, id, NULL FROM public.permissions 
WHERE id IN (
  'dashboard_view',
  'clients_view', 'clients_create', 'clients_edit',
  'services_view', 'services_create', 'services_edit',
  'fleet_view',
  'operators_view',
  'inventory_view',
  'reports_view'
);

-- Operator gets view-only permissions
INSERT INTO public.role_permissions (role, permission_id, tenant_id)
SELECT 'operator'::app_role, id, NULL FROM public.permissions 
WHERE id IN (
  'dashboard_view',
  'services_view',
  'fleet_view',
  'operators_view'
);
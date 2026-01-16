-- ===========================================
-- Migración: Unificar Categorías de Costos al Sistema de Catálogos
-- ===========================================

-- 1. Insertar categorías de costos desde el enum existente para todos los tenants
INSERT INTO catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
SELECT 
  t.id as tenant_id,
  'cost_category' as catalog_type,
  category_data.code,
  category_data.name,
  category_data.description,
  true as is_active,
  category_data.sort_order
FROM tenants t
CROSS JOIN (
  VALUES 
    ('MATERIALS', 'Materiales', 'Materiales y suministros', 1),
    ('LABOR', 'Mano de obra', 'Costos de mano de obra', 2),
    ('SERVICES', 'Servicios', 'Servicios externos', 3),
    ('TAXES', 'Impuestos', 'Impuestos y contribuciones', 4),
    ('TRANSPORT', 'Transporte', 'Gastos de transporte', 5),
    ('EQUIPMENT', 'Equipamiento', 'Equipos y herramientas', 6),
    ('FUEL', 'Combustible', 'Gastos de combustible', 7),
    ('MAINTENANCE', 'Mantenimiento', 'Mantenimiento preventivo y correctivo', 8),
    ('OTHER', 'Otros', 'Otros gastos operativos', 99)
) as category_data(code, name, description, sort_order)
ON CONFLICT DO NOTHING;

-- 2. Insertar centros de costo como tipo de catálogo
INSERT INTO catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
SELECT 
  t.id as tenant_id,
  'cost_center' as catalog_type,
  center_data.code,
  center_data.name,
  center_data.description,
  true as is_active,
  center_data.sort_order
FROM tenants t
CROSS JOIN (
  VALUES 
    ('OPERATIONS', 'Operaciones', 'Centro de costo para operaciones', 1),
    ('ADMIN', 'Administración', 'Gastos administrativos', 2),
    ('FLEET', 'Flota', 'Gastos relacionados con la flota', 3),
    ('PERSONNEL', 'Personal', 'Gastos de personal', 4)
) as center_data(code, name, description, sort_order)
ON CONFLICT DO NOTHING;

-- 3. Agregar columna para referenciar catálogo unificado (temporal, para migración gradual)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'costs' 
    AND column_name = 'catalog_category_id'
  ) THEN
    ALTER TABLE public.costs ADD COLUMN catalog_category_id UUID REFERENCES catalog_items(id);
  END IF;
END $$;

-- 4. Agregar columna para centro de costo desde catálogo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'costs' 
    AND column_name = 'catalog_cost_center_id'
  ) THEN
    ALTER TABLE public.costs ADD COLUMN catalog_cost_center_id UUID REFERENCES catalog_items(id);
  END IF;
END $$;

-- 5. Crear índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_costs_catalog_category_id ON costs(catalog_category_id);
CREATE INDEX IF NOT EXISTS idx_costs_catalog_cost_center_id ON costs(catalog_cost_center_id);
CREATE INDEX IF NOT EXISTS idx_catalog_items_cost_category ON catalog_items(tenant_id, catalog_type) WHERE catalog_type = 'cost_category';
CREATE INDEX IF NOT EXISTS idx_catalog_items_cost_center ON catalog_items(tenant_id, catalog_type) WHERE catalog_type = 'cost_center';
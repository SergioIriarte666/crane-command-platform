-- Add subcategories for cost categories using parent_id relationship
-- First, get existing cost_category IDs and add their subcategories

-- For "Servicios" category - add typical service-related subcategories
INSERT INTO catalog_items (catalog_type, code, name, tenant_id, parent_id, sort_order)
SELECT 'cost_subcategory', 'SERV_COMBUSTIBLE', 'Combustible', tenant_id, id, 1
FROM catalog_items WHERE catalog_type = 'cost_category' AND name = 'Servicios'
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (catalog_type, code, name, tenant_id, parent_id, sort_order)
SELECT 'cost_subcategory', 'SERV_PEAJES', 'Peajes', tenant_id, id, 2
FROM catalog_items WHERE catalog_type = 'cost_category' AND name = 'Servicios'
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (catalog_type, code, name, tenant_id, parent_id, sort_order)
SELECT 'cost_subcategory', 'SERV_VIATICOS', 'Viáticos', tenant_id, id, 3
FROM catalog_items WHERE catalog_type = 'cost_category' AND name = 'Servicios'
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (catalog_type, code, name, tenant_id, parent_id, sort_order)
SELECT 'cost_subcategory', 'SERV_ESTACIONAMIENTO', 'Estacionamiento', tenant_id, id, 4
FROM catalog_items WHERE catalog_type = 'cost_category' AND name = 'Servicios'
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (catalog_type, code, name, tenant_id, parent_id, sort_order)
SELECT 'cost_subcategory', 'SERV_HOSPEDAJE', 'Hospedaje', tenant_id, id, 5
FROM catalog_items WHERE catalog_type = 'cost_category' AND name = 'Servicios'
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (catalog_type, code, name, tenant_id, parent_id, sort_order)
SELECT 'cost_subcategory', 'SERV_OTROS', 'Otros', tenant_id, id, 99
FROM catalog_items WHERE catalog_type = 'cost_category' AND name = 'Servicios'
ON CONFLICT DO NOTHING;

-- For "Mantenimiento" category
INSERT INTO catalog_items (catalog_type, code, name, tenant_id, parent_id, sort_order)
SELECT 'cost_subcategory', 'MANT_PIEZAS', 'Piezas y Repuestos', tenant_id, id, 1
FROM catalog_items WHERE catalog_type = 'cost_category' AND name = 'Mantenimiento'
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (catalog_type, code, name, tenant_id, parent_id, sort_order)
SELECT 'cost_subcategory', 'MANT_MANO_OBRA', 'Mano de obra', tenant_id, id, 2
FROM catalog_items WHERE catalog_type = 'cost_category' AND name = 'Mantenimiento'
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (catalog_type, code, name, tenant_id, parent_id, sort_order)
SELECT 'cost_subcategory', 'MANT_SERVICIOS_EXT', 'Servicios externos', tenant_id, id, 3
FROM catalog_items WHERE catalog_type = 'cost_category' AND name = 'Mantenimiento'
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (catalog_type, code, name, tenant_id, parent_id, sort_order)
SELECT 'cost_subcategory', 'MANT_LUBRICANTES', 'Lubricantes y Fluidos', tenant_id, id, 4
FROM catalog_items WHERE catalog_type = 'cost_category' AND name = 'Mantenimiento'
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (catalog_type, code, name, tenant_id, parent_id, sort_order)
SELECT 'cost_subcategory', 'MANT_HERRAMIENTAS', 'Herramientas', tenant_id, id, 5
FROM catalog_items WHERE catalog_type = 'cost_category' AND name = 'Mantenimiento'
ON CONFLICT DO NOTHING;

-- For "Transporte" category
INSERT INTO catalog_items (catalog_type, code, name, tenant_id, parent_id, sort_order)
SELECT 'cost_subcategory', 'TRANS_ENVIO', 'Envío', tenant_id, id, 1
FROM catalog_items WHERE catalog_type = 'cost_category' AND name = 'Transporte'
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (catalog_type, code, name, tenant_id, parent_id, sort_order)
SELECT 'cost_subcategory', 'TRANS_FLETE', 'Flete', tenant_id, id, 2
FROM catalog_items WHERE catalog_type = 'cost_category' AND name = 'Transporte'
ON CONFLICT DO NOTHING;

-- Update useCatalogs CATALOG_TYPES to include cost_subcategory
-- This is handled in code

-- Add index for faster subcategory lookups
CREATE INDEX IF NOT EXISTS idx_catalog_items_parent ON catalog_items(parent_id) WHERE parent_id IS NOT NULL;
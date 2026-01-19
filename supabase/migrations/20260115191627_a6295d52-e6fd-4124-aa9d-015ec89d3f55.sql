-- Agregar columna para condiciones de pago en facturas
ALTER TABLE invoices 
ADD COLUMN payment_terms_id uuid REFERENCES catalog_items(id);

-- Agregar índice para mejor rendimiento
CREATE INDEX idx_invoices_payment_terms ON invoices(payment_terms_id);

-- Insertar condiciones de pago estándar para todos los tenants existentes
INSERT INTO catalog_items (tenant_id, catalog_type, code, name, description, sort_order, is_active)
SELECT 
  t.id,
  'payment_terms',
  item.code,
  item.name,
  item.description,
  item.sort_order,
  true
FROM tenants t
CROSS JOIN (
  VALUES 
    ('contado', 'Contado', 'Pago al momento de recibir la factura', 1),
    ('transferencia', 'Transferencia Bancaria', 'Pago por transferencia inmediata', 2),
    ('30_dias', '30 Días', 'Pago a 30 días fecha factura', 3),
    ('45_dias', '45 Días', 'Pago a 45 días fecha factura', 4),
    ('60_dias', '60 Días', 'Pago a 60 días fecha factura', 5),
    ('90_dias', '90 Días', 'Pago a 90 días fecha factura', 6)
) AS item(code, name, description, sort_order);
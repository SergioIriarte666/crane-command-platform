-- 1. Agregar valor 'closed' al enum closure_status (para indicar cierre listo para facturar)
ALTER TYPE closure_status ADD VALUE IF NOT EXISTS 'closed';

-- 2. Crear tabla para historial de anulaciones de facturas
CREATE TABLE IF NOT EXISTS invoice_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID UNIQUE NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  credit_note_number TEXT UNIQUE NOT NULL,
  cancellation_reason TEXT NOT NULL,
  reason_details TEXT,
  cancelled_by UUID REFERENCES profiles(id),
  cancelled_at TIMESTAMPTZ DEFAULT now(),
  original_folio TEXT NOT NULL,
  original_numero_fiscal TEXT,
  original_total NUMERIC NOT NULL,
  original_client_id UUID REFERENCES clients(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Agregar columnas faltantes a invoices
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS vat NUMERIC DEFAULT 0;

-- 4. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_invoice_cancellations_invoice ON invoice_cancellations(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_cancellations_tenant ON invoice_cancellations(tenant_id);

-- 5. Enable RLS
ALTER TABLE invoice_cancellations ENABLE ROW LEVEL SECURITY;

-- 6. Crear políticas RLS para invoice_cancellations
CREATE POLICY "Users can view cancellations of their tenant" 
ON invoice_cancellations FOR SELECT 
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create cancellations for their tenant" 
ON invoice_cancellations FOR INSERT 
WITH CHECK (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- 7. Agregar columna para días de las condiciones de pago en catalog_items (metadata)
-- Ya existe metadata en catalog_items, se usará para almacenar { days: number }

-- 8. Actualizar la transición de estados en CLOSURE_TRANSITIONS
COMMENT ON TYPE closure_status IS 'draft -> review -> client_review -> approved -> closed -> invoicing -> invoiced | cancelled';

-- Migración: Convertir estados ENUM a TEXT y poblar catálogos dinámicos

-- 1. Convertir columna services.status de ENUM a TEXT
ALTER TABLE public.services ALTER COLUMN status TYPE text USING status::text;
ALTER TABLE public.services ALTER COLUMN status SET DEFAULT 'draft';

-- 2. Convertir columna billing_closures.status de ENUM a TEXT  
ALTER TABLE public.billing_closures ALTER COLUMN status TYPE text USING status::text;
ALTER TABLE public.billing_closures ALTER COLUMN status SET DEFAULT 'draft';

-- 3. Convertir columna invoices.status de ENUM a TEXT
ALTER TABLE public.invoices ALTER COLUMN status TYPE text USING status::text;
ALTER TABLE public.invoices ALTER COLUMN status SET DEFAULT 'draft';

-- 4. Función para poblar estados por tenant
CREATE OR REPLACE FUNCTION public.seed_status_catalogs_for_tenant(_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Estados de Servicios (10)
  INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order, metadata)
  VALUES
    (_tenant_id, 'service_status', 'draft', 'Borrador', 'Servicio en preparación', true, 1, '{"color": "#6b7280", "bgColor": "bg-gray-100", "textColor": "text-gray-700", "isFinal": false}'::jsonb),
    (_tenant_id, 'service_status', 'quoted', 'Cotizado', 'Esperando confirmación del cliente', true, 2, '{"color": "#06b6d4", "bgColor": "bg-cyan-100", "textColor": "text-cyan-700", "isFinal": false}'::jsonb),
    (_tenant_id, 'service_status', 'confirmed', 'Confirmado', 'Cliente confirmó el servicio', true, 3, '{"color": "#3b82f6", "bgColor": "bg-blue-100", "textColor": "text-blue-700", "isFinal": false}'::jsonb),
    (_tenant_id, 'service_status', 'assigned', 'Asignado', 'Operador y unidad asignados', true, 4, '{"color": "#8b5cf6", "bgColor": "bg-purple-100", "textColor": "text-purple-700", "isFinal": false}'::jsonb),
    (_tenant_id, 'service_status', 'en_route', 'En Camino', 'Operador en camino al origen', true, 5, '{"color": "#eab308", "bgColor": "bg-yellow-100", "textColor": "text-yellow-700", "isFinal": false}'::jsonb),
    (_tenant_id, 'service_status', 'on_site', 'En Sitio', 'Operador llegó al sitio', true, 6, '{"color": "#f97316", "bgColor": "bg-orange-100", "textColor": "text-orange-700", "isFinal": false}'::jsonb),
    (_tenant_id, 'service_status', 'in_progress', 'En Proceso', 'Servicio en ejecución', true, 7, '{"color": "#2563eb", "bgColor": "bg-blue-200", "textColor": "text-blue-800", "isFinal": false}'::jsonb),
    (_tenant_id, 'service_status', 'completed', 'Completado', 'Servicio finalizado exitosamente', true, 8, '{"color": "#22c55e", "bgColor": "bg-green-100", "textColor": "text-green-700", "isFinal": true}'::jsonb),
    (_tenant_id, 'service_status', 'invoiced', 'Facturado', 'Factura emitida', true, 9, '{"color": "#9333ea", "bgColor": "bg-purple-200", "textColor": "text-purple-800", "isFinal": true}'::jsonb),
    (_tenant_id, 'service_status', 'cancelled', 'Cancelado', 'Servicio cancelado', true, 10, '{"color": "#ef4444", "bgColor": "bg-red-100", "textColor": "text-red-700", "isFinal": true}'::jsonb)
  ON CONFLICT DO NOTHING;

  -- Estados de Cierres (7)
  INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order, metadata)
  VALUES
    (_tenant_id, 'closure_status', 'draft', 'Borrador', 'Cierre en preparación', true, 1, '{"color": "#6b7280", "bgColor": "bg-gray-100", "textColor": "text-gray-700", "isFinal": false}'::jsonb),
    (_tenant_id, 'closure_status', 'pending_review', 'En Revisión', 'Pendiente de revisión por cliente', true, 2, '{"color": "#eab308", "bgColor": "bg-yellow-100", "textColor": "text-yellow-700", "isFinal": false}'::jsonb),
    (_tenant_id, 'closure_status', 'approved', 'Aprobado', 'Cliente aprobó el cierre', true, 3, '{"color": "#22c55e", "bgColor": "bg-green-100", "textColor": "text-green-700", "isFinal": false}'::jsonb),
    (_tenant_id, 'closure_status', 'closed', 'Cerrado', 'Cierre finalizado', true, 4, '{"color": "#3b82f6", "bgColor": "bg-blue-100", "textColor": "text-blue-700", "isFinal": false}'::jsonb),
    (_tenant_id, 'closure_status', 'invoicing', 'Facturando', 'En proceso de facturación', true, 5, '{"color": "#8b5cf6", "bgColor": "bg-purple-100", "textColor": "text-purple-700", "isFinal": false}'::jsonb),
    (_tenant_id, 'closure_status', 'invoiced', 'Facturado', 'Factura emitida', true, 6, '{"color": "#9333ea", "bgColor": "bg-purple-200", "textColor": "text-purple-800", "isFinal": true}'::jsonb),
    (_tenant_id, 'closure_status', 'cancelled', 'Cancelado', 'Cierre cancelado', true, 7, '{"color": "#ef4444", "bgColor": "bg-red-100", "textColor": "text-red-700", "isFinal": true}'::jsonb)
  ON CONFLICT DO NOTHING;

  -- Estados de Facturas (6)
  INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order, metadata)
  VALUES
    (_tenant_id, 'invoice_status', 'draft', 'Borrador', 'Factura en preparación', true, 1, '{"color": "#6b7280", "bgColor": "bg-gray-100", "textColor": "text-gray-700", "isFinal": false}'::jsonb),
    (_tenant_id, 'invoice_status', 'pending', 'Pendiente', 'Pendiente de pago', true, 2, '{"color": "#eab308", "bgColor": "bg-yellow-100", "textColor": "text-yellow-700", "isFinal": false}'::jsonb),
    (_tenant_id, 'invoice_status', 'sent', 'Enviada', 'Enviada al cliente', true, 3, '{"color": "#3b82f6", "bgColor": "bg-blue-100", "textColor": "text-blue-700", "isFinal": false}'::jsonb),
    (_tenant_id, 'invoice_status', 'paid', 'Pagada', 'Pago recibido', true, 4, '{"color": "#22c55e", "bgColor": "bg-green-100", "textColor": "text-green-700", "isFinal": true}'::jsonb),
    (_tenant_id, 'invoice_status', 'overdue', 'Vencida', 'Plazo de pago vencido', true, 5, '{"color": "#ef4444", "bgColor": "bg-red-100", "textColor": "text-red-700", "isFinal": false}'::jsonb),
    (_tenant_id, 'invoice_status', 'cancelled', 'Cancelada', 'Factura anulada', true, 6, '{"color": "#4b5563", "bgColor": "bg-gray-200", "textColor": "text-gray-800", "isFinal": true}'::jsonb)
  ON CONFLICT DO NOTHING;
END;
$$;

-- 5. Poblar estados para todos los tenants existentes
DO $$
DECLARE
  tenant_record RECORD;
BEGIN
  FOR tenant_record IN SELECT id FROM public.tenants LOOP
    PERFORM public.seed_status_catalogs_for_tenant(tenant_record.id);
  END LOOP;
END;
$$;

-- Enums para servicios
CREATE TYPE public.service_status AS ENUM (
    'draft', 'quoted', 'confirmed', 'assigned', 'en_route', 
    'on_site', 'in_progress', 'completed', 'invoiced', 'cancelled'
);
CREATE TYPE public.service_type AS ENUM ('local', 'foraneo', 'pension', 'maniobra', 'auxilio');
CREATE TYPE public.service_priority AS ENUM ('normal', 'urgent');
CREATE TYPE public.vehicle_type AS ENUM ('sedan', 'suv', 'pickup', 'van', 'truck', 'motorcycle', 'other');
CREATE TYPE public.vehicle_condition AS ENUM ('runs', 'neutral', 'blocked', 'accident');

-- Tabla de configuración de pipeline (estados personalizables)
CREATE TABLE public.service_pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    status service_status NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6b7280',
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, status)
);

-- Tabla principal de servicios
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    folio TEXT NOT NULL,
    folio_prefix TEXT DEFAULT 'SRV',
    status service_status NOT NULL DEFAULT 'draft',
    type service_type NOT NULL DEFAULT 'local',
    priority service_priority NOT NULL DEFAULT 'normal',
    
    -- Cliente
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    client_contact_name TEXT,
    client_contact_phone TEXT,
    is_insured BOOLEAN DEFAULT false,
    insurance_company_id UUID REFERENCES public.clients(id),
    insurance_policy TEXT,
    insurance_claim TEXT,
    insurance_adjuster TEXT,
    insurance_adjuster_phone TEXT,
    
    -- Vehículo
    vehicle_brand TEXT,
    vehicle_model TEXT,
    vehicle_year INTEGER,
    vehicle_color TEXT,
    vehicle_plates TEXT,
    vehicle_type vehicle_type DEFAULT 'sedan',
    vehicle_condition vehicle_condition DEFAULT 'runs',
    vehicle_keys BOOLEAN DEFAULT true,
    vehicle_notes TEXT,
    
    -- Ubicaciones
    origin_address TEXT,
    origin_city TEXT,
    origin_state TEXT,
    origin_lat DECIMAL(10, 8),
    origin_lng DECIMAL(11, 8),
    origin_references TEXT,
    destination_address TEXT,
    destination_city TEXT,
    destination_state TEXT,
    destination_lat DECIMAL(10, 8),
    destination_lng DECIMAL(11, 8),
    destination_references TEXT,
    distance_km DECIMAL(10, 2),
    
    -- Asignación
    crane_id UUID REFERENCES public.cranes(id) ON DELETE SET NULL,
    operator_id UUID REFERENCES public.operators(id) ON DELETE SET NULL,
    scheduled_date DATE,
    scheduled_time TIME,
    dispatch_time TIMESTAMPTZ,
    arrival_time TIMESTAMPTZ,
    completion_time TIMESTAMPTZ,
    
    -- Costos
    base_rate DECIMAL(12, 2) DEFAULT 0,
    km_rate DECIMAL(10, 2) DEFAULT 0,
    km_charged DECIMAL(10, 2) DEFAULT 0,
    maneuver_charges JSONB DEFAULT '[]',
    highway_tolls DECIMAL(10, 2) DEFAULT 0,
    waiting_time_hours DECIMAL(5, 2) DEFAULT 0,
    waiting_rate DECIMAL(10, 2) DEFAULT 0,
    surcharges JSONB DEFAULT '[]',
    discounts JSONB DEFAULT '[]',
    subtotal DECIMAL(12, 2) DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 19,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) DEFAULT 0,
    
    -- Documentación
    photos JSONB DEFAULT '[]',
    signature_url TEXT,
    notes TEXT,
    internal_notes TEXT,
    
    -- Facturación
    invoice_id UUID,
    billing_closure_id UUID,
    po_number TEXT,
    po_file_url TEXT,
    
    -- Auditoría
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, folio)
);

-- Tabla de historial de estados (timeline)
CREATE TABLE public.service_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    from_status service_status,
    to_status service_status NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_status_history ENABLE ROW LEVEL SECURITY;

-- Políticas para servicios
CREATE POLICY "Users can view tenant services" ON public.services
    FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Super admins can view all services" ON public.services
    FOR SELECT USING (is_super_admin(auth.uid()));

CREATE POLICY "Users can create services" ON public.services
    FOR INSERT WITH CHECK (
        tenant_id = get_user_tenant_id(auth.uid()) AND 
        (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dispatcher'))
    );

CREATE POLICY "Users can update services" ON public.services
    FOR UPDATE USING (
        tenant_id = get_user_tenant_id(auth.uid()) AND 
        (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dispatcher'))
    );

CREATE POLICY "Admins can delete services" ON public.services
    FOR DELETE USING (
        tenant_id = get_user_tenant_id(auth.uid()) AND 
        has_role(auth.uid(), 'admin')
    );

-- Políticas para pipeline stages
CREATE POLICY "Users can view tenant stages" ON public.service_pipeline_stages
    FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can manage stages" ON public.service_pipeline_stages
    FOR ALL USING (
        tenant_id = get_user_tenant_id(auth.uid()) AND 
        has_role(auth.uid(), 'admin')
    );

-- Políticas para historial
CREATE POLICY "Users can view service history" ON public.service_status_history
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM services WHERE id = service_id AND tenant_id = get_user_tenant_id(auth.uid()))
    );

CREATE POLICY "Users can create history entries" ON public.service_status_history
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM services WHERE id = service_id AND tenant_id = get_user_tenant_id(auth.uid()))
    );

-- Trigger para updated_at
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para registrar cambios de estado
CREATE OR REPLACE FUNCTION public.log_service_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.service_status_history (service_id, from_status, to_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_log_service_status_change
    AFTER UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.log_service_status_change();

-- Función para generar folio de servicio
CREATE OR REPLACE FUNCTION public.generate_service_folio(_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_num INTEGER;
    new_folio TEXT;
    current_year TEXT;
BEGIN
    current_year := to_char(now(), 'YY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(folio FROM 8) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.services
    WHERE tenant_id = _tenant_id
    AND folio ~ ('^SRV-' || current_year || '-[0-9]+$');
    
    new_folio := 'SRV-' || current_year || '-' || LPAD(next_num::TEXT, 5, '0');
    RETURN new_folio;
END;
$$;

-- Insertar etapas de pipeline por defecto para cada tenant existente
INSERT INTO public.service_pipeline_stages (tenant_id, status, name, color, sort_order)
SELECT 
    t.id,
    s.status,
    s.name,
    s.color,
    s.sort_order
FROM public.tenants t
CROSS JOIN (VALUES 
    ('draft'::service_status, 'Borrador', '#6b7280', 0),
    ('quoted'::service_status, 'Cotizado', '#60a5fa', 1),
    ('confirmed'::service_status, 'Confirmado', '#3b82f6', 2),
    ('assigned'::service_status, 'Asignado', '#8b5cf6', 3),
    ('en_route'::service_status, 'En Camino', '#eab308', 4),
    ('on_site'::service_status, 'En Sitio', '#f97316', 5),
    ('in_progress'::service_status, 'En Proceso', '#06b6d4', 6),
    ('completed'::service_status, 'Completado', '#22c55e', 7),
    ('invoiced'::service_status, 'Facturado', '#15803d', 8),
    ('cancelled'::service_status, 'Cancelado', '#ef4444', 9)
) AS s(status, name, color, sort_order)
ON CONFLICT (tenant_id, status) DO NOTHING;
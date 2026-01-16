-- Enums para tipos
CREATE TYPE public.crane_type AS ENUM ('plataforma', 'arrastre', 'pesada', 'lowboy', 'auxilio');
CREATE TYPE public.crane_status AS ENUM ('available', 'in_service', 'maintenance', 'out_of_service');
CREATE TYPE public.operator_status AS ENUM ('active', 'inactive', 'vacation', 'suspended');
CREATE TYPE public.commission_type AS ENUM ('percentage', 'fixed', 'mixed');
CREATE TYPE public.document_type AS ENUM ('insurance', 'permit', 'verification', 'registration', 'license', 'ine', 'medical', 'training', 'other');
CREATE TYPE public.maintenance_type AS ENUM ('preventive', 'corrective');
CREATE TYPE public.maintenance_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- Tabla de Grúas
CREATE TABLE public.cranes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    unit_number TEXT NOT NULL,
    type crane_type NOT NULL DEFAULT 'plataforma',
    brand TEXT,
    model TEXT,
    year INTEGER,
    plates TEXT,
    serial_number TEXT,
    capacity_tons NUMERIC(10,2),
    status crane_status NOT NULL DEFAULT 'available',
    current_km INTEGER DEFAULT 0,
    fuel_type TEXT DEFAULT 'diesel',
    fuel_efficiency NUMERIC(6,2),
    gps_device_id TEXT,
    insurance_policy TEXT,
    insurance_expiry DATE,
    circulation_permit TEXT,
    permit_expiry DATE,
    verification_date DATE,
    next_verification DATE,
    acquisition_date DATE,
    acquisition_cost NUMERIC(12,2),
    assigned_operator_id UUID,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, unit_number)
);

-- Tabla de Operadores
CREATE TABLE public.operators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    employee_number TEXT NOT NULL,
    full_name TEXT NOT NULL,
    photo_url TEXT,
    phone TEXT,
    emergency_phone TEXT,
    email TEXT,
    address TEXT,
    birth_date DATE,
    hire_date DATE,
    license_number TEXT,
    license_type TEXT,
    license_expiry DATE,
    blood_type TEXT,
    status operator_status NOT NULL DEFAULT 'active',
    assigned_crane_id UUID,
    commission_type commission_type DEFAULT 'percentage',
    commission_percentage NUMERIC(5,2) DEFAULT 0,
    commission_fixed_amount NUMERIC(10,2) DEFAULT 0,
    bank_name TEXT,
    bank_account TEXT,
    clabe TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, employee_number)
);

-- Añadir foreign keys cruzadas después de crear ambas tablas
ALTER TABLE public.cranes ADD CONSTRAINT fk_assigned_operator 
    FOREIGN KEY (assigned_operator_id) REFERENCES public.operators(id) ON DELETE SET NULL;
ALTER TABLE public.operators ADD CONSTRAINT fk_assigned_crane 
    FOREIGN KEY (assigned_crane_id) REFERENCES public.cranes(id) ON DELETE SET NULL;

-- Tabla de documentos de grúas
CREATE TABLE public.crane_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crane_id UUID NOT NULL REFERENCES public.cranes(id) ON DELETE CASCADE,
    type document_type NOT NULL,
    name TEXT NOT NULL,
    file_url TEXT,
    issue_date DATE,
    expiry_date DATE,
    reminder_days INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de mantenimientos de grúas
CREATE TABLE public.crane_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crane_id UUID NOT NULL REFERENCES public.cranes(id) ON DELETE CASCADE,
    type maintenance_type NOT NULL DEFAULT 'preventive',
    description TEXT NOT NULL,
    scheduled_date DATE,
    completed_date DATE,
    km_at_maintenance INTEGER,
    next_maintenance_km INTEGER,
    cost NUMERIC(10,2),
    provider_name TEXT,
    invoice_number TEXT,
    notes TEXT,
    status maintenance_status NOT NULL DEFAULT 'scheduled',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de documentos de operadores
CREATE TABLE public.operator_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE CASCADE,
    type document_type NOT NULL,
    name TEXT NOT NULL,
    file_url TEXT,
    issue_date DATE,
    expiry_date DATE,
    reminder_days INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.cranes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crane_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crane_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operator_documents ENABLE ROW LEVEL SECURITY;

-- Políticas para grúas
CREATE POLICY "Users can view tenant cranes" ON public.cranes
    FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Super admins can view all cranes" ON public.cranes
    FOR SELECT USING (is_super_admin(auth.uid()));

CREATE POLICY "Admins can create cranes" ON public.cranes
    FOR INSERT WITH CHECK (
        tenant_id = get_user_tenant_id(auth.uid()) AND 
        (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dispatcher'))
    );

CREATE POLICY "Admins can update cranes" ON public.cranes
    FOR UPDATE USING (
        tenant_id = get_user_tenant_id(auth.uid()) AND 
        (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dispatcher'))
    );

CREATE POLICY "Admins can delete cranes" ON public.cranes
    FOR DELETE USING (
        tenant_id = get_user_tenant_id(auth.uid()) AND 
        has_role(auth.uid(), 'admin')
    );

-- Políticas para operadores
CREATE POLICY "Users can view tenant operators" ON public.operators
    FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Super admins can view all operators" ON public.operators
    FOR SELECT USING (is_super_admin(auth.uid()));

CREATE POLICY "Admins can create operators" ON public.operators
    FOR INSERT WITH CHECK (
        tenant_id = get_user_tenant_id(auth.uid()) AND 
        (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dispatcher'))
    );

CREATE POLICY "Admins can update operators" ON public.operators
    FOR UPDATE USING (
        tenant_id = get_user_tenant_id(auth.uid()) AND 
        (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dispatcher'))
    );

CREATE POLICY "Admins can delete operators" ON public.operators
    FOR DELETE USING (
        tenant_id = get_user_tenant_id(auth.uid()) AND 
        has_role(auth.uid(), 'admin')
    );

-- Políticas para documentos de grúas (heredan de la grúa padre)
CREATE POLICY "Users can view crane documents" ON public.crane_documents
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM cranes WHERE id = crane_id AND tenant_id = get_user_tenant_id(auth.uid()))
    );

CREATE POLICY "Admins can manage crane documents" ON public.crane_documents
    FOR ALL USING (
        EXISTS (SELECT 1 FROM cranes WHERE id = crane_id AND tenant_id = get_user_tenant_id(auth.uid()))
        AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dispatcher'))
    );

-- Políticas para mantenimientos (heredan de la grúa padre)
CREATE POLICY "Users can view crane maintenance" ON public.crane_maintenance
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM cranes WHERE id = crane_id AND tenant_id = get_user_tenant_id(auth.uid()))
    );

CREATE POLICY "Admins can manage crane maintenance" ON public.crane_maintenance
    FOR ALL USING (
        EXISTS (SELECT 1 FROM cranes WHERE id = crane_id AND tenant_id = get_user_tenant_id(auth.uid()))
        AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dispatcher'))
    );

-- Políticas para documentos de operadores (heredan del operador padre)
CREATE POLICY "Users can view operator documents" ON public.operator_documents
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM operators WHERE id = operator_id AND tenant_id = get_user_tenant_id(auth.uid()))
    );

CREATE POLICY "Admins can manage operator documents" ON public.operator_documents
    FOR ALL USING (
        EXISTS (SELECT 1 FROM operators WHERE id = operator_id AND tenant_id = get_user_tenant_id(auth.uid()))
        AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dispatcher'))
    );

-- Triggers para updated_at
CREATE TRIGGER update_cranes_updated_at
    BEFORE UPDATE ON public.cranes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_operators_updated_at
    BEFORE UPDATE ON public.operators
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Función para generar número de unidad de grúa
CREATE OR REPLACE FUNCTION public.generate_crane_unit_number(_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_num INTEGER;
    new_code TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(unit_number FROM 5) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.cranes
    WHERE tenant_id = _tenant_id
    AND unit_number ~ '^GRU-[0-9]+$';
    
    new_code := 'GRU-' || LPAD(next_num::TEXT, 3, '0');
    RETURN new_code;
END;
$$;

-- Función para generar número de empleado
CREATE OR REPLACE FUNCTION public.generate_employee_number(_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_num INTEGER;
    new_code TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(employee_number FROM 5) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.operators
    WHERE tenant_id = _tenant_id
    AND employee_number ~ '^EMP-[0-9]+$';
    
    new_code := 'EMP-' || LPAD(next_num::TEXT, 3, '0');
    RETURN new_code;
END;
$$;
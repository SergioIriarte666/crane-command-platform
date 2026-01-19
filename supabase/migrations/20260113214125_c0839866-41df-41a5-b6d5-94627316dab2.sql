-- ===========================================
-- FASE 2: MÓDULO DE CLIENTES
-- ===========================================

-- 1. ENUM DE TIPO DE CLIENTE
CREATE TYPE public.client_type AS ENUM ('particular', 'empresa', 'aseguradora', 'gobierno');

-- 2. ENUM DE CATEGORÍA DE CLIENTE
CREATE TYPE public.client_category AS ENUM ('A', 'B', 'C');

-- 3. TABLA DE CLIENTES
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- Información básica
    code TEXT,
    type client_type NOT NULL DEFAULT 'particular',
    category client_category DEFAULT 'C',
    name TEXT NOT NULL,
    trade_name TEXT,
    
    -- Datos fiscales
    tax_id TEXT, -- RFC
    tax_regime TEXT,
    
    -- Dirección
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'México',
    
    -- Contacto principal
    phone TEXT,
    phone_alt TEXT,
    email TEXT,
    website TEXT,
    
    -- Contactos adicionales (JSON array)
    contacts JSONB DEFAULT '[]'::jsonb,
    
    -- Condiciones comerciales
    payment_terms INTEGER DEFAULT 0, -- días de crédito
    credit_limit DECIMAL(12,2) DEFAULT 0,
    requires_po BOOLEAN DEFAULT false, -- requiere orden de compra
    requires_approval BOOLEAN DEFAULT false, -- requiere cierre de facturación
    default_discount DECIMAL(5,2) DEFAULT 0,
    
    -- Notas
    notes TEXT,
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    
    -- Auditoría
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. HABILITAR RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS RLS
-- Usuarios pueden ver clientes de su tenant
CREATE POLICY "Users can view tenant clients"
ON public.clients FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Admins y dispatchers pueden crear clientes
CREATE POLICY "Admins can create clients"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dispatcher'))
);

-- Admins y dispatchers pueden actualizar clientes
CREATE POLICY "Admins can update clients"
ON public.clients FOR UPDATE
TO authenticated
USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dispatcher'))
);

-- Solo admins pueden eliminar clientes
CREATE POLICY "Admins can delete clients"
ON public.clients FOR DELETE
TO authenticated
USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
);

-- Super admins pueden ver todos los clientes
CREATE POLICY "Super admins can view all clients"
ON public.clients FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- 6. TRIGGER PARA updated_at
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. ÍNDICES
CREATE INDEX idx_clients_tenant_id ON public.clients(tenant_id);
CREATE INDEX idx_clients_type ON public.clients(type);
CREATE INDEX idx_clients_category ON public.clients(category);
CREATE INDEX idx_clients_name ON public.clients(name);
CREATE INDEX idx_clients_tax_id ON public.clients(tax_id);
CREATE INDEX idx_clients_is_active ON public.clients(is_active);

-- 8. FUNCIÓN PARA GENERAR CÓDIGO DE CLIENTE
CREATE OR REPLACE FUNCTION public.generate_client_code(_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    next_num INTEGER;
    new_code TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 5) AS INTEGER)), 0) + 1
    INTO next_num
    FROM public.clients
    WHERE tenant_id = _tenant_id
    AND code ~ '^CLI-[0-9]+$';
    
    new_code := 'CLI-' || LPAD(next_num::TEXT, 4, '0');
    RETURN new_code;
END;
$$;
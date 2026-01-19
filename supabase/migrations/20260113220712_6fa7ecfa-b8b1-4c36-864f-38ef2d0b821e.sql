-- Enums para proveedores e inventario
CREATE TYPE public.supplier_category AS ENUM ('maintenance', 'tires', 'fuel', 'parts', 'services', 'other');
CREATE TYPE public.inventory_category AS ENUM ('parts', 'tires', 'oil', 'tools', 'equipment', 'consumables', 'other');
CREATE TYPE public.inventory_unit AS ENUM ('piece', 'liter', 'kg', 'set', 'service', 'hour');
CREATE TYPE public.movement_type AS ENUM ('in', 'out', 'adjustment', 'transfer');
CREATE TYPE public.payment_method AS ENUM ('cash', 'transfer', 'check', 'card');

-- Tabla de Proveedores
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    trade_name TEXT,
    category supplier_category NOT NULL DEFAULT 'other',
    tax_id TEXT,
    tax_regime TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'Chile',
    phone TEXT,
    email TEXT,
    website TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    payment_terms INTEGER DEFAULT 30,
    credit_limit NUMERIC(12,2) DEFAULT 0,
    bank_name TEXT,
    bank_account TEXT,
    clabe TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, code)
);

-- Tabla de Items de Inventario
CREATE TABLE public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    barcode TEXT,
    name TEXT NOT NULL,
    description TEXT,
    category inventory_category NOT NULL DEFAULT 'other',
    unit inventory_unit NOT NULL DEFAULT 'piece',
    current_stock NUMERIC(10,2) DEFAULT 0,
    min_stock NUMERIC(10,2) DEFAULT 0,
    max_stock NUMERIC(10,2),
    reorder_point NUMERIC(10,2) DEFAULT 0,
    location TEXT,
    unit_cost NUMERIC(12,2) DEFAULT 0,
    last_purchase_cost NUMERIC(12,2),
    is_tool BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, code)
);

-- Tabla de Movimientos de Inventario
CREATE TABLE public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    type movement_type NOT NULL,
    quantity NUMERIC(10,2) NOT NULL,
    unit_cost NUMERIC(12,2),
    reference_type TEXT,
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de Productos de Proveedores
CREATE TABLE public.supplier_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    product_code TEXT,
    name TEXT NOT NULL,
    description TEXT,
    unit inventory_unit DEFAULT 'piece',
    unit_price NUMERIC(12,2) DEFAULT 0,
    lead_time_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

-- Políticas para proveedores
CREATE POLICY "Users can view tenant suppliers" ON public.suppliers
    FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Super admins can view all suppliers" ON public.suppliers
    FOR SELECT USING (is_super_admin(auth.uid()));

CREATE POLICY "Admins can create suppliers" ON public.suppliers
    FOR INSERT WITH CHECK (
        tenant_id = get_user_tenant_id(auth.uid()) AND 
        (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dispatcher'))
    );

CREATE POLICY "Admins can update suppliers" ON public.suppliers
    FOR UPDATE USING (
        tenant_id = get_user_tenant_id(auth.uid()) AND 
        (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dispatcher'))
    );

CREATE POLICY "Admins can delete suppliers" ON public.suppliers
    FOR DELETE USING (
        tenant_id = get_user_tenant_id(auth.uid()) AND 
        has_role(auth.uid(), 'admin')
    );

-- Políticas para inventario
CREATE POLICY "Users can view tenant inventory" ON public.inventory_items
    FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Super admins can view all inventory" ON public.inventory_items
    FOR SELECT USING (is_super_admin(auth.uid()));

CREATE POLICY "Admins can create inventory items" ON public.inventory_items
    FOR INSERT WITH CHECK (
        tenant_id = get_user_tenant_id(auth.uid()) AND 
        (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dispatcher'))
    );

CREATE POLICY "Admins can update inventory items" ON public.inventory_items
    FOR UPDATE USING (
        tenant_id = get_user_tenant_id(auth.uid()) AND 
        (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dispatcher'))
    );

CREATE POLICY "Admins can delete inventory items" ON public.inventory_items
    FOR DELETE USING (
        tenant_id = get_user_tenant_id(auth.uid()) AND 
        has_role(auth.uid(), 'admin')
    );

-- Políticas para movimientos
CREATE POLICY "Users can view tenant movements" ON public.inventory_movements
    FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can create movements" ON public.inventory_movements
    FOR INSERT WITH CHECK (
        tenant_id = get_user_tenant_id(auth.uid()) AND 
        (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dispatcher'))
    );

-- Políticas para productos de proveedores
CREATE POLICY "Users can view supplier products" ON public.supplier_products
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM suppliers WHERE id = supplier_id AND tenant_id = get_user_tenant_id(auth.uid()))
    );

CREATE POLICY "Admins can manage supplier products" ON public.supplier_products
    FOR ALL USING (
        EXISTS (SELECT 1 FROM suppliers WHERE id = supplier_id AND tenant_id = get_user_tenant_id(auth.uid()))
        AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dispatcher'))
    );

-- Triggers para updated_at
CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON public.inventory_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supplier_products_updated_at
    BEFORE UPDATE ON public.supplier_products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Función para generar código de proveedor
CREATE OR REPLACE FUNCTION public.generate_supplier_code(_tenant_id uuid)
RETURNS text
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
    FROM public.suppliers
    WHERE tenant_id = _tenant_id
    AND code ~ '^PRV-[0-9]+$';
    
    new_code := 'PRV-' || LPAD(next_num::TEXT, 4, '0');
    RETURN new_code;
END;
$$;

-- Función para generar código de item de inventario
CREATE OR REPLACE FUNCTION public.generate_inventory_code(_tenant_id uuid)
RETURNS text
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
    FROM public.inventory_items
    WHERE tenant_id = _tenant_id
    AND code ~ '^INV-[0-9]+$';
    
    new_code := 'INV-' || LPAD(next_num::TEXT, 4, '0');
    RETURN new_code;
END;
$$;

-- Función para actualizar stock automáticamente con movimientos
CREATE OR REPLACE FUNCTION public.update_inventory_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.type IN ('in', 'adjustment') THEN
        UPDATE public.inventory_items 
        SET current_stock = current_stock + ABS(NEW.quantity),
            last_purchase_cost = COALESCE(NEW.unit_cost, last_purchase_cost)
        WHERE id = NEW.item_id;
    ELSIF NEW.type = 'out' THEN
        UPDATE public.inventory_items 
        SET current_stock = current_stock - ABS(NEW.quantity)
        WHERE id = NEW.item_id;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_inventory_stock
    AFTER INSERT ON public.inventory_movements
    FOR EACH ROW EXECUTE FUNCTION public.update_inventory_stock();
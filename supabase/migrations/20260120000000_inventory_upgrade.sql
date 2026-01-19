-- 1. Create Locations Table
CREATE TABLE IF NOT EXISTS public.inventory_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'warehouse', -- warehouse, vehicle, shelf
    parent_id UUID REFERENCES public.inventory_locations(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.inventory_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant's locations" ON public.inventory_locations
    FOR SELECT USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can manage their tenant's locations" ON public.inventory_locations
    FOR ALL USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);


-- 2. Create Batches Table
CREATE TABLE IF NOT EXISTS public.inventory_batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    batch_number TEXT NOT NULL,
    expiration_date DATE,
    cost NUMERIC(15, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant's batches" ON public.inventory_batches
    FOR SELECT USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can manage their tenant's batches" ON public.inventory_batches
    FOR ALL USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);


-- 3. Create Inventory Stock (Quantities per Location/Batch)
CREATE TABLE IF NOT EXISTS public.inventory_stock (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.inventory_locations(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.inventory_batches(id) ON DELETE CASCADE,
    quantity NUMERIC(15, 2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure uniqueness for item+location+batch combination
    CONSTRAINT unique_stock_item_loc_batch UNIQUE NULLS NOT DISTINCT (item_id, location_id, batch_id)
);

-- Enable RLS
ALTER TABLE public.inventory_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant's stock" ON public.inventory_stock
    FOR SELECT USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can manage their tenant's stock" ON public.inventory_stock
    FOR ALL USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);


-- 4. Create Audit Sessions Table
CREATE TABLE IF NOT EXISTS public.inventory_audit_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'open', -- open, completed, cancelled
    location_id UUID REFERENCES public.inventory_locations(id),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.inventory_audit_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant's audit sessions" ON public.inventory_audit_sessions
    FOR SELECT USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can manage their tenant's audit sessions" ON public.inventory_audit_sessions
    FOR ALL USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);


-- 5. Create Audit Items Table
CREATE TABLE IF NOT EXISTS public.inventory_audit_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.inventory_audit_sessions(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.inventory_batches(id),
    expected_quantity NUMERIC(15, 2),
    counted_quantity NUMERIC(15, 2),
    difference NUMERIC(15, 2),
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.inventory_audit_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant's audit items" ON public.inventory_audit_items
    FOR SELECT USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid)
    -- Note: tenant_id is not directly on this table, but we can join via session_id or rely on session RLS if we had policies checking relations, but simple check is harder.
    -- For simplicity in Supabase, often we duplicate tenant_id or use exists.
    -- Let's add tenant_id to audit_items for easier RLS
;
ALTER TABLE public.inventory_audit_items ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

CREATE POLICY "Users can view their tenant's audit items" ON public.inventory_audit_items
    FOR SELECT USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can manage their tenant's audit items" ON public.inventory_audit_items
    FOR ALL USING (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);


-- 6. Update Inventory Movements
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.inventory_locations(id);
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.inventory_batches(id);
ALTER TABLE public.inventory_movements ADD COLUMN IF NOT EXISTS cost_batch NUMERIC(15, 2); -- Cost specific to this movement's batch logic if needed

-- 7. Data Migration Logic (DO block)
DO $$
DECLARE
    t_record RECORD;
    loc_id UUID;
BEGIN
    -- For each tenant, ensure a default location exists
    FOR t_record IN SELECT id, name FROM tenants LOOP
        -- Check if default location exists
        SELECT id INTO loc_id FROM inventory_locations WHERE tenant_id = t_record.id AND name = 'Bodega Central' LIMIT 1;
        
        IF loc_id IS NULL THEN
            INSERT INTO inventory_locations (tenant_id, name, type)
            VALUES (t_record.id, 'Bodega Central', 'warehouse')
            RETURNING id INTO loc_id;
        END IF;

        -- Migrate existing items stock to this location
        -- We only do this for items that have stock > 0 and no entries in inventory_stock yet
        INSERT INTO inventory_stock (tenant_id, item_id, location_id, quantity)
        SELECT i.tenant_id, i.id, loc_id, i.current_stock
        FROM inventory_items i
        WHERE i.tenant_id = t_record.id 
          AND i.current_stock > 0
          AND NOT EXISTS (SELECT 1 FROM inventory_stock s WHERE s.item_id = i.id);
          
    END LOOP;
END $$;

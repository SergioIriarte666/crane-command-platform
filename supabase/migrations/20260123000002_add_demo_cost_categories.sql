
-- Add default cost categories for Demo Company
DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get the tenant ID for Grúas Metrópolis
    SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = 'gruas-metropolis';

    IF v_tenant_id IS NOT NULL THEN
        -- Insert Cost Categories if they don't exist
        
        -- FUEL
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'cost_category' AND code = 'FUEL') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
            VALUES (v_tenant_id, 'cost_category', 'FUEL', 'Combustible', 'Gastos de combustible', true, 10);
        END IF;

        -- TOLL
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'cost_category' AND code = 'TOLL') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
            VALUES (v_tenant_id, 'cost_category', 'TOLL', 'Peajes', 'Gastos de peaje y TAG', true, 20);
        END IF;

        -- MAINTENANCE
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'cost_category' AND code = 'MAINTENANCE') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
            VALUES (v_tenant_id, 'cost_category', 'MAINTENANCE', 'Mantenimiento', 'Mantenimiento y reparaciones', true, 30);
        END IF;

        -- SUPPLIES
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'cost_category' AND code = 'SUPPLIES') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
            VALUES (v_tenant_id, 'cost_category', 'SUPPLIES', 'Insumos', 'Materiales e insumos', true, 40);
        END IF;

        -- FOOD
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'cost_category' AND code = 'FOOD') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
            VALUES (v_tenant_id, 'cost_category', 'FOOD', 'Viáticos', 'Alimentación y viáticos', true, 50);
        END IF;

        -- OTHER
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'cost_category' AND code = 'OTHER') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
            VALUES (v_tenant_id, 'cost_category', 'OTHER', 'Otros', 'Otros gastos operacionales', true, 99);
        END IF;

    END IF;
END $$;

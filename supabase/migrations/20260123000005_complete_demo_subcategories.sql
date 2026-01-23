-- ==============================================================================
-- MIGRATION: Complete Demo Subcategories and Pipeline Stages
-- ==============================================================================

DO $$
DECLARE
    v_tenant_id UUID;
    v_cat_fuel UUID;
    v_cat_toll UUID;
    v_cat_maint UUID;
    v_cat_supplies UUID;
    v_cat_food UUID;
    v_cat_other UUID;
BEGIN
    -- Get the tenant ID for Grúas Metrópolis
    SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = 'gruas-metropolis';

    IF v_tenant_id IS NOT NULL THEN
        
        -- 1. Ensure Cost Categories Exist (Idempotent)
        -- FUEL
        SELECT id INTO v_cat_fuel FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'cost_category' AND code = 'FUEL';
        IF v_cat_fuel IS NULL THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
            VALUES (v_tenant_id, 'cost_category', 'FUEL', 'Combustible', 'Gastos de combustible', true, 10)
            RETURNING id INTO v_cat_fuel;
        END IF;

        -- TOLL
        SELECT id INTO v_cat_toll FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'cost_category' AND code = 'TOLL';
        IF v_cat_toll IS NULL THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
            VALUES (v_tenant_id, 'cost_category', 'TOLL', 'Peajes', 'Gastos de peaje y TAG', true, 20)
            RETURNING id INTO v_cat_toll;
        END IF;

        -- MAINTENANCE
        SELECT id INTO v_cat_maint FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'cost_category' AND code = 'MAINTENANCE';
        IF v_cat_maint IS NULL THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
            VALUES (v_tenant_id, 'cost_category', 'MAINTENANCE', 'Mantenimiento', 'Mantenimiento y reparaciones', true, 30)
            RETURNING id INTO v_cat_maint;
        END IF;

        -- SUPPLIES
        SELECT id INTO v_cat_supplies FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'cost_category' AND code = 'SUPPLIES';
        IF v_cat_supplies IS NULL THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
            VALUES (v_tenant_id, 'cost_category', 'SUPPLIES', 'Insumos', 'Materiales e insumos', true, 40)
            RETURNING id INTO v_cat_supplies;
        END IF;

        -- FOOD
        SELECT id INTO v_cat_food FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'cost_category' AND code = 'FOOD';
        IF v_cat_food IS NULL THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
            VALUES (v_tenant_id, 'cost_category', 'FOOD', 'Viáticos', 'Alimentación y viáticos', true, 50)
            RETURNING id INTO v_cat_food;
        END IF;

        -- OTHER
        SELECT id INTO v_cat_other FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'cost_category' AND code = 'OTHER';
        IF v_cat_other IS NULL THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
            VALUES (v_tenant_id, 'cost_category', 'OTHER', 'Otros', 'Otros gastos operacionales', true, 99)
            RETURNING id INTO v_cat_other;
        END IF;


        -- 2. Insert Cost Subcategories (linked to categories)
        
        -- For FUEL
        IF v_cat_fuel IS NOT NULL THEN
            IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'cost_subcategory' AND parent_id = v_cat_fuel) THEN
                INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, parent_id, sort_order) VALUES
                (v_tenant_id, 'cost_subcategory', 'FUEL_93', 'Gasolina 93', v_cat_fuel, 10),
                (v_tenant_id, 'cost_subcategory', 'FUEL_95', 'Gasolina 95', v_cat_fuel, 20),
                (v_tenant_id, 'cost_subcategory', 'FUEL_97', 'Gasolina 97', v_cat_fuel, 25),
                (v_tenant_id, 'cost_subcategory', 'FUEL_DIESEL', 'Petróleo Diesel', v_cat_fuel, 30),
                (v_tenant_id, 'cost_subcategory', 'FUEL_LPG', 'Gas Licuado (GLP)', v_cat_fuel, 40);
            END IF;
        END IF;

        -- For TOLL
        IF v_cat_toll IS NOT NULL THEN
            IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'cost_subcategory' AND parent_id = v_cat_toll) THEN
                INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, parent_id, sort_order) VALUES
                (v_tenant_id, 'cost_subcategory', 'TOLL_TAG', 'TAG / Telepeaje', v_cat_toll, 10),
                (v_tenant_id, 'cost_subcategory', 'TOLL_CASH', 'Efectivo', v_cat_toll, 20);
            END IF;
        END IF;

        -- For MAINTENANCE
        IF v_cat_maint IS NOT NULL THEN
            IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'cost_subcategory' AND parent_id = v_cat_maint) THEN
                INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, parent_id, sort_order) VALUES
                (v_tenant_id, 'cost_subcategory', 'MAINT_PREV', 'Preventivo', v_cat_maint, 10),
                (v_tenant_id, 'cost_subcategory', 'MAINT_CORR', 'Correctivo', v_cat_maint, 20),
                (v_tenant_id, 'cost_subcategory', 'MAINT_TIRES', 'Llantas', v_cat_maint, 30),
                (v_tenant_id, 'cost_subcategory', 'MAINT_WASH', 'Lavado y Engrasado', v_cat_maint, 40);
            END IF;
        END IF;

        -- For SUPPLIES
        IF v_cat_supplies IS NOT NULL THEN
            IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'cost_subcategory' AND parent_id = v_cat_supplies) THEN
                INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, parent_id, sort_order) VALUES
                (v_tenant_id, 'cost_subcategory', 'SUPP_CLEAN', 'Limpieza', v_cat_supplies, 10),
                (v_tenant_id, 'cost_subcategory', 'SUPP_OFFICE', 'Papelería', v_cat_supplies, 20),
                (v_tenant_id, 'cost_subcategory', 'SUPP_PPE', 'Equipo de Protección (EPP)', v_cat_supplies, 30);
            END IF;
        END IF;

        -- For FOOD
        IF v_cat_food IS NOT NULL THEN
            IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'cost_subcategory' AND parent_id = v_cat_food) THEN
                INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, parent_id, sort_order) VALUES
                (v_tenant_id, 'cost_subcategory', 'FOOD_MEAL', 'Comidas', v_cat_food, 10),
                (v_tenant_id, 'cost_subcategory', 'FOOD_HOTEL', 'Hospedaje', v_cat_food, 20),
                (v_tenant_id, 'cost_subcategory', 'FOOD_TRANS', 'Transporte', v_cat_food, 30);
            END IF;
        END IF;

        -- For OTHER
        IF v_cat_other IS NOT NULL THEN
            IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'cost_subcategory' AND parent_id = v_cat_other) THEN
                INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, parent_id, sort_order) VALUES
                (v_tenant_id, 'cost_subcategory', 'OTHER_MISC', 'Varios', v_cat_other, 10);
            END IF;
        END IF;


        -- 3. Populate Service Pipeline Stages (if missing)
        -- Note: These are usually created by a trigger or initial migration for existing tenants, 
        -- but for the demo tenant created via seed, they might be missing if the seed didn't include them.
        
        INSERT INTO public.service_pipeline_stages (tenant_id, status, name, color, sort_order)
        VALUES 
            (v_tenant_id, 'draft', 'Borrador', '#6b7280', 0),
            (v_tenant_id, 'quoted', 'Cotizado', '#60a5fa', 10),
            (v_tenant_id, 'purchase_order_pending', 'Esperando O.C.', '#f59e0b', 12),
            (v_tenant_id, 'with_purchase_order', 'Con Orden de Compra', '#10b981', 15),
            (v_tenant_id, 'confirmed', 'Confirmado', '#3b82f6', 20),
            (v_tenant_id, 'pending', 'Programado', '#8b5cf6', 25),
            (v_tenant_id, 'assigned', 'Asignado', '#8b5cf6', 30),
            (v_tenant_id, 'en_route', 'En Camino', '#eab308', 40),
            (v_tenant_id, 'on_site', 'En Sitio', '#f97316', 50),
            (v_tenant_id, 'in_progress', 'En Proceso', '#06b6d4', 60),
            (v_tenant_id, 'completed', 'Completado', '#22c55e', 70),
            (v_tenant_id, 'failed', 'Fallido', '#ef4444', 75),
            (v_tenant_id, 'invoiced', 'Facturado', '#15803d', 80),
            (v_tenant_id, 'cancelled', 'Cancelado', '#ef4444', 90)
        ON CONFLICT (tenant_id, status) DO UPDATE SET
            name = EXCLUDED.name,
            color = EXCLUDED.color,
            sort_order = EXCLUDED.sort_order;

    END IF;
END $$;

-- Fix for Brand Catalog Visibility and Auto-Assignment Data

-- 1. Ensure RLS policies are permissive enough for authenticated users to view all catalogs in their tenant
-- (This re-applies or ensures the policy exists and is correct)
DROP POLICY IF EXISTS "Users can view catalog items from their tenant" ON public.catalog_items;

CREATE POLICY "Users can view catalog items from their tenant"
ON public.catalog_items FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- 2. Backfill metadata for existing Vehicle Models to enable Auto-Assignment
-- This anonymous block attempts to intelligently assign default_vehicle_type based on model names
DO $$
DECLARE
  t_record RECORD;
  v_sedan_id uuid;
  v_suv_id uuid;
  v_truck_id uuid;
  v_pickup_id uuid;
  v_motorcycle_id uuid;
  v_van_id uuid;
BEGIN
  -- Iterate over all tenants to apply fixes
  FOR t_record IN SELECT id FROM tenants LOOP
    
    -- 2.1. Resolve Vehicle Type IDs for this tenant (using common codes)
    SELECT id INTO v_sedan_id FROM catalog_items 
    WHERE tenant_id = t_record.id AND catalog_type = 'vehicle_type' AND code IN ('SEDAN', 'AUTO', 'AUTOMOVIL', 'compacto') LIMIT 1;
    
    SELECT id INTO v_suv_id FROM catalog_items 
    WHERE tenant_id = t_record.id AND catalog_type = 'vehicle_type' AND code IN ('SUV', 'JEEP', 'TODOTERRENO') LIMIT 1;
    
    SELECT id INTO v_truck_id FROM catalog_items 
    WHERE tenant_id = t_record.id AND catalog_type = 'vehicle_type' AND code IN ('TRUCK', 'CAMION', 'PESADO', 'GRUA') LIMIT 1;
    
    SELECT id INTO v_pickup_id FROM catalog_items 
    WHERE tenant_id = t_record.id AND catalog_type = 'vehicle_type' AND code IN ('PICKUP', 'CAMIONETA') LIMIT 1;
    
    SELECT id INTO v_motorcycle_id FROM catalog_items 
    WHERE tenant_id = t_record.id AND catalog_type = 'vehicle_type' AND code IN ('MOTO', 'MOTOCICLETA') LIMIT 1;

    SELECT id INTO v_van_id FROM catalog_items 
    WHERE tenant_id = t_record.id AND catalog_type = 'vehicle_type' AND code IN ('VAN', 'FURGON') LIMIT 1;

    -- 2.2. Update Models based on Keywords (Heuristics)
    -- Only update if default_vehicle_type is missing
    
    -- SEDAN / COMPACTO
    IF v_sedan_id IS NOT NULL THEN
      UPDATE catalog_items SET metadata = jsonb_build_object('default_vehicle_type', v_sedan_id)
      WHERE tenant_id = t_record.id AND catalog_type = 'vehicle_model' 
      AND (metadata->>'default_vehicle_type' IS NULL OR metadata->>'default_vehicle_type' = '')
      AND (
        name ILIKE '%COROLLA%' OR name ILIKE '%YARIS%' OR name ILIKE '%RIO%' OR 
        name ILIKE '%VERSA%' OR name ILIKE '%SENTRA%' OR name ILIKE '%ACCENT%' OR
        name ILIKE '%GOL%' OR name ILIKE '%VIRTUS%' OR name ILIKE '%ONIX%' OR
        name ILIKE '%PRISMA%' OR name ILIKE '%SAIL%' OR name ILIKE '%SPARK%' OR
        name ILIKE '%MARCH%' OR name ILIKE '%TIIDA%' OR name ILIKE '%CIVIC%' OR
        name ILIKE '%MAZDA 2%' OR name ILIKE '%MAZDA 3%' OR name ILIKE '%ELANTRA%'
      );
    END IF;

    -- SUV
    IF v_suv_id IS NOT NULL THEN
      UPDATE catalog_items SET metadata = jsonb_build_object('default_vehicle_type', v_suv_id)
      WHERE tenant_id = t_record.id AND catalog_type = 'vehicle_model' 
      AND (metadata->>'default_vehicle_type' IS NULL OR metadata->>'default_vehicle_type' = '')
      AND (
        name ILIKE '%RAV4%' OR name ILIKE '%SPORTAGE%' OR name ILIKE '%TUCSON%' OR 
        name ILIKE '%CRETA%' OR name ILIKE '%KICKS%' OR name ILIKE '%QASHQAI%' OR
        name ILIKE '%X-TRAIL%' OR name ILIKE '%CX-3%' OR name ILIKE '%CX-5%' OR
        name ILIKE '%CR-V%' OR name ILIKE '%HR-V%' OR name ILIKE '%TRACKER%' OR
        name ILIKE '%TAHOE%' OR name ILIKE '%SUBURBAN%' OR name ILIKE '%EXPLORER%' OR
        name ILIKE '%FORTUNER%' OR name ILIKE '%PRADO%' OR name ILIKE '%LAND CRUISER%'
      );
    END IF;

    -- PICKUP
    IF v_pickup_id IS NOT NULL THEN
      UPDATE catalog_items SET metadata = jsonb_build_object('default_vehicle_type', v_pickup_id)
      WHERE tenant_id = t_record.id AND catalog_type = 'vehicle_model' 
      AND (metadata->>'default_vehicle_type' IS NULL OR metadata->>'default_vehicle_type' = '')
      AND (
        name ILIKE '%HILUX%' OR name ILIKE '%L200%' OR name ILIKE '%NP300%' OR 
        name ILIKE '%FRONTIER%' OR name ILIKE '%NAVARA%' OR name ILIKE '%AMAROK%' OR
        name ILIKE '%RANGER%' OR name ILIKE '%F-150%' OR name ILIKE '%SILVERADO%' OR
        name ILIKE '%RAM%' OR name ILIKE '%BT-50%' OR name ILIKE '%D-MAX%' OR
        name ILIKE '%POER%' OR name ILIKE '%T6%' OR name ILIKE '%ACTYON%'
      );
    END IF;

    -- TRUCK / CAMION
    IF v_truck_id IS NOT NULL THEN
      UPDATE catalog_items SET metadata = jsonb_build_object('default_vehicle_type', v_truck_id)
      WHERE tenant_id = t_record.id AND catalog_type = 'vehicle_model' 
      AND (metadata->>'default_vehicle_type' IS NULL OR metadata->>'default_vehicle_type' = '')
      AND (
        name ILIKE '%CAMION%' OR name ILIKE '%NKR%' OR name ILIKE '%NPR%' OR 
        name ILIKE '%FVR%' OR name ILIKE '%HINO%' OR name ILIKE '%MACK%' OR
        name ILIKE '%VOLVO%' OR name ILIKE '%SCANIA%' OR name ILIKE '%FREIGHTLINER%' OR
        name ILIKE '%INTERNATIONAL%' OR name ILIKE '%KENWORTH%' OR name ILIKE '%ACTROS%'
      );
    END IF;

    -- VAN
    IF v_van_id IS NOT NULL THEN
      UPDATE catalog_items SET metadata = jsonb_build_object('default_vehicle_type', v_van_id)
      WHERE tenant_id = t_record.id AND catalog_type = 'vehicle_model' 
      AND (metadata->>'default_vehicle_type' IS NULL OR metadata->>'default_vehicle_type' = '')
      AND (
        name ILIKE '%HIACE%' OR name ILIKE '%URVAN%' OR name ILIKE '%H1%' OR 
        name ILIKE '%SPRINTER%' OR name ILIKE '%TRANSIT%' OR name ILIKE '%DUCATO%' OR
        name ILIKE '%PARTNER%' OR name ILIKE '%BERLINGO%' OR name ILIKE '%N300%' OR
        name ILIKE '%N400%'
      );
    END IF;
    
    -- MOTORCYCLE
    IF v_motorcycle_id IS NOT NULL THEN
      UPDATE catalog_items SET metadata = jsonb_build_object('default_vehicle_type', v_motorcycle_id)
      WHERE tenant_id = t_record.id AND catalog_type = 'vehicle_model' 
      AND (metadata->>'default_vehicle_type' IS NULL OR metadata->>'default_vehicle_type' = '')
      AND (
        name ILIKE '%MOTO%' OR name ILIKE '%YAMAHA%' OR name ILIKE '%HONDA%' OR 
        name ILIKE '%SUZUKI%' OR name ILIKE '%KAWASAKI%' OR name ILIKE '%BMW%' OR
        name ILIKE '%PULSAR%' OR name ILIKE '%GIXER%' OR name ILIKE '%FZ%'
      );
    END IF;

  END LOOP;
END $$;

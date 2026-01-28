-- Migration to remove deprecated entities and clean up database
-- Entities to remove:
-- 1. Régimen tributario (tax_regime)
-- 2. Región (region)
-- 3. Tipos de combustible (fuel_type)
-- 4. Tipo de sangre (blood_type)
-- 5. Tipo comisión (commission_type)
-- 6. Bancos (bank)
-- 7. Condición del vehículo (vehicle_condition)

BEGIN;

-- 1. Remove catalog items for all target types
DELETE FROM public.catalog_items 
WHERE catalog_type IN (
  'tax_regime', 
  'region', 
  'fuel_type', 
  'blood_type', 
  'commission_type', 
  'bank', 
  'vehicle_condition'
);

-- 2. Operators: Drop blood_type column
ALTER TABLE public.operators DROP COLUMN IF EXISTS blood_type;

-- 3. Clients: Drop tax_regime column
ALTER TABLE public.clients DROP COLUMN IF EXISTS tax_regime;

-- 4. Vehicle Condition: Convert to text and drop enum (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'vehicle_condition') THEN
    ALTER TABLE public.services ALTER COLUMN vehicle_condition TYPE TEXT;
  END IF;
END $$;
DROP TYPE IF EXISTS public.vehicle_condition;

-- 5. Commission Type: Convert to text and drop enum (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operators' AND column_name = 'commission_type') THEN
    ALTER TABLE public.operators ALTER COLUMN commission_type TYPE TEXT;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commissions' AND column_name = 'commission_type') THEN
    ALTER TABLE public.commissions ALTER COLUMN commission_type TYPE TEXT;
  END IF;
END $$;
DROP TYPE IF EXISTS public.commission_type;

COMMIT;

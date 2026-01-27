-- Convert vehicle_condition and vehicle_type enums to text to support dynamic catalog values
-- This resolves the "invalid input value for enum vehicle_condition" error when using custom catalog values like "MECHANICAL" or "COLLISION"

-- 1. Convert vehicle_condition to TEXT
ALTER TABLE public.services 
  ALTER COLUMN vehicle_condition DROP DEFAULT;

ALTER TABLE public.services 
  ALTER COLUMN vehicle_condition TYPE text USING vehicle_condition::text;

-- 2. Convert vehicle_type to TEXT
ALTER TABLE public.services 
  ALTER COLUMN vehicle_type DROP DEFAULT;

ALTER TABLE public.services 
  ALTER COLUMN vehicle_type TYPE text USING vehicle_type::text;

-- 3. Set sensible defaults (optional, but good practice to have them match the most common values)
ALTER TABLE public.services 
  ALTER COLUMN vehicle_condition SET DEFAULT 'runs';

ALTER TABLE public.services 
  ALTER COLUMN vehicle_type SET DEFAULT 'sedan';

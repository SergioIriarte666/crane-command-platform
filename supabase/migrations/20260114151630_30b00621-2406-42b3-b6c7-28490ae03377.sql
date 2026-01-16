-- Add folio configuration columns to tenants table
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS folio_format text DEFAULT 'SRV-{number}',
ADD COLUMN IF NOT EXISTS next_folio_number integer DEFAULT 1;

-- Add comment for documentation
COMMENT ON COLUMN public.tenants.folio_format IS 'Format pattern for service folios. Use {number} as placeholder.';
COMMENT ON COLUMN public.tenants.next_folio_number IS 'Next sequential number to use for auto-generated folios.';
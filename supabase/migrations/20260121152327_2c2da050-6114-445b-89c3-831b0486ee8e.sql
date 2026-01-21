-- Create read-only function to preview next folio WITHOUT incrementing
CREATE OR REPLACE FUNCTION public.peek_next_service_folio(_tenant_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    tenant_record RECORD;
    preview_folio TEXT;
    padded_number TEXT;
BEGIN
    -- Get tenant's folio configuration (NO UPDATE - read only)
    SELECT folio_format, next_folio_number
    INTO tenant_record
    FROM public.tenants
    WHERE id = _tenant_id;
    
    -- Use defaults if not configured
    IF tenant_record.folio_format IS NULL THEN
        tenant_record.folio_format := 'SRV-{number}';
    END IF;
    
    IF tenant_record.next_folio_number IS NULL THEN
        tenant_record.next_folio_number := 1;
    END IF;
    
    -- Pad the number to 5 digits
    padded_number := LPAD(tenant_record.next_folio_number::TEXT, 5, '0');
    
    -- Generate preview folio (NO INCREMENT happens here)
    preview_folio := REPLACE(tenant_record.folio_format, '{number}', padded_number);
    
    RETURN preview_folio;
END;
$$;
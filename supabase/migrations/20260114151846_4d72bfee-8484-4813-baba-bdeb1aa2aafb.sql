-- Update the generate_service_folio function to use tenant's folio_format configuration
CREATE OR REPLACE FUNCTION public.generate_service_folio(_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    tenant_record RECORD;
    new_folio TEXT;
    padded_number TEXT;
BEGIN
    -- Get tenant's folio configuration
    SELECT folio_format, next_folio_number
    INTO tenant_record
    FROM public.tenants
    WHERE id = _tenant_id;
    
    -- If no configuration, use defaults
    IF tenant_record.folio_format IS NULL THEN
        tenant_record.folio_format := 'SRV-{number}';
    END IF;
    
    IF tenant_record.next_folio_number IS NULL THEN
        tenant_record.next_folio_number := 1;
    END IF;
    
    -- Pad the number to 5 digits
    padded_number := LPAD(tenant_record.next_folio_number::TEXT, 5, '0');
    
    -- Replace {number} placeholder with the padded number
    new_folio := REPLACE(tenant_record.folio_format, '{number}', padded_number);
    
    -- Increment the next_folio_number for the tenant
    UPDATE public.tenants
    SET next_folio_number = tenant_record.next_folio_number + 1
    WHERE id = _tenant_id;
    
    RETURN new_folio;
END;
$$;
-- Function to propagate invoice status to closure and services
CREATE OR REPLACE FUNCTION public.propagate_invoice_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _closure_id UUID;
BEGIN
  -- 1. Handle Payment (Invoice becomes 'paid')
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
    
    -- Find closure
    IF NEW.billing_closure_id IS NOT NULL THEN
      _closure_id := NEW.billing_closure_id;
    ELSE
      SELECT id INTO _closure_id FROM billing_closures WHERE invoice_id = NEW.id LIMIT 1;
    END IF;

    IF _closure_id IS NOT NULL THEN
      -- Update closure to 'invoiced'
      UPDATE billing_closures 
      SET 
        status = 'invoiced',
        updated_at = NOW()
      WHERE id = _closure_id 
      AND status != 'invoiced';

      -- Update services to 'invoiced'
      UPDATE services 
      SET 
        status = 'invoiced',
        updated_at = NOW()
      WHERE 
        billing_closure_id = _closure_id 
        AND status = 'completed';
    END IF;

    -- Update directly linked services
    UPDATE services
    SET
      status = 'invoiced',
      updated_at = NOW()
    WHERE
      invoice_id = NEW.id
      AND status = 'completed';

  -- 2. Handle Cancellation (Invoice becomes 'cancelled')
  ELSIF NEW.status = 'cancelled' AND (OLD.status IS DISTINCT FROM 'cancelled') THEN
    
    -- Find closure
    IF NEW.billing_closure_id IS NOT NULL THEN
      _closure_id := NEW.billing_closure_id;
    ELSE
      SELECT id INTO _closure_id FROM billing_closures WHERE invoice_id = NEW.id LIMIT 1;
    END IF;

    IF _closure_id IS NOT NULL THEN
      -- Revert closure to 'approved' so it can be invoiced again
      -- Or 'review'? 'approved' seems safer as it was already approved to be invoiced.
      UPDATE billing_closures 
      SET 
        status = 'approved',
        invoice_id = NULL, -- Remove link to cancelled invoice? Or keep it? 
                           -- If we keep it, it might prevent new invoice creation.
                           -- Let's keep invoice_id for history but status 'approved' might be confusing if invoice_id is set.
                           -- Actually, if invoice is cancelled, we might want to allow creating a NEW invoice.
                           -- So setting invoice_id to NULL might be necessary, OR the UI must handle re-invoicing.
                           -- For now, let's just update status to 'approved'.
        updated_at = NOW()
      WHERE id = _closure_id;

      -- Revert services to 'completed'
      UPDATE services 
      SET 
        status = 'completed',
        updated_at = NOW()
      WHERE 
        billing_closure_id = _closure_id 
        AND status = 'invoiced';
    END IF;

    -- Revert directly linked services
    UPDATE services
    SET
      status = 'completed',
      updated_at = NOW()
    WHERE
      invoice_id = NEW.id
      AND status = 'invoiced';

  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on invoices
DROP TRIGGER IF EXISTS trigger_propagate_invoice_status ON invoices;

CREATE TRIGGER trigger_propagate_invoice_status
  AFTER UPDATE OF status ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION propagate_invoice_status_change();

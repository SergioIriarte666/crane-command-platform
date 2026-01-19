
-- Function to apply payment to invoice and cascade updates
CREATE OR REPLACE FUNCTION public.apply_payment_to_invoice()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _invoice RECORD;
  _closure RECORD;
  _new_amount_paid NUMERIC;
  _new_balance_due NUMERIC;
  _new_invoice_status TEXT;
BEGIN
  -- Only process if status is 'confirmed' and has invoice_id
  IF NEW.status != 'confirmed' OR NEW.invoice_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get invoice data
  SELECT * INTO _invoice FROM invoices WHERE id = NEW.invoice_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Calculate new amounts
  _new_amount_paid := COALESCE(_invoice.amount_paid, 0) + NEW.amount;
  _new_balance_due := GREATEST(COALESCE(_invoice.total, 0) - _new_amount_paid, 0);

  -- Determine new invoice status
  IF _new_balance_due = 0 THEN
    _new_invoice_status := 'paid';
  ELSIF _new_amount_paid > 0 THEN
    _new_invoice_status := 'partial';
  ELSE
    _new_invoice_status := _invoice.status;
  END IF;

  -- Update invoice
  UPDATE invoices SET
    amount_paid = _new_amount_paid,
    balance_due = _new_balance_due,
    status = _new_invoice_status,
    paid_at = CASE WHEN _new_invoice_status = 'paid' THEN NOW() ELSE paid_at END,
    updated_at = NOW()
  WHERE id = NEW.invoice_id;

  -- Update billing closure if exists
  IF _invoice.billing_closure_id IS NOT NULL THEN
    SELECT * INTO _closure FROM billing_closures WHERE id = _invoice.billing_closure_id;
    
    IF FOUND THEN
      IF _new_invoice_status = 'paid' THEN
        -- Closure fully paid - mark as invoiced
        UPDATE billing_closures SET
          status = 'invoiced',
          invoice_id = NEW.invoice_id,
          updated_at = NOW()
        WHERE id = _invoice.billing_closure_id;

        -- Update services to invoiced (only completed ones)
        UPDATE services SET
          status = 'invoiced',
          updated_at = NOW()
        WHERE id IN (
          SELECT service_id FROM billing_closure_services 
          WHERE closure_id = _invoice.billing_closure_id
        ) AND status = 'completed';

      ELSIF _new_invoice_status = 'partial' THEN
        -- Partial payment - keep as invoicing
        UPDATE billing_closures SET
          status = 'invoicing',
          invoice_id = NEW.invoice_id,
          updated_at = NOW()
        WHERE id = _invoice.billing_closure_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Function to rollback payment from invoice
CREATE OR REPLACE FUNCTION public.rollback_payment_from_invoice()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _invoice RECORD;
  _new_amount_paid NUMERIC;
  _new_balance_due NUMERIC;
  _new_invoice_status TEXT;
  _payment_amount NUMERIC;
BEGIN
  -- For UPDATE: only process if changing FROM confirmed to something else
  -- For DELETE: only process if was confirmed
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'confirmed' OR NEW.status = 'confirmed' THEN
      RETURN NEW;
    END IF;
    _payment_amount := OLD.amount;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status != 'confirmed' THEN
      RETURN OLD;
    END IF;
    _payment_amount := OLD.amount;
  END IF;

  IF OLD.invoice_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  -- Get invoice data
  SELECT * INTO _invoice FROM invoices WHERE id = OLD.invoice_id;
  IF NOT FOUND THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  -- Calculate new amounts (subtract the payment)
  _new_amount_paid := GREATEST(COALESCE(_invoice.amount_paid, 0) - _payment_amount, 0);
  _new_balance_due := LEAST(COALESCE(_invoice.balance_due, 0) + _payment_amount, COALESCE(_invoice.total, 0));

  -- Determine new invoice status
  IF _new_amount_paid = 0 THEN
    _new_invoice_status := 'sent'; -- Back to sent if no payments
  ELSIF _new_balance_due > 0 THEN
    _new_invoice_status := 'partial';
  ELSE
    _new_invoice_status := _invoice.status;
  END IF;

  -- Update invoice
  UPDATE invoices SET
    amount_paid = _new_amount_paid,
    balance_due = _new_balance_due,
    status = _new_invoice_status,
    paid_at = CASE WHEN _new_invoice_status != 'paid' THEN NULL ELSE paid_at END,
    updated_at = NOW()
  WHERE id = OLD.invoice_id;

  -- Rollback billing closure if exists
  IF _invoice.billing_closure_id IS NOT NULL THEN
    IF _new_invoice_status != 'paid' THEN
      -- Revert closure status
      UPDATE billing_closures SET
        status = 'invoicing',
        updated_at = NOW()
      WHERE id = _invoice.billing_closure_id AND status = 'invoiced';

      -- Revert services back to completed (only those that were invoiced)
      UPDATE services SET
        status = 'completed',
        updated_at = NOW()
      WHERE id IN (
        SELECT service_id FROM billing_closure_services 
        WHERE closure_id = _invoice.billing_closure_id
      ) AND status = 'invoiced';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Function to update closure when invoice is created
CREATE OR REPLACE FUNCTION public.link_invoice_to_closure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.billing_closure_id IS NOT NULL THEN
    UPDATE billing_closures SET
      invoice_id = NEW.id,
      status = 'invoicing',
      updated_at = NOW()
    WHERE id = NEW.billing_closure_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_apply_payment_insert ON payments;
DROP TRIGGER IF EXISTS trigger_apply_payment_update ON payments;
DROP TRIGGER IF EXISTS trigger_rollback_payment_update ON payments;
DROP TRIGGER IF EXISTS trigger_rollback_payment_delete ON payments;
DROP TRIGGER IF EXISTS trigger_link_invoice_to_closure ON invoices;

-- Create triggers for payment confirmation
CREATE TRIGGER trigger_apply_payment_insert
  AFTER INSERT ON payments
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION apply_payment_to_invoice();

CREATE TRIGGER trigger_apply_payment_update
  AFTER UPDATE OF status ON payments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'confirmed')
  EXECUTE FUNCTION apply_payment_to_invoice();

-- Create triggers for payment rollback
CREATE TRIGGER trigger_rollback_payment_update
  AFTER UPDATE OF status ON payments
  FOR EACH ROW
  WHEN (OLD.status = 'confirmed' AND NEW.status != 'confirmed')
  EXECUTE FUNCTION rollback_payment_from_invoice();

CREATE TRIGGER trigger_rollback_payment_delete
  BEFORE DELETE ON payments
  FOR EACH ROW
  WHEN (OLD.status = 'confirmed')
  EXECUTE FUNCTION rollback_payment_from_invoice();

-- Create trigger for invoice-closure linking
CREATE TRIGGER trigger_link_invoice_to_closure
  AFTER INSERT ON invoices
  FOR EACH ROW
  WHEN (NEW.billing_closure_id IS NOT NULL)
  EXECUTE FUNCTION link_invoice_to_closure();

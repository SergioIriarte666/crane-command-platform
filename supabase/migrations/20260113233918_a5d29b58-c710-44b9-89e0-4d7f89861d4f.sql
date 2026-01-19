-- =============================================
-- FINANCE MODULE: Invoicing, Closures, Reconciliation, Commissions
-- =============================================

-- Enums for finance module
CREATE TYPE invoice_status AS ENUM (
  'draft', 'pending', 'sent', 'paid', 'partial', 'overdue', 'cancelled'
);

CREATE TYPE closure_status AS ENUM (
  'draft', 'review', 'client_review', 'approved', 'invoicing', 'invoiced', 'cancelled'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'confirmed', 'rejected'
);

CREATE TYPE commission_status AS ENUM (
  'pending', 'approved', 'paid', 'cancelled'
);

CREATE TYPE reconciliation_status AS ENUM (
  'pending', 'matched', 'unmatched', 'disputed'
);

-- =============================================
-- BILLING CLOSURES (Cierres de Facturación)
-- =============================================
CREATE TABLE public.billing_closures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  folio TEXT NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id),
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Status workflow
  status closure_status NOT NULL DEFAULT 'draft',
  
  -- Amounts
  services_count INTEGER DEFAULT 0,
  subtotal NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 19,
  tax_amount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  
  -- Client review
  client_comments TEXT,
  client_reviewed_at TIMESTAMPTZ,
  client_reviewed_by TEXT,
  
  -- Approval
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  
  -- Invoice reference
  invoice_id UUID,
  
  -- Audit
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Services included in a closure
CREATE TABLE public.billing_closure_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  closure_id UUID NOT NULL REFERENCES public.billing_closures(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id),
  
  -- Snapshot of service data at closure time
  service_folio TEXT NOT NULL,
  service_date DATE,
  service_type TEXT,
  vehicle_info TEXT,
  origin_destination TEXT,
  
  -- Amounts
  subtotal NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  
  -- Client adjustments
  client_adjustment NUMERIC DEFAULT 0,
  client_notes TEXT,
  
  -- Status
  is_approved BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INVOICES (Facturas)
-- =============================================
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  folio TEXT NOT NULL,
  
  -- Client
  client_id UUID NOT NULL REFERENCES public.clients(id),
  billing_closure_id UUID REFERENCES public.billing_closures(id),
  
  -- Invoice details
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  
  -- Fiscal data (Chile)
  invoice_type TEXT DEFAULT 'factura', -- factura, boleta, nota_credito
  fiscal_folio TEXT, -- DTE folio
  
  -- Amounts
  subtotal NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 19,
  tax_amount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  
  -- Payment tracking
  amount_paid NUMERIC DEFAULT 0,
  balance_due NUMERIC DEFAULT 0,
  
  -- Status
  status invoice_status NOT NULL DEFAULT 'draft',
  
  -- Dates
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Files
  pdf_url TEXT,
  xml_url TEXT, -- For DTE
  
  -- Audit
  notes TEXT,
  internal_notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Invoice line items
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  
  -- Reference
  service_id UUID REFERENCES public.services(id),
  
  -- Item details
  description TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  subtotal NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 19,
  tax_amount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- PAYMENTS (Pagos)
-- =============================================
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  
  -- References
  invoice_id UUID REFERENCES public.invoices(id),
  client_id UUID NOT NULL REFERENCES public.clients(id),
  
  -- Payment details
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC NOT NULL,
  payment_method payment_method NOT NULL DEFAULT 'transfer',
  
  -- Bank details
  reference_number TEXT,
  bank_name TEXT,
  account_last_digits TEXT,
  
  -- Reconciliation
  reconciliation_id UUID,
  status payment_status NOT NULL DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID,
  
  -- Audit
  notes TEXT,
  receipt_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- RECONCILIATION (Conciliación Bancaria)
-- =============================================
CREATE TABLE public.bank_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  
  -- Transaction details
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,
  amount NUMERIC NOT NULL,
  is_credit BOOLEAN NOT NULL DEFAULT true,
  
  -- Bank info
  bank_name TEXT,
  account_number TEXT,
  
  -- Matching
  status reconciliation_status NOT NULL DEFAULT 'pending',
  matched_payment_id UUID REFERENCES public.payments(id),
  matched_at TIMESTAMPTZ,
  matched_by UUID,
  
  -- Import tracking
  import_batch TEXT,
  imported_at TIMESTAMPTZ DEFAULT now(),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- COMMISSIONS (Comisiones de Operadores)
-- =============================================
CREATE TABLE public.commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  
  -- Operator
  operator_id UUID NOT NULL REFERENCES public.operators(id),
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Summary
  services_count INTEGER DEFAULT 0,
  total_services_value NUMERIC DEFAULT 0,
  
  -- Commission calculation
  commission_type commission_type NOT NULL DEFAULT 'percentage',
  commission_percentage NUMERIC DEFAULT 0,
  commission_fixed NUMERIC DEFAULT 0,
  calculated_amount NUMERIC DEFAULT 0,
  
  -- Adjustments
  bonus NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  adjustment_notes TEXT,
  
  -- Final amount
  total_amount NUMERIC DEFAULT 0,
  
  -- Status
  status commission_status NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,
  
  -- Audit
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Commission details (services included)
CREATE TABLE public.commission_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commission_id UUID NOT NULL REFERENCES public.commissions(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id),
  
  -- Service snapshot
  service_folio TEXT NOT NULL,
  service_date DATE,
  service_total NUMERIC DEFAULT 0,
  
  -- Commission for this service
  commission_amount NUMERIC DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.billing_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_closure_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_services ENABLE ROW LEVEL SECURITY;

-- Billing Closures policies
CREATE POLICY "Users can view tenant closures" ON public.billing_closures
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can create closures" ON public.billing_closures
  FOR INSERT WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) AND 
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dispatcher'))
  );

CREATE POLICY "Admins can update closures" ON public.billing_closures
  FOR UPDATE USING (
    tenant_id = get_user_tenant_id(auth.uid()) AND 
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dispatcher'))
  );

CREATE POLICY "Admins can delete closures" ON public.billing_closures
  FOR DELETE USING (
    tenant_id = get_user_tenant_id(auth.uid()) AND 
    has_role(auth.uid(), 'admin')
  );

-- Billing Closure Services policies
CREATE POLICY "Users can view closure services" ON public.billing_closure_services
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM billing_closures WHERE id = closure_id AND tenant_id = get_user_tenant_id(auth.uid()))
  );

CREATE POLICY "Admins can manage closure services" ON public.billing_closure_services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM billing_closures WHERE id = closure_id AND tenant_id = get_user_tenant_id(auth.uid()))
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dispatcher'))
  );

-- Invoices policies
CREATE POLICY "Users can view tenant invoices" ON public.invoices
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Super admins can view all invoices" ON public.invoices
  FOR SELECT USING (is_super_admin(auth.uid()));

CREATE POLICY "Admins can create invoices" ON public.invoices
  FOR INSERT WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) AND 
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dispatcher'))
  );

CREATE POLICY "Admins can update invoices" ON public.invoices
  FOR UPDATE USING (
    tenant_id = get_user_tenant_id(auth.uid()) AND 
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dispatcher'))
  );

CREATE POLICY "Admins can delete invoices" ON public.invoices
  FOR DELETE USING (
    tenant_id = get_user_tenant_id(auth.uid()) AND 
    has_role(auth.uid(), 'admin')
  );

-- Invoice Items policies
CREATE POLICY "Users can view invoice items" ON public.invoice_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM invoices WHERE id = invoice_id AND tenant_id = get_user_tenant_id(auth.uid()))
  );

CREATE POLICY "Admins can manage invoice items" ON public.invoice_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM invoices WHERE id = invoice_id AND tenant_id = get_user_tenant_id(auth.uid()))
    AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dispatcher'))
  );

-- Payments policies
CREATE POLICY "Users can view tenant payments" ON public.payments
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can create payments" ON public.payments
  FOR INSERT WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) AND 
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dispatcher'))
  );

CREATE POLICY "Admins can update payments" ON public.payments
  FOR UPDATE USING (
    tenant_id = get_user_tenant_id(auth.uid()) AND 
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'dispatcher'))
  );

CREATE POLICY "Admins can delete payments" ON public.payments
  FOR DELETE USING (
    tenant_id = get_user_tenant_id(auth.uid()) AND 
    has_role(auth.uid(), 'admin')
  );

-- Bank Transactions policies
CREATE POLICY "Users can view tenant transactions" ON public.bank_transactions
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can manage transactions" ON public.bank_transactions
  FOR ALL USING (
    tenant_id = get_user_tenant_id(auth.uid()) AND 
    has_role(auth.uid(), 'admin')
  );

-- Commissions policies
CREATE POLICY "Users can view tenant commissions" ON public.commissions
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can create commissions" ON public.commissions
  FOR INSERT WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid()) AND 
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update commissions" ON public.commissions
  FOR UPDATE USING (
    tenant_id = get_user_tenant_id(auth.uid()) AND 
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete commissions" ON public.commissions
  FOR DELETE USING (
    tenant_id = get_user_tenant_id(auth.uid()) AND 
    has_role(auth.uid(), 'admin')
  );

-- Commission Services policies
CREATE POLICY "Users can view commission services" ON public.commission_services
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM commissions WHERE id = commission_id AND tenant_id = get_user_tenant_id(auth.uid()))
  );

CREATE POLICY "Admins can manage commission services" ON public.commission_services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM commissions WHERE id = commission_id AND tenant_id = get_user_tenant_id(auth.uid()))
    AND has_role(auth.uid(), 'admin')
  );

-- =============================================
-- FUNCTIONS
-- =============================================

-- Generate invoice folio
CREATE OR REPLACE FUNCTION generate_invoice_folio(_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _year TEXT;
  _count INTEGER;
  _folio TEXT;
BEGIN
  _year := to_char(CURRENT_DATE, 'YYYY');
  SELECT COUNT(*) + 1 INTO _count 
  FROM invoices 
  WHERE tenant_id = _tenant_id 
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
  _folio := 'FAC-' || _year || '-' || LPAD(_count::TEXT, 5, '0');
  RETURN _folio;
END;
$$;

-- Generate closure folio
CREATE OR REPLACE FUNCTION generate_closure_folio(_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _year TEXT;
  _count INTEGER;
  _folio TEXT;
BEGIN
  _year := to_char(CURRENT_DATE, 'YYYY');
  SELECT COUNT(*) + 1 INTO _count 
  FROM billing_closures 
  WHERE tenant_id = _tenant_id 
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);
  _folio := 'CIE-' || _year || '-' || LPAD(_count::TEXT, 5, '0');
  RETURN _folio;
END;
$$;

-- Generate commission folio
CREATE OR REPLACE FUNCTION generate_commission_folio(_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _year TEXT;
  _month TEXT;
  _count INTEGER;
  _folio TEXT;
BEGIN
  _year := to_char(CURRENT_DATE, 'YYYY');
  _month := to_char(CURRENT_DATE, 'MM');
  SELECT COUNT(*) + 1 INTO _count 
  FROM commissions 
  WHERE tenant_id = _tenant_id 
    AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
    AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE);
  _folio := 'COM-' || _year || _month || '-' || LPAD(_count::TEXT, 4, '0');
  RETURN _folio;
END;
$$;

-- =============================================
-- TRIGGERS
-- =============================================

-- Update timestamps
CREATE TRIGGER update_billing_closures_updated_at
  BEFORE UPDATE ON public.billing_closures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at
  BEFORE UPDATE ON public.commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update invoice balance when payment is added
CREATE OR REPLACE FUNCTION update_invoice_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  _total_paid NUMERIC;
  _invoice_total NUMERIC;
  _new_status invoice_status;
BEGIN
  IF NEW.invoice_id IS NOT NULL AND NEW.status = 'confirmed' THEN
    -- Calculate total paid for this invoice
    SELECT COALESCE(SUM(amount), 0) INTO _total_paid
    FROM payments
    WHERE invoice_id = NEW.invoice_id AND status = 'confirmed';
    
    -- Get invoice total
    SELECT total INTO _invoice_total
    FROM invoices
    WHERE id = NEW.invoice_id;
    
    -- Determine new status
    IF _total_paid >= _invoice_total THEN
      _new_status := 'paid';
    ELSIF _total_paid > 0 THEN
      _new_status := 'partial';
    ELSE
      _new_status := 'pending';
    END IF;
    
    -- Update invoice
    UPDATE invoices
    SET 
      amount_paid = _total_paid,
      balance_due = _invoice_total - _total_paid,
      status = _new_status,
      paid_at = CASE WHEN _new_status = 'paid' THEN now() ELSE NULL END
    WHERE id = NEW.invoice_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_invoice_balance
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_invoice_balance();

-- Update services when linked to closure
CREATE OR REPLACE FUNCTION link_service_to_closure()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE services
  SET billing_closure_id = NEW.closure_id
  WHERE id = NEW.service_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_link_service_to_closure
  AFTER INSERT ON public.billing_closure_services
  FOR EACH ROW EXECUTE FUNCTION link_service_to_closure();

-- Add foreign key to services for invoice reference
ALTER TABLE public.services
  ADD CONSTRAINT services_invoice_id_fkey 
  FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);

ALTER TABLE public.services
  ADD CONSTRAINT services_billing_closure_id_fkey 
  FOREIGN KEY (billing_closure_id) REFERENCES public.billing_closures(id);

-- Update payments reconciliation reference
ALTER TABLE public.payments
  ADD CONSTRAINT payments_reconciliation_id_fkey 
  FOREIGN KEY (reconciliation_id) REFERENCES public.bank_transactions(id);

-- Add invoice reference to billing closures
ALTER TABLE public.billing_closures
  ADD CONSTRAINT billing_closures_invoice_id_fkey 
  FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);
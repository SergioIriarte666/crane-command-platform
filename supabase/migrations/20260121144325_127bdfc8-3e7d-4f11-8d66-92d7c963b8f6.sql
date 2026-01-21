-- Add VIP pipeline fields to services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS quote_number TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS purchase_order_number TEXT;

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_services_client_status ON public.services(client_id, status);
CREATE INDEX IF NOT EXISTS idx_services_quote_number ON public.services(quote_number) WHERE quote_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_services_purchase_order_number ON public.services(purchase_order_number) WHERE purchase_order_number IS NOT NULL;
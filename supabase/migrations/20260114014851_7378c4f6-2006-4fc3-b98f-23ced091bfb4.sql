-- Create upgrade_requests table
CREATE TABLE public.upgrade_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  current_plan TEXT NOT NULL,
  requested_plan TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID
);

-- Enable RLS
ALTER TABLE public.upgrade_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view their tenant's upgrade requests
CREATE POLICY "Admins can view tenant upgrade requests"
ON public.upgrade_requests
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Policy: Admins can create upgrade requests for their tenant
CREATE POLICY "Admins can create upgrade requests"
ON public.upgrade_requests
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Add index for faster lookups
CREATE INDEX idx_upgrade_requests_tenant_id ON public.upgrade_requests(tenant_id);
CREATE INDEX idx_upgrade_requests_status ON public.upgrade_requests(status);
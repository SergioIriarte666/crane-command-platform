-- Create generic audit logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR NOT NULL,
    actor_id UUID REFERENCES auth.users(id),
    target_resource VARCHAR, -- e.g., 'user', 'tenant', 'crane'
    target_id UUID,
    tenant_id UUID REFERENCES public.tenants(id),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view audit logs for their tenant"
ON public.audit_logs FOR SELECT TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid()) 
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
);

CREATE POLICY "Super admins can view all audit logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Service role can insert audit logs"
ON public.audit_logs FOR INSERT TO service_role
WITH CHECK (true);

-- Allow authenticated users to insert logs (e.g. from client side actions if needed, though usually better from server)
CREATE POLICY "Authenticated can insert audit logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = actor_id
);

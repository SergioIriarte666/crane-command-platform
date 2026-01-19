
-- Create trial_settings table
CREATE TABLE IF NOT EXISTS public.trial_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_active BOOLEAN DEFAULT false,
    default_duration_days INTEGER DEFAULT 14,
    allowed_durations INTEGER[] DEFAULT '{1,3,7,14,30}',
    trial_plan VARCHAR DEFAULT 'basic',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns to tenants if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'is_trial') THEN
        ALTER TABLE public.tenants ADD COLUMN is_trial BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenants' AND column_name = 'trial_ends_at') THEN
        ALTER TABLE public.tenants ADD COLUMN trial_ends_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create trial_audit_logs table
CREATE TABLE IF NOT EXISTS public.trial_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR NOT NULL,
    actor_id UUID REFERENCES auth.users(id),
    target_tenant_id UUID REFERENCES public.tenants(id),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trial_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for trial_settings
CREATE POLICY "Allow read access to authenticated users" ON public.trial_settings
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow full access to super admins" ON public.trial_settings
FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_super_admin = true
  )
);

-- Policies for trial_audit_logs
CREATE POLICY "Allow read access to super admins" ON public.trial_audit_logs
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_super_admin = true
  )
);

CREATE POLICY "Allow insert access to authenticated users" ON public.trial_audit_logs
FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = actor_id OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_super_admin = true
  )
);

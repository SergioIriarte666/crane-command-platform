-- 1. Crear tabla de configuracion de pruebas
CREATE TABLE IF NOT EXISTS public.trial_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    is_active BOOLEAN DEFAULT false,
    default_duration_days INTEGER DEFAULT 14,
    allowed_durations INTEGER[] DEFAULT '{1,3,7,14,30}',
    trial_plan VARCHAR DEFAULT 'basic',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Agregar columnas a la tabla de tenants
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- 3. Crear tabla de logs de auditoria
CREATE TABLE IF NOT EXISTS public.trial_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR NOT NULL,
    actor_id UUID REFERENCES auth.users(id),
    target_tenant_id UUID REFERENCES public.tenants(id),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Habilitar RLS
ALTER TABLE public.trial_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trial_audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Politicas para trial_settings (usando funcion is_super_admin existente)
CREATE POLICY "Allow read trial_settings to authenticated" 
ON public.trial_settings FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "Allow manage trial_settings to super_admins" 
ON public.trial_settings FOR ALL TO authenticated 
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- 6. Politicas para trial_audit_logs (usando funcion is_super_admin existente)
CREATE POLICY "Allow read audit_logs to super_admins" 
ON public.trial_audit_logs FOR SELECT TO authenticated 
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Allow insert audit_logs to authenticated" 
ON public.trial_audit_logs FOR INSERT TO authenticated 
WITH CHECK (
    auth.uid() = actor_id OR 
    public.is_super_admin(auth.uid())
);

-- 7. Insertar configuracion inicial
INSERT INTO public.trial_settings (is_active, default_duration_days, trial_plan)
VALUES (false, 14, 'basic')
ON CONFLICT DO NOTHING;
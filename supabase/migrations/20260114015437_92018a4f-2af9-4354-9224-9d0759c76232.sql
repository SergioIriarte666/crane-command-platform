-- Create plan_configs table
CREATE TABLE public.plan_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price TEXT NOT NULL,
  price_amount NUMERIC DEFAULT 0,
  max_cranes INTEGER,
  max_users INTEGER,
  max_operators INTEGER,
  max_clients INTEGER,
  icon TEXT DEFAULT 'Shield',
  color TEXT DEFAULT 'slate',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create plan_features table
CREATE TABLE public.plan_features (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_config_id UUID NOT NULL REFERENCES public.plan_configs(id) ON DELETE CASCADE,
  feature_text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plan_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

-- RLS policies for plan_configs
CREATE POLICY "Anyone can read plan configs"
  ON public.plan_configs FOR SELECT USING (true);

CREATE POLICY "Super admin can insert plan configs"
  ON public.plan_configs FOR INSERT WITH CHECK (
    public.is_super_admin(auth.uid())
  );

CREATE POLICY "Super admin can update plan configs"
  ON public.plan_configs FOR UPDATE USING (
    public.is_super_admin(auth.uid())
  );

CREATE POLICY "Super admin can delete plan configs"
  ON public.plan_configs FOR DELETE USING (
    public.is_super_admin(auth.uid())
  );

-- RLS policies for plan_features
CREATE POLICY "Anyone can read plan features"
  ON public.plan_features FOR SELECT USING (true);

CREATE POLICY "Super admin can insert plan features"
  ON public.plan_features FOR INSERT WITH CHECK (
    public.is_super_admin(auth.uid())
  );

CREATE POLICY "Super admin can update plan features"
  ON public.plan_features FOR UPDATE USING (
    public.is_super_admin(auth.uid())
  );

CREATE POLICY "Super admin can delete plan features"
  ON public.plan_features FOR DELETE USING (
    public.is_super_admin(auth.uid())
  );

-- Trigger for updated_at
CREATE TRIGGER update_plan_configs_updated_at
  BEFORE UPDATE ON public.plan_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial data
INSERT INTO public.plan_configs (plan_key, name, price, price_amount, max_cranes, max_users, max_operators, max_clients, icon, color, sort_order) VALUES
  ('basic', 'Básico', '$499/mes', 499, 5, 3, 5, 50, 'Shield', 'slate', 1),
  ('professional', 'Profesional', '$999/mes', 999, 20, 10, 20, NULL, 'Zap', 'blue', 2),
  ('enterprise', 'Empresarial', 'Contactar', 0, NULL, NULL, NULL, NULL, 'Crown', 'amber', 3);

-- Seed features for basic plan
INSERT INTO public.plan_features (plan_config_id, feature_text, sort_order)
SELECT id, feature, sort_order FROM (
  SELECT id, unnest(ARRAY['5 grúas', '3 usuarios', '5 operadores', '50 clientes', 'Reportes básicos', 'Soporte por email']) as feature,
         generate_series(1, 6) as sort_order
  FROM public.plan_configs WHERE plan_key = 'basic'
) t;

-- Seed features for professional plan
INSERT INTO public.plan_features (plan_config_id, feature_text, sort_order)
SELECT id, feature, sort_order FROM (
  SELECT id, unnest(ARRAY['20 grúas', '10 usuarios', '20 operadores', 'Clientes ilimitados', 'Reportes avanzados', 'Soporte prioritario', 'Integraciones']) as feature,
         generate_series(1, 7) as sort_order
  FROM public.plan_configs WHERE plan_key = 'professional'
) t;

-- Seed features for enterprise plan
INSERT INTO public.plan_features (plan_config_id, feature_text, sort_order)
SELECT id, feature, sort_order FROM (
  SELECT id, unnest(ARRAY['Grúas ilimitadas', 'Usuarios ilimitados', 'Operadores ilimitados', 'Clientes ilimitados', 'Reportes personalizados', 'Soporte dedicado', 'API completa', 'Multi-sucursal']) as feature,
         generate_series(1, 8) as sort_order
  FROM public.plan_configs WHERE plan_key = 'enterprise'
) t;
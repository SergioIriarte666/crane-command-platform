-- Crear tabla service_operators para múltiples operadores por servicio
CREATE TABLE public.service_operators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE RESTRICT,
  role TEXT DEFAULT 'Principal', -- 'Principal', 'Auxiliar', 'Supervisor'
  commission NUMERIC(12,2) DEFAULT 0,
  hours NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(service_id, operator_id)
);

-- Índices para rendimiento
CREATE INDEX idx_service_operators_service_id ON public.service_operators(service_id);
CREATE INDEX idx_service_operators_operator_id ON public.service_operators(operator_id);
CREATE INDEX idx_service_operators_tenant_id ON public.service_operators(tenant_id);

-- Habilitar RLS
ALTER TABLE public.service_operators ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para service_operators
CREATE POLICY "service_operators_tenant_isolation" ON public.service_operators
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

-- Trigger para updated_at
CREATE TRIGGER update_service_operators_updated_at
  BEFORE UPDATE ON public.service_operators
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Agregar nuevos campos a services si no existen
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS request_date DATE,
  ADD COLUMN IF NOT EXISTS service_date DATE,
  ADD COLUMN IF NOT EXISTS quote_number TEXT,
  ADD COLUMN IF NOT EXISTS service_value NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS has_excess BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS client_covered_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS excess_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS observations TEXT;

-- Agregar tabla para costos asociados a servicios (distinta de costs general)
CREATE TABLE public.service_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_price NUMERIC(12,2),
  category_id TEXT,
  subcategory TEXT,
  notes TEXT,
  cost_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para service_costs
CREATE INDEX idx_service_costs_service_id ON public.service_costs(service_id);
CREATE INDEX idx_service_costs_tenant_id ON public.service_costs(tenant_id);

-- Habilitar RLS para service_costs
ALTER TABLE public.service_costs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para service_costs
CREATE POLICY "service_costs_tenant_isolation" ON public.service_costs
  FOR ALL USING (
    tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  );

-- Trigger para updated_at
CREATE TRIGGER update_service_costs_updated_at
  BEFORE UPDATE ON public.service_costs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
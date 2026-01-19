-- =============================================
-- FASE 1: Nuevas tablas para el módulo de costos
-- =============================================

-- Tabla de categorías de costos (reemplaza enum estático)
CREATE TABLE IF NOT EXISTS public.cost_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6b7280',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, name)
);

-- Tabla de subcategorías dinámicas
CREATE TABLE IF NOT EXISTS public.cost_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.cost_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, category_id, name)
);

-- Tabla de centros de costo
CREATE TABLE IF NOT EXISTS public.cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.cost_centers(id) ON DELETE SET NULL,
  budget_amount NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, code)
);

-- =============================================
-- FASE 2: Modificar tabla costs con nuevos campos
-- =============================================

-- Agregar nuevos campos a la tabla costs
ALTER TABLE public.costs
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.cost_categories(id),
  ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.cost_subcategories(id),
  ADD COLUMN IF NOT EXISTS cost_center_id UUID REFERENCES public.cost_centers(id),
  ADD COLUMN IF NOT EXISTS service_folio TEXT,
  ADD COLUMN IF NOT EXISTS payment_date DATE,
  ADD COLUMN IF NOT EXISTS part_name TEXT,
  ADD COLUMN IF NOT EXISTS supplier_name TEXT,
  ADD COLUMN IF NOT EXISTS supplier_phone TEXT,
  ADD COLUMN IF NOT EXISTS kilometraje NUMERIC,
  ADD COLUMN IF NOT EXISTS purchase_quantity NUMERIC,
  ADD COLUMN IF NOT EXISTS purchase_unit_cost NUMERIC,
  ADD COLUMN IF NOT EXISTS immediate_consumption BOOLEAN DEFAULT false;

-- =============================================
-- FASE 3: Habilitar RLS en nuevas tablas
-- =============================================

ALTER TABLE public.cost_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;

-- Políticas para cost_categories
CREATE POLICY "Users can view cost_categories of their tenant"
  ON public.cost_categories FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert cost_categories for their tenant"
  ON public.cost_categories FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update cost_categories of their tenant"
  ON public.cost_categories FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete cost_categories of their tenant"
  ON public.cost_categories FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Políticas para cost_subcategories
CREATE POLICY "Users can view cost_subcategories of their tenant"
  ON public.cost_subcategories FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert cost_subcategories for their tenant"
  ON public.cost_subcategories FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update cost_subcategories of their tenant"
  ON public.cost_subcategories FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete cost_subcategories of their tenant"
  ON public.cost_subcategories FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- Políticas para cost_centers
CREATE POLICY "Users can view cost_centers of their tenant"
  ON public.cost_centers FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert cost_centers for their tenant"
  ON public.cost_centers FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update cost_centers of their tenant"
  ON public.cost_centers FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete cost_centers of their tenant"
  ON public.cost_centers FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- =============================================
-- FASE 4: Triggers para updated_at
-- =============================================

CREATE TRIGGER update_cost_categories_updated_at
  BEFORE UPDATE ON public.cost_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cost_subcategories_updated_at
  BEFORE UPDATE ON public.cost_subcategories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cost_centers_updated_at
  BEFORE UPDATE ON public.cost_centers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
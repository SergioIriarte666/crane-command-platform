-- Create cost_status enum
CREATE TYPE public.cost_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected');

-- Create cost_category enum
CREATE TYPE public.cost_category AS ENUM ('materials', 'labor', 'services', 'taxes', 'transport', 'equipment', 'other');

-- Create costs table
CREATE TABLE public.costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  category public.cost_category NOT NULL DEFAULT 'other',
  unit_value NUMERIC NOT NULL DEFAULT 0,
  quantity NUMERIC NOT NULL DEFAULT 1,
  subtotal NUMERIC GENERATED ALWAYS AS (unit_value * quantity) STORED,
  discount NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 19,
  tax_amount NUMERIC GENERATED ALWAYS AS ((unit_value * quantity - discount) * tax_rate / 100) STORED,
  total NUMERIC GENERATED ALWAYS AS (unit_value * quantity - discount + (unit_value * quantity - discount) * tax_rate / 100) STORED,
  status public.cost_status NOT NULL DEFAULT 'draft',
  
  -- References (optional)
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  crane_id UUID REFERENCES public.cranes(id) ON DELETE SET NULL,
  operator_id UUID REFERENCES public.operators(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  
  -- Approval workflow
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID,
  rejection_reason TEXT,
  
  -- Audit fields
  notes TEXT,
  cost_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique code per tenant
  CONSTRAINT costs_tenant_code_unique UNIQUE (tenant_id, code),
  -- Ensure discount is not greater than subtotal
  CONSTRAINT costs_discount_check CHECK (discount >= 0),
  CONSTRAINT costs_unit_value_positive CHECK (unit_value >= 0),
  CONSTRAINT costs_quantity_positive CHECK (quantity > 0),
  CONSTRAINT costs_tax_rate_valid CHECK (tax_rate >= 0 AND tax_rate <= 100)
);

-- Create indexes for better query performance
CREATE INDEX idx_costs_tenant_id ON public.costs(tenant_id);
CREATE INDEX idx_costs_status ON public.costs(status);
CREATE INDEX idx_costs_category ON public.costs(category);
CREATE INDEX idx_costs_cost_date ON public.costs(cost_date);
CREATE INDEX idx_costs_service_id ON public.costs(service_id);
CREATE INDEX idx_costs_created_at ON public.costs(created_at);

-- Enable RLS
ALTER TABLE public.costs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view costs from their tenant
CREATE POLICY "Users can view tenant costs"
ON public.costs
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Super admins can view all costs
CREATE POLICY "Super admins can view all costs"
ON public.costs
FOR SELECT
USING (is_super_admin(auth.uid()));

-- Admins and dispatchers can create costs
CREATE POLICY "Admins can create costs"
ON public.costs
FOR INSERT
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'dispatcher'::app_role)
  )
);

-- Admins can update costs (only non-approved ones for non-admins)
CREATE POLICY "Admins can update costs"
ON public.costs
FOR UPDATE
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR (has_role(auth.uid(), 'dispatcher'::app_role) AND status IN ('draft', 'pending_approval', 'rejected'))
  )
)
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR (has_role(auth.uid(), 'dispatcher'::app_role) AND status IN ('draft', 'pending_approval', 'rejected'))
  )
);

-- Only admins can delete costs
CREATE POLICY "Admins can delete costs"
ON public.costs
FOR DELETE
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Create updated_at trigger
CREATE TRIGGER update_costs_updated_at
BEFORE UPDATE ON public.costs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add permissions for cost management
INSERT INTO public.permissions (id, label, group_name, description, sort_order) VALUES
('costs.view', 'Ver costos', 'Costos', 'Permite ver el listado de costos', 1),
('costs.create', 'Crear costos', 'Costos', 'Permite crear nuevos costos', 2),
('costs.edit', 'Editar costos', 'Costos', 'Permite editar costos existentes', 3),
('costs.delete', 'Eliminar costos', 'Costos', 'Permite eliminar costos', 4),
('costs.approve', 'Aprobar costos', 'Costos', 'Permite aprobar o rechazar costos', 5),
('costs.export', 'Exportar costos', 'Costos', 'Permite exportar costos a CSV/PDF', 6)
ON CONFLICT (id) DO NOTHING;
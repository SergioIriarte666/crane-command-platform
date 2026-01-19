-- Add parent_id column to catalog_items for hierarchical relationships (e.g., models belong to brands)
ALTER TABLE public.catalog_items 
ADD COLUMN parent_id UUID REFERENCES public.catalog_items(id) ON DELETE SET NULL;

-- Create index for faster lookups of children
CREATE INDEX idx_catalog_items_parent_id ON public.catalog_items(parent_id);

-- Add comment explaining the column
COMMENT ON COLUMN public.catalog_items.parent_id IS 'Reference to parent catalog item (e.g., vehicle_model references vehicle_brand)';
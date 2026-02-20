import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface CatalogItem {
  id: string;
  tenant_id: string;
  catalog_type: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean | null;
  sort_order: number | null;
  metadata: Json | null;
  parent_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CatalogItemInsert {
  catalog_type: string;
  code: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
  metadata?: Json;
  parent_id?: string | null;
}

export interface CatalogItemUpdate {
  code?: string;
  name?: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
  metadata?: Json;
  parent_id?: string | null;
}

// Define catalog types with their display names
export const CATALOG_TYPES = {
  // Clients
  client_type: { label: 'Tipo de Cliente', module: 'Clientes' },
  
  // Cranes
  crane_type: { label: 'Tipo de Grúa', module: 'Grúas' },
  
  // Operators
  license_type: { label: 'Tipo de Licencia', module: 'Operadores' },
  
  // Suppliers
  supplier_category: { label: 'Categoría de Proveedor', module: 'Proveedores' },
  
  // Inventory
  inventory_category: { label: 'Categoría de Inventario', module: 'Inventario' },
  
  // Services
  service_type: { label: 'Tipo de Servicio', module: 'Servicios' },
  
  // Vehicles (New Module)
  vehicle_type: { label: 'Tipo de Vehículo', module: 'Vehículos' },
  vehicle_brand: { label: 'Marca de Vehículo', module: 'Vehículos', isParent: true },
  vehicle_model: { label: 'Modelo de Vehículo', module: 'Vehículos', parentType: 'vehicle_brand' as const },
  vehicle_condition: { label: 'Condición de Vehículo', module: 'Vehículos' },
  
  // Costs (unified)
  cost_category: { label: 'Categoría de Costo', module: 'Costos', isParent: true },
  cost_subcategory: { label: 'Subcategoría de Costo', module: 'Costos', parentType: 'cost_category' as const },
  cost_center: { label: 'Centro de Costo', module: 'Costos' },
  
  // Facturación
  payment_terms: { label: 'Condiciones de Pago', module: 'Facturación' },
  
  // Operadores
  blood_type: { label: 'Tipo de Sangre', module: 'Operadores' },
  commission_type: { label: 'Tipo de Comisión', module: 'Operadores' },
  bank: { label: 'Banco', module: 'Operadores' },
  
  // Clientes extra
  region: { label: 'Región', module: 'Clientes' },
  tax_regime: { label: 'Régimen Fiscal', module: 'Clientes' },
  
  // Grúas extra
  fuel_type: { label: 'Tipo de Combustible', module: 'Grúas' },
  
  // Estados (Dynamic Status Catalogs)
  service_status: { label: 'Estados de Servicio', module: 'Estados' },
  closure_status: { label: 'Estados de Cierre', module: 'Estados' },
  invoice_status: { label: 'Estados de Factura', module: 'Estados' },
} as const;

export type CatalogType = keyof typeof CATALOG_TYPES;

export function useCatalogs(catalogType?: CatalogType) {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  const catalogsQuery = useQuery({
    queryKey: ['catalogs', authUser?.tenant?.id, catalogType],
    queryFn: async () => {
      let query = supabase
        .from('catalog_items')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (catalogType) {
        query = query.eq('catalog_type', catalogType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CatalogItem[];
    },
    enabled: !!authUser?.tenant?.id,
  });

  const createCatalogItem = useMutation({
    mutationFn: async (item: CatalogItemInsert) => {
      if (!authUser?.tenant?.id) throw new Error('No tenant');

      const { data, error } = await supabase
        .from('catalog_items')
        .insert({
          catalog_type: item.catalog_type,
          code: item.code,
          name: item.name,
          description: item.description,
          is_active: item.is_active,
          sort_order: item.sort_order,
          metadata: item.metadata,
          parent_id: item.parent_id,
          tenant_id: authUser.tenant.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CatalogItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogs'] });
      toast.success('Elemento creado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al crear elemento: ${error.message}`);
    },
  });

  const updateCatalogItem = useMutation({
    mutationFn: async ({ id, ...updates }: CatalogItemUpdate & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (updates.code !== undefined) updateData.code = updates.code;
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      if (updates.sort_order !== undefined) updateData.sort_order = updates.sort_order;
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata;
      if (updates.parent_id !== undefined) updateData.parent_id = updates.parent_id;

      const { data, error } = await supabase
        .from('catalog_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CatalogItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogs'] });
      toast.success('Elemento actualizado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al actualizar elemento: ${error.message}`);
    },
  });

  const deleteCatalogItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('catalog_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalogs'] });
      toast.success('Elemento eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al eliminar elemento: ${error.message}`);
    },
  });

  const toggleCatalogItem = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('catalog_items')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CatalogItem;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['catalogs'] });
      toast.success(data.is_active ? 'Elemento activado' : 'Elemento desactivado');
    },
    onError: (error) => {
      toast.error(`Error al cambiar estado: ${error.message}`);
    },
  });

  // Group catalogs by type
  const catalogsByType = (catalogsQuery.data || []).reduce((acc, item) => {
    if (!acc[item.catalog_type]) {
      acc[item.catalog_type] = [];
    }
    acc[item.catalog_type].push(item);
    return acc;
  }, {} as Record<string, CatalogItem[]>);

  return {
    catalogs: catalogsQuery.data || [],
    catalogsByType,
    isLoading: catalogsQuery.isLoading,
    error: catalogsQuery.error,
    createCatalogItem,
    updateCatalogItem,
    deleteCatalogItem,
    toggleCatalogItem,
    refetch: catalogsQuery.refetch,
  };
}

// Hook to get catalog items for a specific type (for use in forms)
export function useCatalogOptions(catalogType: CatalogType) {
  const { authUser } = useAuth();

  return useQuery({
    queryKey: ['catalog-options', authUser?.tenant?.id, catalogType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_items')
        .select('id, code, name')
        .eq('catalog_type', catalogType)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Array<{ id: string; code: string; name: string }>;
    },
    enabled: !!authUser?.tenant?.id,
  });
}

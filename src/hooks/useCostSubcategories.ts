import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CostSubcategory {
  id: string;
  tenant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  is_active: boolean | null;
  display_order: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CostSubcategoryInsert {
  category_id: string;
  name: string;
  description?: string | null;
  is_active?: boolean | null;
  display_order?: number | null;
}

export function useCostSubcategories(categoryId?: string) {
  const { authUser } = useAuth();
  const tenantId = authUser?.profile?.tenant_id;
  const queryClient = useQueryClient();

  const subcategoriesQuery = useQuery({
    queryKey: ['cost-subcategories', tenantId, categoryId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      let query = supabase
        .from('cost_subcategories')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('display_order', { ascending: true });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CostSubcategory[];
    },
    enabled: !!tenantId,
  });

  const createSubcategory = useMutation({
    mutationFn: async (subcategory: CostSubcategoryInsert) => {
      if (!tenantId) throw new Error('No tenant ID');
      
      const { data, error } = await supabase
        .from('cost_subcategories')
        .insert({ ...subcategory, tenant_id: tenantId })
        .select()
        .single();

      if (error) throw error;
      return data as CostSubcategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-subcategories', tenantId] });
      toast.success('Subcategoría creada');
    },
    onError: (error) => {
      toast.error('Error al crear subcategoría: ' + error.message);
    },
  });

  const updateSubcategory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CostSubcategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('cost_subcategories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CostSubcategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-subcategories', tenantId] });
      toast.success('Subcategoría actualizada');
    },
    onError: (error) => {
      toast.error('Error al actualizar subcategoría: ' + error.message);
    },
  });

  const deleteSubcategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cost_subcategories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-subcategories', tenantId] });
      toast.success('Subcategoría eliminada');
    },
    onError: (error) => {
      toast.error('Error al eliminar subcategoría: ' + error.message);
    },
  });

  return {
    subcategories: subcategoriesQuery.data ?? [],
    isLoading: subcategoriesQuery.isLoading,
    error: subcategoriesQuery.error,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
  };
}

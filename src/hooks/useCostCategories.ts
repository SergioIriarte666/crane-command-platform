import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CostCategory {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  is_active: boolean | null;
  display_order: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CostCategoryInsert {
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  is_active?: boolean | null;
  display_order?: number | null;
}

export function useCostCategories() {
  const { authUser } = useAuth();
  const tenantId = authUser?.profile?.tenant_id;
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryKey: ['cost-categories', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from('cost_categories')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as CostCategory[];
    },
    enabled: !!tenantId,
  });

  const createCategory = useMutation({
    mutationFn: async (category: CostCategoryInsert) => {
      if (!tenantId) throw new Error('No tenant ID');
      
      const { data, error } = await supabase
        .from('cost_categories')
        .insert({ ...category, tenant_id: tenantId })
        .select()
        .single();

      if (error) throw error;
      return data as CostCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-categories', tenantId] });
      toast.success('Categoría creada');
    },
    onError: (error) => {
      toast.error('Error al crear categoría: ' + error.message);
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CostCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('cost_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CostCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-categories', tenantId] });
      toast.success('Categoría actualizada');
    },
    onError: (error) => {
      toast.error('Error al actualizar categoría: ' + error.message);
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cost_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-categories', tenantId] });
      toast.success('Categoría eliminada');
    },
    onError: (error) => {
      toast.error('Error al eliminar categoría: ' + error.message);
    },
  });

  return {
    categories: categoriesQuery.data ?? [],
    isLoading: categoriesQuery.isLoading,
    error: categoriesQuery.error,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

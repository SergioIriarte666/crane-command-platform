import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface CostCenter {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  budget_amount: number | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CostCenterInsert {
  code: string;
  name: string;
  description?: string | null;
  parent_id?: string | null;
  budget_amount?: number | null;
  is_active?: boolean | null;
}

export function useCostCenters() {
  const { authUser } = useAuth();
  const tenantId = authUser?.profile?.tenant_id;
  const queryClient = useQueryClient();

  const centersQuery = useQuery({
    queryKey: ['cost-centers', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from('cost_centers')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('code', { ascending: true });

      if (error) throw error;
      return data as CostCenter[];
    },
    enabled: !!tenantId,
  });

  const createCenter = useMutation({
    mutationFn: async (center: CostCenterInsert) => {
      if (!tenantId) throw new Error('No tenant ID');
      
      const { data, error } = await supabase
        .from('cost_centers')
        .insert({ ...center, tenant_id: tenantId })
        .select()
        .single();

      if (error) throw error;
      return data as CostCenter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers', tenantId] });
      toast.success('Centro de costo creado');
    },
    onError: (error) => {
      toast.error('Error al crear centro de costo: ' + error.message);
    },
  });

  const updateCenter = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CostCenter> & { id: string }) => {
      const { data, error } = await supabase
        .from('cost_centers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CostCenter;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers', tenantId] });
      toast.success('Centro de costo actualizado');
    },
    onError: (error) => {
      toast.error('Error al actualizar centro de costo: ' + error.message);
    },
  });

  const deleteCenter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cost_centers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers', tenantId] });
      toast.success('Centro de costo eliminado');
    },
    onError: (error) => {
      toast.error('Error al eliminar centro de costo: ' + error.message);
    },
  });

  return {
    centers: centersQuery.data ?? [],
    isLoading: centersQuery.isLoading,
    error: centersQuery.error,
    createCenter,
    updateCenter,
    deleteCenter,
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ServiceCost {
  id: string;
  service_id: string;
  category_id: string | null;
  description: string;
  amount: number;
  quantity: number | null;
  unit_price: number | null;
  subcategory: string | null;
  notes: string | null;
  cost_date: string | null;
}

export interface ServiceCostInsert {
  service_id: string;
  category_id?: string | null;
  description: string;
  amount: number;
  quantity?: number | null;
  unit_price?: number | null;
  subcategory?: string | null;
  notes?: string | null;
  cost_date?: string | null;
}

export function useServiceCosts(serviceId: string | null) {
  const { authUser } = useAuth();
  const tenantId = authUser?.tenant?.id;

  return useQuery({
    queryKey: ['service-costs', serviceId],
    queryFn: async (): Promise<ServiceCost[]> => {
      if (!serviceId) return [];

      const { data, error } = await supabase
        .from('service_costs')
        .select('id, service_id, category_id, description, amount, quantity, unit_price, subcategory, notes, cost_date')
        .eq('service_id', serviceId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!serviceId && !!tenantId,
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useAddServiceCost() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  const tenantId = authUser?.tenant?.id;

  return useMutation({
    mutationFn: async (costData: ServiceCostInsert) => {
      if (!tenantId) throw new Error('No tenant ID');

      const { data, error } = await supabase
        .from('service_costs')
        .insert({ ...costData, tenant_id: tenantId })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-costs', variables.service_id] });
    },
    onError: (error: Error) => {
      toast.error('Error al agregar costo: ' + error.message);
    },
  });
}

export function useUpdateServiceCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, service_id, ...costData }: Partial<ServiceCost> & { id: string; service_id: string }) => {
      const { data, error } = await supabase
        .from('service_costs')
        .update(costData)
        .eq('id', id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-costs', variables.service_id] });
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar costo: ' + error.message);
    },
  });
}

export function useDeleteServiceCost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, service_id }: { id: string; service_id: string }) => {
      const { error } = await supabase
        .from('service_costs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-costs', variables.service_id] });
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar costo: ' + error.message);
    },
  });
}

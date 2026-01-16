import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { CraneInsert, CraneUpdate, CraneWithOperator } from '@/types/fleet';

export function useCranes() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  const cranesQuery = useQuery<CraneWithOperator[]>({
    queryKey: ['cranes', authUser?.tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cranes')
        .select('*, assigned_operator:operators!fk_assigned_operator(id, full_name, employee_number)')
        .order('unit_number', { ascending: true });

      if (error) throw error;
      return data as CraneWithOperator[];
    },
    enabled: !!authUser?.tenant?.id,
  });

  const createCrane = useMutation({
    mutationFn: async (crane: Omit<CraneInsert, 'tenant_id'>) => {
      if (!authUser?.tenant?.id) throw new Error('No tenant');
      
      // Check plan limits
      if (authUser.tenant.max_cranes !== null) {
        const { count, error: countError } = await supabase
          .from('cranes')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', authUser.tenant.id);
          
        if (countError) throw countError;
        
        if (count !== null && count >= authUser.tenant.max_cranes) {
          throw new Error(`Has alcanzado el límite de grúas de tu plan (${authUser.tenant.max_cranes}). Contacta a soporte para aumentar tu plan.`);
        }
      }
      
      const { data, error } = await supabase
        .from('cranes')
        .insert({
          ...crane,
          tenant_id: authUser.tenant.id,
          created_by: authUser.profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cranes'] });
      toast.success('Grúa creada exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al crear grúa: ${error.message}`);
    },
  });

  const updateCrane = useMutation({
    mutationFn: async ({ id, ...updates }: CraneUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('cranes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cranes'] });
      toast.success('Grúa actualizada exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al actualizar grúa: ${error.message}`);
    },
  });

  const deleteCrane = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cranes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cranes'] });
      toast.success('Grúa eliminada exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al eliminar grúa: ${error.message}`);
    },
  });

  const generateUnitNumber = async (): Promise<string> => {
    if (!authUser?.tenant?.id) return 'GRU-001';
    
    const { data, error } = await supabase
      .rpc('generate_crane_unit_number', { _tenant_id: authUser.tenant.id });

    if (error) throw error;
    return data;
  };

  return {
    cranes: cranesQuery.data || [],
    isLoading: cranesQuery.isLoading,
    error: cranesQuery.error,
    createCrane,
    updateCrane,
    deleteCrane,
    generateUnitNumber,
    refetch: cranesQuery.refetch,
  };
}

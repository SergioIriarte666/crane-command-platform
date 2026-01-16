import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { OperatorInsert, OperatorUpdate, OperatorWithCrane } from '@/types/operators';

export function useOperators() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  const operatorsQuery = useQuery<OperatorWithCrane[]>({
    queryKey: ['operators', authUser?.tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operators')
        .select('*, assigned_crane:cranes!fk_assigned_crane(id, unit_number, type, brand, model)')
        .order('employee_number', { ascending: true });

      if (error) throw error;
      return data as OperatorWithCrane[];
    },
    enabled: !!authUser?.tenant?.id,
  });

  const createOperator = useMutation({
    mutationFn: async (operator: Omit<OperatorInsert, 'tenant_id'>) => {
      if (!authUser?.tenant?.id) throw new Error('No tenant');
      
      // Check plan limits
      if (authUser.tenant.max_operators !== null) {
        const { count, error: countError } = await supabase
          .from('operators')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', authUser.tenant.id);
          
        if (countError) throw countError;
        
        if (count !== null && count >= authUser.tenant.max_operators) {
          throw new Error(`Has alcanzado el límite de operadores de tu plan (${authUser.tenant.max_operators}). Contacta a soporte para aumentar tu plan.`);
        }
      }

      const { data, error } = await supabase
        .from('operators')
        .insert({
          ...operator,
          tenant_id: authUser.tenant.id,
          created_by: authUser.profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] });
      toast.success('Operador creado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al crear operador: ${error.message}`);
    },
  });

  const updateOperator = useMutation({
    mutationFn: async ({ id, ...updates }: OperatorUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('operators')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] });
      toast.success('Operador actualizado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al actualizar operador: ${error.message}`);
    },
  });

  const deleteOperator = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('operators')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] });
      toast.success('Operador eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al eliminar operador: ${error.message}`);
    },
  });

  const generateEmployeeNumber = async (): Promise<string> => {
    if (!authUser?.tenant?.id) return 'EMP-001';
    
    const { data, error } = await supabase
      .rpc('generate_employee_number', { _tenant_id: authUser.tenant.id });

    if (error) throw error;
    return data;
  };

  return {
    operators: operatorsQuery.data || [],
    isLoading: operatorsQuery.isLoading,
    error: operatorsQuery.error,
    createOperator,
    updateOperator,
    deleteOperator,
    generateEmployeeNumber,
    refetch: operatorsQuery.refetch,
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { SupplierInsert, SupplierUpdate } from '@/types/suppliers';

export function useSuppliers() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  const suppliersQuery = useQuery({
    queryKey: ['suppliers', authUser?.tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('code', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!authUser?.tenant?.id,
  });

  const createSupplier = useMutation({
    mutationFn: async (supplier: Omit<SupplierInsert, 'tenant_id'>) => {
      if (!authUser?.tenant?.id) throw new Error('No tenant');
      
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          ...supplier,
          tenant_id: authUser.tenant.id,
          created_by: authUser?.profile?.id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Proveedor creado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al crear proveedor: ${error.message}`);
    },
  });

  const updateSupplier = useMutation({
    mutationFn: async ({ id, ...updates }: SupplierUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Proveedor actualizado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al actualizar proveedor: ${error.message}`);
    },
  });

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Proveedor eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al eliminar proveedor: ${error.message}`);
    },
  });

  const generateCode = async (): Promise<string> => {
    if (!authUser?.tenant?.id) return 'PRV-0001';
    
    const { data, error } = await supabase
      .rpc('generate_supplier_code', { _tenant_id: authUser.tenant.id });

    if (error) throw error;
    return data;
  };

  return {
    suppliers: suppliersQuery.data || [],
    isLoading: suppliersQuery.isLoading,
    error: suppliersQuery.error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    generateCode,
    refetch: suppliersQuery.refetch,
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { PaymentInsert, PaymentStatus } from '@/types/finance';

export function usePayments() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  const paymentsQuery = useQuery({
    queryKey: ['payments', authUser?.tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          client:clients(id, name, code),
          invoice:invoices(id, folio, total, status)
        `)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!authUser?.tenant?.id,
  });

  const createPayment = useMutation({
    mutationFn: async (payment: Omit<PaymentInsert, 'tenant_id'>) => {
      if (!authUser?.tenant?.id) throw new Error('No tenant');

      const { data, error } = await supabase
        .from('payments')
        .insert({
          ...payment,
          tenant_id: authUser.tenant.id,
          created_by: authUser?.profile?.id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['pending-payments-reconciliation'] });
      toast.success('Pago registrado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al registrar pago: ${error.message}`);
    },
  });

  const confirmPayment = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('payments')
        .update({
          status: 'confirmed' as PaymentStatus,
          confirmed_at: new Date().toISOString(),
          confirmed_by: authUser?.profile?.id ?? null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['pending-payments-reconciliation'] });
      queryClient.invalidateQueries({ queryKey: ['closures'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Pago confirmado');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const rejectPayment = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('payments')
        .update({ status: 'rejected' as PaymentStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Pago rechazado');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deletePayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Pago eliminado');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const metrics = {
    total: paymentsQuery.data?.length || 0,
    pending: paymentsQuery.data?.filter(p => p.status === 'pending').length || 0,
    confirmed: paymentsQuery.data?.filter(p => p.status === 'confirmed').length || 0,
    totalAmount: paymentsQuery.data
      ?.filter(p => p.status === 'confirmed')
      .reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
  };

  return {
    payments: paymentsQuery.data || [],
    metrics,
    isLoading: paymentsQuery.isLoading,
    error: paymentsQuery.error,
    createPayment,
    confirmPayment,
    rejectPayment,
    deletePayment,
    refetch: paymentsQuery.refetch,
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { BankTransactionInsert, ReconciliationStatus } from '@/types/finance';

export function useReconciliation() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery({
    queryKey: ['bank-transactions', authUser?.tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_transactions')
        .select(`
          *,
          matched_payment:payments!bank_transactions_matched_payment_id_fkey(id, amount, payment_date, client:clients(name))
        `)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!authUser?.tenant?.id,
  });

  const pendingPaymentsQuery = useQuery({
    queryKey: ['pending-payments-reconciliation', authUser?.tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          client:clients(id, name),
          invoice:invoices(id, folio)
        `)
        .eq('status', 'pending')
        .is('reconciliation_id', null)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!authUser?.tenant?.id,
  });

  const importTransactions = useMutation({
    mutationFn: async (transactions: Omit<BankTransactionInsert, 'tenant_id'>[]) => {
      if (!authUser?.tenant?.id) throw new Error('No tenant');

      const batch = new Date().toISOString();
      const records = transactions.map(t => ({
        ...t,
        tenant_id: authUser.tenant.id,
        import_batch: batch,
      }));

      const { data, error } = await supabase
        .from('bank_transactions')
        .insert(records)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      toast.success(`${data.length} transacciones importadas`);
    },
    onError: (error) => {
      toast.error(`Error al importar: ${error.message}`);
    },
  });

  const matchTransaction = useMutation({
    mutationFn: async ({ transactionId, paymentId }: { transactionId: string; paymentId: string }) => {
      // Update bank transaction
      const { error: txError } = await supabase
        .from('bank_transactions')
        .update({
          status: 'matched' as ReconciliationStatus,
          matched_payment_id: paymentId,
          matched_at: new Date().toISOString(),
          matched_by: authUser?.profile.id,
        })
        .eq('id', transactionId);

      if (txError) throw txError;

      // Update payment
      const { error: payError } = await supabase
        .from('payments')
        .update({
          reconciliation_id: transactionId,
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: authUser?.profile.id,
        })
        .eq('id', paymentId);

      if (payError) throw payError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-payments-reconciliation'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['closures'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Transacción conciliada');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const confirmPaymentDirectly = useMutation({
    mutationFn: async (paymentId: string) => {
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: authUser?.profile.id,
        })
        .eq('id', paymentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-payments-reconciliation'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['closures'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Pago confirmado');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const unmatchTransaction = useMutation({
    mutationFn: async (transactionId: string) => {
      // Get current transaction
      const { data: tx, error: getError } = await supabase
        .from('bank_transactions')
        .select('matched_payment_id')
        .eq('id', transactionId)
        .single();

      if (getError) throw getError;

      // Update bank transaction
      const { error: txError } = await supabase
        .from('bank_transactions')
        .update({
          status: 'pending' as ReconciliationStatus,
          matched_payment_id: null,
          matched_at: null,
          matched_by: null,
        })
        .eq('id', transactionId);

      if (txError) throw txError;

      // Update payment if exists
      if (tx.matched_payment_id) {
        await supabase
          .from('payments')
          .update({
            reconciliation_id: null,
            status: 'pending',
            confirmed_at: null,
            confirmed_by: null,
          })
          .eq('id', tx.matched_payment_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['pending-payments-reconciliation'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['closures'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Conciliación deshecha');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const markAsUnmatched = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { error } = await supabase
        .from('bank_transactions')
        .update({
          status: 'unmatched' as ReconciliationStatus,
          notes,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      toast.success('Marcado como sin coincidencia');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bank_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      toast.success('Transacción eliminada');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const metrics = {
    total: transactionsQuery.data?.length || 0,
    pending: transactionsQuery.data?.filter(t => t.status === 'pending').length || 0,
    matched: transactionsQuery.data?.filter(t => t.status === 'matched').length || 0,
    unmatched: transactionsQuery.data?.filter(t => t.status === 'unmatched').length || 0,
    pendingAmount: transactionsQuery.data
      ?.filter(t => t.status === 'pending' && t.is_credit)
      .reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
  };

  return {
    transactions: transactionsQuery.data || [],
    pendingPayments: pendingPaymentsQuery.data || [],
    metrics,
    isLoading: transactionsQuery.isLoading,
    error: transactionsQuery.error,
    importTransactions,
    matchTransaction,
    unmatchTransaction,
    confirmPaymentDirectly,
    markAsUnmatched,
    deleteTransaction,
    refetch: transactionsQuery.refetch,
  };
}

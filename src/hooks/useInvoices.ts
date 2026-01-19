import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { InvoiceInsert, InvoiceUpdate, InvoiceStatus } from '@/types/finance';
import type { Database } from '@/integrations/supabase/types';

type InvoiceRow = Database['public']['Tables']['invoices']['Row'];
type ClientRow = Database['public']['Tables']['clients']['Row'];

export type InvoiceWithRelations = InvoiceRow & {
  client: Pick<ClientRow, 'id' | 'name' | 'code' | 'tax_id'> | null;
  billing_closure: { id: string; folio: string } | null;
};

export function useInvoices() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  const invoicesQuery = useQuery({
    queryKey: ['invoices', authUser?.tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(id, name, code, tax_id),
          billing_closure:billing_closures!invoices_billing_closure_id_fkey(id, folio)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InvoiceWithRelations[];
    },
    enabled: !!authUser?.tenant?.id,
  });

  const createInvoice = useMutation({
    mutationFn: async (invoice: Omit<InvoiceInsert, 'tenant_id' | 'folio'>) => {
      if (!authUser?.tenant?.id) throw new Error('No tenant');

      const { data: folio, error: folioError } = await supabase
        .rpc('generate_invoice_folio', { _tenant_id: authUser.tenant.id });

      if (folioError) throw folioError;

      const { data, error } = await supabase
        .from('invoices')
        .insert({
          ...invoice,
          folio,
          tenant_id: authUser.tenant.id,
          created_by: authUser?.profile?.id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Factura creada exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al crear factura: ${error.message}`);
    },
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, ...updates }: InvoiceUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Factura actualizada');
    },
    onError: (error) => {
      toast.error(`Error al actualizar: ${error.message}`);
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InvoiceStatus }) => {
      const updates: any = { status };
      
      if (status === 'sent') updates.sent_at = new Date().toISOString();
      if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();
      if (status === 'paid') updates.paid_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Estado actualizado');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Factura eliminada');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Calculate metrics
  const metrics = {
    total: invoicesQuery.data?.length || 0,
    pending: invoicesQuery.data?.filter(i => i.status === 'pending' || i.status === 'sent').length || 0,
    overdue: invoicesQuery.data?.filter(i => i.status === 'overdue').length || 0,
    totalPending: invoicesQuery.data
      ?.filter(i => ['pending', 'sent', 'partial', 'overdue'].includes(i.status))
      .reduce((sum, i) => sum + (i.balance_due || 0), 0) || 0,
    totalPaid: invoicesQuery.data
      ?.filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + (i.total || 0), 0) || 0,
  };

  return {
    invoices: invoicesQuery.data || [],
    metrics,
    isLoading: invoicesQuery.isLoading,
    error: invoicesQuery.error,
    createInvoice,
    updateInvoice,
    updateStatus,
    deleteInvoice,
    refetch: invoicesQuery.refetch,
  };
}

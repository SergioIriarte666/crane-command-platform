import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { BillingClosureInsert, BillingClosureUpdate, ClosureStatus } from '@/types/finance';

// Separate hook for fetching closure services
export function useClosureServices(closureId: string | null) {
  return useQuery({
    queryKey: ['closure-services', closureId],
    queryFn: async () => {
      if (!closureId) return [];
      const { data, error } = await supabase
        .from('billing_closure_services')
        .select('*')
        .eq('closure_id', closureId)
        .order('service_date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!closureId,
  });
}

export function useClosures() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  const closuresQuery = useQuery({
    queryKey: ['closures', authUser?.tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_closures')
        .select(`
          *,
          client:clients(id, name, code),
          invoice:invoices!billing_closures_invoice_id_fkey(id, folio, status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!authUser?.tenant?.id,
  });

  const createClosure = useMutation({
    mutationFn: async (closure: Omit<BillingClosureInsert, 'tenant_id' | 'folio'>) => {
      if (!authUser?.tenant?.id) throw new Error('No tenant');

      const { data: folio, error: folioError } = await supabase
        .rpc('generate_closure_folio', { _tenant_id: authUser.tenant.id });

      if (folioError) throw folioError;

      const { data, error } = await supabase
        .from('billing_closures')
        .insert({
          ...closure,
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
      queryClient.invalidateQueries({ queryKey: ['closures'] });
      toast.success('Cierre creado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al crear cierre: ${error.message}`);
    },
  });

  const updateClosure = useMutation({
    mutationFn: async ({ id, ...updates }: BillingClosureUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('billing_closures')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closures'] });
      toast.success('Cierre actualizado');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ClosureStatus }) => {
      const updates: any = { status };

      if (status === 'approved') {
        updates.approved_at = new Date().toISOString();
        updates.approved_by = authUser?.profile?.id ?? null;
      }

      const { data, error } = await supabase
        .from('billing_closures')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closures'] });
      toast.success('Estado actualizado');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const addServicesToClosure = useMutation({
    mutationFn: async ({ closureId, serviceIds }: { closureId: string; serviceIds: string[] }) => {
      // Get services data
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .in('id', serviceIds);

      if (servicesError) throw servicesError;

      // Create closure service records
      const closureServices = services.map(s => ({
        closure_id: closureId,
        service_id: s.id,
        service_folio: s.folio,
        service_date: s.scheduled_date,
        service_type: s.type,
        vehicle_info: `${s.vehicle_brand || ''} ${s.vehicle_model || ''} ${s.vehicle_plates || ''}`.trim(),
        origin_destination: `${s.origin_city || ''} → ${s.destination_city || ''}`.trim(),
        subtotal: s.subtotal || 0,
        total: s.total || 0,
      }));

      const { error } = await supabase
        .from('billing_closure_services')
        .insert(closureServices);

      if (error) throw error;

      // Update closure totals
      const total = services.reduce((sum, s) => sum + (s.total || 0), 0);
      const subtotal = services.reduce((sum, s) => sum + (s.subtotal || 0), 0);
      const taxAmount = services.reduce((sum, s) => sum + (s.tax_amount || 0), 0);

      await supabase
        .from('billing_closures')
        .update({
          services_count: services.length,
          subtotal,
          tax_amount: taxAmount,
          total,
        })
        .eq('id', closureId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closures'] });
      queryClient.invalidateQueries({ queryKey: ['closure-services'] });
      toast.success('Servicios agregados al cierre');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteClosure = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('billing_closures')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closures'] });
      toast.success('Cierre eliminado');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Metrics by status
  const closuresByStatus = closuresQuery.data?.reduce((acc, closure) => {
    const status = closure.status as ClosureStatus;
    if (!acc[status]) acc[status] = [];
    acc[status].push(closure);
    return acc;
  }, {} as Record<ClosureStatus, typeof closuresQuery.data>) || {};

  const metrics = {
    total: closuresQuery.data?.length || 0,
    byStatus: Object.entries(closuresByStatus).map(([status, closures]) => ({
      status: status as ClosureStatus,
      count: (closures as any[]).length,
      total: (closures as any[]).reduce((sum: number, c: any) => sum + (c.total || 0), 0),
    })),
    pendingApproval: closuresQuery.data?.filter(c => 
      ['review', 'client_review'].includes(c.status)
    ).length || 0,
  };

  return {
    closures: closuresQuery.data || [],
    closuresByStatus,
    metrics,
    isLoading: closuresQuery.isLoading,
    error: closuresQuery.error,
    createClosure,
    updateClosure,
    updateStatus,
    addServicesToClosure,
    deleteClosure,
    refetch: closuresQuery.refetch,
  };
}

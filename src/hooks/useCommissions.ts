import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { CommissionInsert, CommissionStatus } from '@/types/finance';

export function useCommissions() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  const commissionsQuery = useQuery({
    queryKey: ['commissions', authUser?.tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commissions')
        .select(`
          *,
          operator:operators(id, full_name, employee_number, commission_type, commission_percentage, commission_fixed_amount)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!authUser?.tenant?.id,
  });

  const generateCommission = useMutation({
    mutationFn: async ({ 
      operatorId, 
      periodStart, 
      periodEnd 
    }: { 
      operatorId: string; 
      periodStart: string; 
      periodEnd: string;
    }) => {
      if (!authUser?.tenant?.id) throw new Error('No tenant');

      // Get operator info
      const { data: operator, error: opError } = await supabase
        .from('operators')
        .select('*')
        .eq('id', operatorId)
        .single();

      if (opError) throw opError;

      // Get completed services in the period (tenant scoped)
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, folio, scheduled_date, subtotal, total')
        .eq('tenant_id', authUser.tenant.id)
        .eq('status', 'completed')
        .gte('scheduled_date', periodStart)
        .lte('scheduled_date', periodEnd);

      if (servicesError) throw servicesError;

      const serviceIds = (services || []).map((s) => s.id);
      if (serviceIds.length === 0) {
        throw new Error('No hay servicios completados en el período seleccionado');
      }

      // Get service_operators rows for this operator and those services
      const { data: serviceOps, error: serviceOpsError } = await supabase
        .from('service_operators')
        .select('service_id, commission')
        .eq('tenant_id', authUser.tenant.id)
        .eq('operator_id', operatorId)
        .in('service_id', serviceIds);

      if (serviceOpsError) throw serviceOpsError;

      const commissionByService = new Map<string, number>();
      (serviceOps || []).forEach((so: any) => {
        const prev = commissionByService.get(so.service_id) || 0;
        commissionByService.set(so.service_id, prev + Number(so.commission || 0));
      });

      const servicesWithCommission = (services || []).filter((s: any) => commissionByService.has(s.id));
      const servicesCount = servicesWithCommission.length;
      const totalServicesValue = servicesWithCommission.reduce(
        (sum: number, s: any) => sum + Number(s.subtotal ?? s.total ?? 0),
        0
      );

      // Calculate commission based on service_operators.commission (manual per service)
      const calculatedAmount = Array.from(commissionByService.values()).reduce((sum, v) => sum + v, 0);

      // Keep operator settings for record
      const commissionType = operator.commission_type || 'percentage';
      const commissionPercentage = operator.commission_percentage || 0;
      const commissionFixed = operator.commission_fixed_amount || 0;

      // Create commission record
      const { data: commission, error } = await supabase
        .from('commissions')
        .insert({
          tenant_id: authUser.tenant.id,
          operator_id: operatorId,
          period_start: periodStart,
          period_end: periodEnd,
          services_count: servicesCount,
          total_services_value: totalServicesValue,
          commission_type: commissionType,
          commission_percentage: commissionPercentage,
          commission_fixed: commissionFixed,
          calculated_amount: calculatedAmount,
          total_amount: calculatedAmount,
          created_by: authUser?.profile?.id ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      // Add commission services (per-service commission comes from service_operators)
      if (servicesWithCommission && servicesWithCommission.length > 0) {
        const commissionServices = servicesWithCommission.map((s: any) => ({
          commission_id: commission.id,
          service_id: s.id,
          service_folio: s.folio,
          service_date: s.scheduled_date,
          service_total: Number(s.subtotal ?? s.total ?? 0),
          commission_amount: commissionByService.get(s.id) || 0,
        }));

        await supabase.from('commission_services').insert(commissionServices);
      }

      return commission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toast.success('Comisión generada exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al generar comisión: ${error.message}`);
    },
  });

  const updateCommission = useMutation({
    mutationFn: async ({ 
      id, 
      bonus = 0, 
      deductions = 0, 
      adjustment_notes 
    }: { 
      id: string; 
      bonus?: number; 
      deductions?: number; 
      adjustment_notes?: string;
    }) => {
      // Get current commission
      const { data: commission, error: getError } = await supabase
        .from('commissions')
        .select('calculated_amount')
        .eq('id', id)
        .single();

      if (getError) throw getError;

      const totalAmount = (commission.calculated_amount || 0) + bonus - deductions;

      const { data, error } = await supabase
        .from('commissions')
        .update({
          bonus,
          deductions,
          adjustment_notes,
          total_amount: totalAmount,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toast.success('Comisión actualizada');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const approveCommission = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('commissions')
        .update({
          status: 'approved' as CommissionStatus,
          approved_at: new Date().toISOString(),
          approved_by: authUser?.profile?.id ?? null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toast.success('Comisión aprobada');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const markAsPaid = useMutation({
    mutationFn: async ({ id, paymentReference }: { id: string; paymentReference?: string }) => {
      const { data, error } = await supabase
        .from('commissions')
        .update({
          status: 'paid' as CommissionStatus,
          paid_at: new Date().toISOString(),
          payment_reference: paymentReference,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toast.success('Comisión marcada como pagada');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteCommission = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('commissions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      toast.success('Comisión eliminada');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const metrics = {
    total: commissionsQuery.data?.length || 0,
    pending: commissionsQuery.data?.filter(c => c.status === 'pending').length || 0,
    approved: commissionsQuery.data?.filter(c => c.status === 'approved').length || 0,
    totalPending: commissionsQuery.data
      ?.filter(c => ['pending', 'approved'].includes(c.status))
      .reduce((sum, c) => sum + (c.total_amount || 0), 0) || 0,
    totalPaid: commissionsQuery.data
      ?.filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + (c.total_amount || 0), 0) || 0,
  };

  return {
    commissions: commissionsQuery.data || [],
    metrics,
    isLoading: commissionsQuery.isLoading,
    error: commissionsQuery.error,
    generateCommission,
    updateCommission,
    approveCommission,
    markAsPaid,
    deleteCommission,
    refetch: commissionsQuery.refetch,
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CostInsert, CostUpdate, CostWithRelations, CostStatus, CostCategory } from '@/types/costs';

export interface CostFilters {
  search?: string;
  status?: CostStatus | 'all';
  category?: CostCategory | 'all';
  dateFrom?: string;
  dateTo?: string;
}

export function useCosts(filters?: CostFilters) {
  const { authUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['costs', authUser?.tenant?.id, filters],
    queryFn: async () => {
      let queryBuilder = supabase
        .from('costs')
        .select(`
          *,
          service:services!costs_service_id_fkey(id, folio),
          crane:cranes!costs_crane_id_fkey(id, unit_number),
          operator:operators!costs_operator_id_fkey(id, full_name),
          supplier:suppliers!costs_supplier_id_fkey(id, name)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.search) {
        queryBuilder = queryBuilder.or(`code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters?.status && filters.status !== 'all') {
        queryBuilder = queryBuilder.eq('status', filters.status);
      }
      if (filters?.category && filters.category !== 'all') {
        queryBuilder = queryBuilder.eq('category', filters.category);
      }
      if (filters?.dateFrom) {
        queryBuilder = queryBuilder.gte('cost_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        queryBuilder = queryBuilder.lte('cost_date', filters.dateTo);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      return data as CostWithRelations[];
    },
    enabled: !!authUser?.tenant?.id,
  });

  const createCost = useMutation({
    mutationFn: async (cost: Omit<CostInsert, 'tenant_id'>) => {
      if (!authUser?.tenant?.id) throw new Error('No se encontró el tenant del usuario');

      const { data, error } = await supabase
        .from('costs')
        .insert({
          ...cost,
          tenant_id: authUser.tenant.id,
          created_by: authUser?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      toast({ title: 'Costo creado', description: 'El costo se ha registrado correctamente.' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error al crear costo', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const updateCost = useMutation({
    mutationFn: async ({ id, ...cost }: CostUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('costs')
        .update(cost)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      toast({ title: 'Costo actualizado', description: 'Los cambios se han guardado correctamente.' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error al actualizar', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const deleteCost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('costs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      toast({ title: 'Costo eliminado', description: 'El registro se ha eliminado correctamente.' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error al eliminar', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const approveCost = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('costs')
        .update({
          status: 'approved' as CostStatus,
          approved_at: new Date().toISOString(),
          approved_by: authUser?.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      toast({ title: 'Costo aprobado', description: 'El costo ha sido aprobado.' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error al aprobar', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const rejectCost = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data, error } = await supabase
        .from('costs')
        .update({
          status: 'rejected' as CostStatus,
          rejected_at: new Date().toISOString(),
          rejected_by: authUser?.id,
          rejection_reason: reason,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      toast({ title: 'Costo rechazado', description: 'El costo ha sido rechazado.' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error al rechazar', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const submitForApproval = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('costs')
        .update({ status: 'pending_approval' as CostStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costs'] });
      toast({ title: 'Enviado a aprobación', description: 'El costo está pendiente de aprobación.' });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  return {
    costs: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createCost,
    updateCost,
    deleteCost,
    approveCost,
    rejectCost,
    submitForApproval,
  };
}

export function useCost(id: string | undefined) {
  const { authUser } = useAuth();

  return useQuery({
    queryKey: ['cost', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('costs')
        .select(`
          *,
          service:services!costs_service_id_fkey(id, folio),
          crane:cranes!costs_crane_id_fkey(id, unit_number),
          operator:operators!costs_operator_id_fkey(id, full_name),
          supplier:suppliers!costs_supplier_id_fkey(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as CostWithRelations;
    },
    enabled: !!id && !!authUser?.tenant?.id,
  });
}

// Hook para estadísticas de costos
export function useCostStats(dateFrom?: string, dateTo?: string) {
  const { authUser } = useAuth();

  return useQuery({
    queryKey: ['cost-stats', authUser?.tenant?.id, dateFrom, dateTo],
    queryFn: async () => {
      let queryBuilder = supabase
        .from('costs')
        .select('category, status, total, cost_date');

      if (dateFrom) {
        queryBuilder = queryBuilder.gte('cost_date', dateFrom);
      }
      if (dateTo) {
        queryBuilder = queryBuilder.lte('cost_date', dateTo);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      // Calculate stats
      const costs = data || [];
      const totalCosts = costs.reduce((sum, c) => sum + (Number(c.total) || 0), 0);
      const approvedCosts = costs.filter(c => c.status === 'approved');
      const pendingCosts = costs.filter(c => c.status === 'pending_approval');
      
      // By category
      const byCategory = costs.reduce((acc, c) => {
        const cat = c.category;
        if (!acc[cat]) acc[cat] = { count: 0, total: 0 };
        acc[cat].count += 1;
        acc[cat].total += Number(c.total) || 0;
        return acc;
      }, {} as Record<string, { count: number; total: number }>);

      // By status
      const byStatus = costs.reduce((acc, c) => {
        const status = c.status;
        if (!acc[status]) acc[status] = { count: 0, total: 0 };
        acc[status].count += 1;
        acc[status].total += Number(c.total) || 0;
        return acc;
      }, {} as Record<string, { count: number; total: number }>);

      return {
        totalCosts: Math.round(totalCosts * 100) / 100,
        totalCount: costs.length,
        approvedTotal: approvedCosts.reduce((sum, c) => sum + (Number(c.total) || 0), 0),
        approvedCount: approvedCosts.length,
        pendingTotal: pendingCosts.reduce((sum, c) => sum + (Number(c.total) || 0), 0),
        pendingCount: pendingCosts.length,
        byCategory,
        byStatus,
      };
    },
    enabled: !!authUser?.tenant?.id,
  });
}

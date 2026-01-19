import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ServiceCostLedgerFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ServiceCostLedgerRow {
  id: string;
  tenant_id: string;
  service_id: string;
  description: string;
  amount: number;
  quantity: number | null;
  unit_price: number | null;
  category_id: string | null;
  subcategory: string | null;
  notes: string | null;
  cost_date: string | null;
  created_at: string | null;
  service?: {
    id: string;
    folio: string;
    scheduled_date: string | null;
    status: string;
    client?: { name: string } | null;
  } | null;
}

export function useServiceCostsLedger(filters?: ServiceCostLedgerFilters) {
  const { authUser } = useAuth();
  const tenantId = authUser?.tenant?.id || authUser?.profile?.tenant_id;

  const query = useQuery({
    queryKey: ['service-costs-ledger', tenantId, filters],
    queryFn: async (): Promise<ServiceCostLedgerRow[]> => {
      if (!tenantId) return [];

      let qb = supabase
        .from('service_costs')
        .select(
          `
          id,
          tenant_id,
          service_id,
          description,
          amount,
          quantity,
          unit_price,
          category_id,
          subcategory,
          notes,
          cost_date,
          created_at,
          service:services!service_costs_service_id_fkey(
            id,
            folio,
            scheduled_date,
            status,
            client:clients!services_client_id_fkey(name)
          )
        `
        )
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (filters?.dateFrom) qb = qb.gte('cost_date', filters.dateFrom);
      if (filters?.dateTo) qb = qb.lte('cost_date', filters.dateTo);
      if (filters?.search?.trim()) qb = qb.ilike('description', `%${filters.search.trim()}%`);

      const { data, error } = await qb;
      if (error) throw error;
      return (data || []) as ServiceCostLedgerRow[];
    },
    enabled: !!tenantId,
  });

  const totalAmount = (query.data || []).reduce((sum, r) => sum + Number(r.amount || 0), 0);

  return {
    rows: query.data || [],
    metrics: {
      total: query.data?.length || 0,
      totalAmount,
    },
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

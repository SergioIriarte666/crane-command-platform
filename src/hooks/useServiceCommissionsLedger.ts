import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ServiceCommissionLedgerFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ServiceCommissionLedgerRow {
  id: string;
  tenant_id: string;
  service_id: string;
  operator_id: string;
  role: string | null;
  commission: number | null;
  created_at: string | null;
  operator?: {
    id: string;
    full_name: string;
    employee_number: string;
  } | null;
  service?: {
    id: string;
    folio: string;
    scheduled_date: string | null;
    status: string;
    client?: { name: string } | null;
  } | null;
}

export function useServiceCommissionsLedger(filters?: ServiceCommissionLedgerFilters) {
  const { authUser } = useAuth();
  const tenantId = authUser?.tenant?.id || authUser?.profile?.tenant_id;

  const query = useQuery({
    queryKey: ['service-commissions-ledger', tenantId, filters],
    queryFn: async (): Promise<ServiceCommissionLedgerRow[]> => {
      if (!tenantId) return [];

      const qb = supabase
        .from('service_operators')
        .select(
          `
          id,
          tenant_id,
          service_id,
          operator_id,
          role,
          commission,
          created_at,
          operator:operators(id, full_name, employee_number),
          service:services!service_operators_service_id_fkey(
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
      // Date filters on nested fields not supported; filter client-side after fetch.

      const { data, error } = await qb;
      if (error) throw error;

      const rows = (data || []) as ServiceCommissionLedgerRow[];
      if (!filters?.search?.trim()) return rows;

      const s = filters.search.trim().toLowerCase();
      return rows.filter((r) => {
        const op = r.operator?.full_name?.toLowerCase() || '';
        const emp = r.operator?.employee_number?.toLowerCase() || '';
        const folio = r.service?.folio?.toLowerCase() || '';
        const client = r.service?.client?.name?.toLowerCase() || '';
        const role = r.role?.toLowerCase() || '';
        return op.includes(s) || emp.includes(s) || folio.includes(s) || client.includes(s) || role.includes(s);
      });
    },
    enabled: !!tenantId,
  });

  const totalAmount = (query.data || []).reduce((sum, r) => sum + Number(r.commission || 0), 0);

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

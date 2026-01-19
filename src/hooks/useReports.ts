import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, endOfMonth, subMonths, format, eachDayOfInterval, eachMonthOfInterval, parseISO } from 'date-fns';

export interface DateRange {
  from: Date;
  to: Date;
}

export function useServicesReport(dateRange: DateRange) {
  const { authUser } = useAuth();

  return useQuery({
    queryKey: ['report-services', authUser?.tenant?.id, dateRange.from, dateRange.to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select(`
          id, folio, status, type, total, scheduled_date, created_at,
          origin_address, destination_address,
          client:clients!services_client_id_fkey(id, name),
          operator:operators(id, full_name),
          crane:cranes(id, unit_number)
        `)
        .gte('scheduled_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!authUser?.tenant?.id,
  });
}

export function useRevenueReport(dateRange: DateRange) {
  const { authUser } = useAuth();

  return useQuery({
    queryKey: ['report-revenue', authUser?.tenant?.id, dateRange.from, dateRange.to],
    queryFn: async () => {
      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('id, folio, status, total, balance_due, issue_date, due_date, client:clients(id, name)')
        .gte('issue_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('issue_date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('issue_date', { ascending: true });

      if (invError) throw invError;

      const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('id, amount, payment_date, status, payment_method, client:clients(id, name)')
        .eq('status', 'confirmed')
        .gte('payment_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('payment_date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('payment_date', { ascending: true });

      if (payError) throw payError;

      return { invoices: invoices || [], payments: payments || [] };
    },
    enabled: !!authUser?.tenant?.id,
  });
}

export function useClientsReport(dateRange: DateRange) {
  const { authUser } = useAuth();

  return useQuery({
    queryKey: ['report-clients', authUser?.tenant?.id, dateRange.from, dateRange.to],
    queryFn: async () => {
      const { data: services, error } = await supabase
        .from('services')
        .select('id, client_id, total, status, scheduled_date, client:clients!services_client_id_fkey(id, name, code, type)')
        .gte('scheduled_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(dateRange.to, 'yyyy-MM-dd'));

      if (error) throw error;

      // Group by client
      const clientMap = new Map<string, { 
        client: any; 
        servicesCount: number; 
        completedCount: number;
        totalRevenue: number;
      }>();

      (services || []).forEach(s => {
        if (!s.client_id || !s.client) return;
        const existing = clientMap.get(s.client_id) || {
          client: s.client,
          servicesCount: 0,
          completedCount: 0,
          totalRevenue: 0,
        };
        existing.servicesCount++;
        if (s.status === 'completed' || s.status === 'invoiced') {
          existing.completedCount++;
          existing.totalRevenue += s.total || 0;
        }
        clientMap.set(s.client_id, existing);
      });

      return Array.from(clientMap.values())
        .sort((a, b) => b.totalRevenue - a.totalRevenue);
    },
    enabled: !!authUser?.tenant?.id,
  });
}

export function useOperatorsReport(dateRange: DateRange) {
  const { authUser } = useAuth();

  return useQuery({
    queryKey: ['report-operators', authUser?.tenant?.id, dateRange.from, dateRange.to],
    queryFn: async () => {
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, operator_id, total, status, scheduled_date, operator:operators(id, full_name, employee_number)')
        .gte('scheduled_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(dateRange.to, 'yyyy-MM-dd'));

      if (servicesError) throw servicesError;

      const { data: commissions, error: commError } = await supabase
        .from('commissions')
        .select('id, operator_id, total_amount, status, period_start, period_end')
        .gte('period_start', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('period_end', format(dateRange.to, 'yyyy-MM-dd'));

      if (commError) throw commError;

      // Group by operator
      const operatorMap = new Map<string, {
        operator: any;
        servicesCount: number;
        completedCount: number;
        totalRevenue: number;
        totalCommission: number;
      }>();

      (services || []).forEach(s => {
        if (!s.operator_id || !s.operator) return;
        const existing = operatorMap.get(s.operator_id) || {
          operator: s.operator,
          servicesCount: 0,
          completedCount: 0,
          totalRevenue: 0,
          totalCommission: 0,
        };
        existing.servicesCount++;
        if (s.status === 'completed' || s.status === 'invoiced') {
          existing.completedCount++;
          existing.totalRevenue += s.total || 0;
        }
        operatorMap.set(s.operator_id, existing);
      });

      (commissions || []).forEach(c => {
        if (!c.operator_id) return;
        const existing = operatorMap.get(c.operator_id);
        if (existing) {
          existing.totalCommission += c.total_amount || 0;
        }
      });

      return Array.from(operatorMap.values())
        .sort((a, b) => b.servicesCount - a.servicesCount);
    },
    enabled: !!authUser?.tenant?.id,
  });
}

export function useFleetReport(dateRange: DateRange) {
  const { authUser } = useAuth();

  return useQuery({
    queryKey: ['report-fleet', authUser?.tenant?.id, dateRange.from, dateRange.to],
    queryFn: async () => {
      const { data: cranes, error: cranesError } = await supabase
        .from('cranes')
        .select('id, unit_number, type, brand, model, status, current_km');

      if (cranesError) throw cranesError;

      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, crane_id, total, status, scheduled_date')
        .gte('scheduled_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(dateRange.to, 'yyyy-MM-dd'));

      if (servicesError) throw servicesError;

      const { data: maintenance, error: maintError } = await supabase
        .from('crane_maintenance')
        .select('id, crane_id, cost, status, type, scheduled_date')
        .gte('scheduled_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(dateRange.to, 'yyyy-MM-dd'));

      if (maintError) throw maintError;

      // Build fleet stats
      const craneStats = (cranes || []).map(crane => {
        const craneServices = (services || []).filter(s => s.crane_id === crane.id);
        const craneMaintenance = (maintenance || []).filter(m => m.crane_id === crane.id);

        return {
          crane,
          servicesCount: craneServices.length,
          completedServices: craneServices.filter(s => s.status === 'completed' || s.status === 'invoiced').length,
          totalRevenue: craneServices
            .filter(s => s.status === 'completed' || s.status === 'invoiced')
            .reduce((sum, s) => sum + (s.total || 0), 0),
          maintenanceCount: craneMaintenance.length,
          maintenanceCost: craneMaintenance.reduce((sum, m) => sum + (m.cost || 0), 0),
        };
      });

      return craneStats.sort((a, b) => b.servicesCount - a.servicesCount);
    },
    enabled: !!authUser?.tenant?.id,
  });
}

export function useFinanceReport(dateRange: DateRange) {
  const { authUser } = useAuth();

  return useQuery({
    queryKey: ['report-finance', authUser?.tenant?.id, dateRange.from, dateRange.to],
    queryFn: async () => {
      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('id, folio, status, total, balance_due, issue_date, due_date')
        .gte('issue_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('issue_date', format(dateRange.to, 'yyyy-MM-dd'));

      if (invError) throw invError;

      const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('id, amount, payment_date, status, payment_method')
        .gte('payment_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('payment_date', format(dateRange.to, 'yyyy-MM-dd'));

      if (payError) throw payError;

      const { data: commissions, error: commError } = await supabase
        .from('commissions')
        .select('id, total_amount, status, period_start')
        .gte('period_start', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('period_start', format(dateRange.to, 'yyyy-MM-dd'));

      if (commError) throw commError;

      const { data: closures, error: closureError } = await supabase
        .from('billing_closures')
        .select('id, folio, status, total, period_start')
        .gte('period_start', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('period_start', format(dateRange.to, 'yyyy-MM-dd'));

      if (closureError) throw closureError;

      return {
        invoices: invoices || [],
        payments: payments || [],
        commissions: commissions || [],
        closures: closures || [],
      };
    },
    enabled: !!authUser?.tenant?.id,
  });
}

// Utility to export data as CSV
export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        let value = row[header];
        if (value === null || value === undefined) value = '';
        if (typeof value === 'object') value = JSON.stringify(value);
        if (typeof value === 'string' && value.includes(',')) value = `"${value}"`;
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
}

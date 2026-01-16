import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, addDays, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export interface DashboardAlert {
  id: string;
  title: string;
  description: string;
  type: 'warning' | 'danger' | 'info';
  time: string;
}

export interface ActiveService {
  id: string;
  folio: string;
  client_name: string;
  status: string;
  crane_unit: string | null;
  operator_name: string | null;
  created_at: string;
}

export interface DashboardStats {
  servicesToday: number;
  servicesTodayChange: number;
  monthlyRevenue: number;
  monthlyRevenueChange: number;
  activeOperators: number;
  availableCranes: number;
  totalCranes: number;
  activeServices: ActiveService[];
  alerts: DashboardAlert[];
  successRate: number;
  avgTicket: number;
}

export function useDashboardStats() {
  const { authUser } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats', authUser?.tenant?.id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!authUser?.tenant?.id) throw new Error('No tenant');

      const tenantId = authUser.tenant.id;
      const today = new Date();
      const todayStart = startOfDay(today).toISOString();
      const todayEnd = endOfDay(today).toISOString();
      const monthStart = startOfMonth(today).toISOString();
      const monthEnd = endOfMonth(today).toISOString();
      const lastMonthStart = startOfMonth(subMonths(today, 1)).toISOString();
      const lastMonthEnd = endOfMonth(subMonths(today, 1)).toISOString();

      // Services today
      const todayServicesResult = await supabase
        .from('services')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd);

      // Services same day last month (for comparison)
      const lastMonthTodayServicesResult = await supabase
        .from('services')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', startOfDay(subMonths(today, 1)).toISOString())
        .lte('created_at', endOfDay(subMonths(today, 1)).toISOString());

      // Monthly revenue
      const monthRevenueResult = await supabase
        .from('services')
        .select('total')
        .eq('tenant_id', tenantId)
        .eq('status', 'completed')
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd);

      // Last month revenue (for comparison)
      const lastMonthRevenueResult = await supabase
        .from('services')
        .select('total')
        .eq('tenant_id', tenantId)
        .eq('status', 'completed')
        .gte('created_at', lastMonthStart)
        .lte('created_at', lastMonthEnd);

      // Active operators (using is_active only since status might not have 'available')
      const activeOperatorsResult = await supabase
        .from('operators')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      // Cranes
      const cranesResult = await supabase
        .from('cranes')
        .select('id, status')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      // Active services (not completed or cancelled)
      const activeServicesResult = await supabase
        .from('services')
        .select(`
          id,
          folio,
          status,
          created_at,
          clients (name),
          cranes (unit_number),
          operators (full_name)
        `)
        .eq('tenant_id', tenantId)
        .not('status', 'in', '("completed","cancelled")')
        .order('created_at', { ascending: false })
        .limit(5);

      // Expiring licenses (operators with license expiring in 30 days)
      const expiringLicensesResult = await supabase
        .from('operators')
        .select('id, full_name, license_expiry')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .not('license_expiry', 'is', null)
        .lte('license_expiry', addDays(today, 30).toISOString())
        .gte('license_expiry', today.toISOString())
        .limit(5);

      // Pending maintenance - using valid status values
      const pendingMaintenanceResult = await supabase
        .from('crane_maintenance')
        .select('id, description, crane_id, scheduled_date, cranes (unit_number)')
        .eq('status', 'scheduled')
        .limit(5);

      // Unbilled completed services (with completion_time set)
      const unbilledServicesResult = await supabase
        .from('services')
        .select('id, folio, completion_time')
        .eq('tenant_id', tenantId)
        .eq('status', 'completed')
        .is('invoice_id', null)
        .not('completion_time', 'is', null)
        .limit(5);

      // All services this month for success rate
      const completedServicesResult = await supabase
        .from('services')
        .select('id, status')
        .eq('tenant_id', tenantId)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd);

      // Calculate values
      const servicesToday = todayServicesResult.count || 0;
      const lastMonthTodayServices = lastMonthTodayServicesResult.count || 0;
      const servicesTodayChange = lastMonthTodayServices > 0 
        ? Math.round(((servicesToday - lastMonthTodayServices) / lastMonthTodayServices) * 100) 
        : 0;

      const monthlyRevenue = (monthRevenueResult.data || []).reduce((sum, s) => sum + (s.total || 0), 0);
      const lastMonthRevenue = (lastMonthRevenueResult.data || []).reduce((sum, s) => sum + (s.total || 0), 0);
      const monthlyRevenueChange = lastMonthRevenue > 0 
        ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) 
        : 0;

      const activeOperators = activeOperatorsResult.count || 0;
      const allCranes = cranesResult.data || [];
      const totalCranes = allCranes.length;
      // Count cranes that are not in_service or maintenance
      const availableCranes = allCranes.filter((c) => c.status === 'available').length;

      // Map active services
      const activeServices: ActiveService[] = (activeServicesResult.data || []).map((s: any) => ({
        id: s.id,
        folio: s.folio,
        client_name: s.clients?.name || 'Sin cliente',
        status: s.status,
        crane_unit: s.cranes?.unit_number || null,
        operator_name: s.operators?.full_name || null,
        created_at: s.created_at,
      }));

      // Build alerts
      const alerts: DashboardAlert[] = [];

      // Expiring licenses
      (expiringLicensesResult.data || []).forEach((op: any) => {
        const daysUntil = Math.ceil((new Date(op.license_expiry).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          id: `license-${op.id}`,
          title: 'Licencia por vencer',
          description: `${op.full_name} - Vence en ${daysUntil} día${daysUntil !== 1 ? 's' : ''}`,
          type: daysUntil <= 7 ? 'danger' : 'warning',
          time: formatDistanceToNow(new Date(op.license_expiry), { addSuffix: true, locale: es }),
        });
      });

      // Unbilled services
      (unbilledServicesResult.data || []).forEach((s: any) => {
        if (s.completion_time) {
          const daysSince = Math.ceil((today.getTime() - new Date(s.completion_time).getTime()) / (1000 * 60 * 60 * 24));
          if (daysSince > 3) {
            alerts.push({
              id: `unbilled-${s.id}`,
              title: 'Servicio sin facturar',
              description: `${s.folio} completado hace ${daysSince} días`,
              type: 'danger',
              time: formatDistanceToNow(new Date(s.completion_time), { addSuffix: true, locale: es }),
            });
          }
        }
      });

      // Pending maintenance
      (pendingMaintenanceResult.data || []).forEach((m: any) => {
        alerts.push({
          id: `maintenance-${m.id}`,
          title: 'Mantenimiento pendiente',
          description: `${m.cranes?.unit_number || 'Grúa'} - ${m.description}`,
          type: 'info',
          time: m.scheduled_date 
            ? formatDistanceToNow(new Date(m.scheduled_date), { addSuffix: true, locale: es })
            : 'Sin fecha',
        });
      });

      // Calculate success rate
      const allMonthServices = completedServicesResult.data || [];
      const completedCount = allMonthServices.filter((s) => s.status === 'completed').length;
      const cancelledCount = allMonthServices.filter((s) => s.status === 'cancelled').length;
      const successRate = allMonthServices.length > 0 
        ? Math.round((completedCount / (completedCount + cancelledCount || 1)) * 100) 
        : 0;

      // Average ticket
      const completedServicesWithRevenue = monthRevenueResult.data || [];
      const avgTicket = completedServicesWithRevenue.length > 0
        ? Math.round(monthlyRevenue / completedServicesWithRevenue.length)
        : 0;

      return {
        servicesToday,
        servicesTodayChange,
        monthlyRevenue,
        monthlyRevenueChange,
        activeOperators,
        availableCranes,
        totalCranes,
        activeServices,
        alerts,
        successRate,
        avgTicket,
      };
    },
    enabled: !!authUser?.tenant?.id,
    staleTime: 30 * 1000, // 30 seconds
  });
}



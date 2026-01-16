import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ServiceOperatorDetail {
  id: string;
  operator_id: string;
  commission: number;
  role: string;
  operator: {
    id: string;
    full_name: string;
    employee_number: string;
    phone: string | null;
    commission_type: string | null;
    commission_percentage: number | null;
    commission_fixed_amount: number | null;
  } | null;
}

export interface ServiceCostDetail {
  id: string;
  description: string;
  amount: number;
  category_id: string | null;
  subcategory: string | null;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface EnhancedServiceDetails {
  service: any;
  client: any;
  crane: any;
  operators: ServiceOperatorDetail[];
  costs: ServiceCostDetail[];
  totals: {
    subtotal: number;
    tax: number;
    total: number;
    totalCommissions: number;
    totalCosts: number;
    netMargin: number;
    marginPercentage: number;
  };
}

export function useEnhancedServiceDetails(serviceId: string | null) {
  const { authUser } = useAuth();
  // Use fallback to ensure tenantId is available even if tenant object is not populated
  const tenantId = authUser?.tenant?.id || authUser?.profile?.tenant_id;

  return useQuery({
    queryKey: ['enhanced-service-details', serviceId],
    queryFn: async (): Promise<EnhancedServiceDetails | null> => {
      if (!serviceId) return null;

      // Fetch service with client and crane - using proper Supabase foreign key syntax
      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select(`
          *,
          clients:client_id(id, name, trade_name, tax_id, phone, phone_alt, email, address, city, state, country, type, code, contacts),
          cranes:crane_id(id, unit_number, brand, model, plates, type, capacity_tons)
        `)
        .eq('id', serviceId)
        .maybeSingle();

      if (serviceError) throw serviceError;
      if (!service) return null;
      
      // Extract client and crane from joined data
      const client = service.clients;
      const crane = service.cranes;

      // Fetch operators for this service
      const { data: serviceOperators, error: operatorsError } = await supabase
        .from('service_operators')
        .select(`
          id,
          operator_id,
          commission,
          role,
          operator:operators(
            id,
            full_name,
            employee_number,
            phone,
            commission_type,
            commission_percentage,
            commission_fixed_amount
          )
        `)
        .eq('service_id', serviceId);

      if (operatorsError) throw operatorsError;

      // Fetch costs for this service
      const { data: serviceCosts, error: costsError } = await supabase
        .from('service_costs')
        .select('*')
        .eq('service_id', serviceId)
        .order('created_at', { ascending: true });

      if (costsError) throw costsError;

      // Calculate totals - ensure numeric conversion for commissions
      const subtotal = service.subtotal || 0;
      const tax = service.tax_amount || 0;
      const total = service.total || 0;
      const totalCommissions = (serviceOperators || []).reduce(
        (sum, op) => sum + Number(op.commission || 0),
        0
      );
      const totalCosts = (serviceCosts || []).reduce(
        (sum, cost) => sum + Number(cost.amount || 0),
        0
      );
      const netMargin = subtotal - totalCommissions - totalCosts;
      const marginPercentage = subtotal > 0 ? (netMargin / subtotal) * 100 : 0;

      // Map costs to expected interface
      const mappedCosts: ServiceCostDetail[] = (serviceCosts || []).map((cost) => ({
        id: cost.id,
        description: cost.description,
        amount: cost.amount || 0,
        category_id: cost.category_id,
        subcategory: cost.subcategory,
        quantity: cost.quantity || 1,
        unit_price: cost.unit_price || cost.amount || 0,
        created_at: cost.created_at || '',
      }));

      return {
        service,
        client,
        crane,
        operators: (serviceOperators || []) as ServiceOperatorDetail[],
        costs: mappedCosts,
        totals: {
          subtotal,
          tax,
          total,
          totalCommissions,
          totalCosts,
          netMargin,
          marginPercentage,
        },
      };
    },
    enabled: !!serviceId,
  });
}

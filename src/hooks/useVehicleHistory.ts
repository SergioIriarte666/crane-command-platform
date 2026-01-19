import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useVehicleHistory(vehiclePlates: string | null, excludeServiceId: string | null) {
  const { authUser } = useAuth();
  // Use fallback to ensure tenantId is available
  const tenantId = authUser?.tenant?.id || authUser?.profile?.tenant_id;

  // Normalize plates for case-insensitive search
  const normalizedPlates = vehiclePlates?.trim().toUpperCase() || null;

  return useQuery({
    queryKey: ['vehicle-history', normalizedPlates, excludeServiceId],
    queryFn: async () => {
      if (!normalizedPlates) return [];

      let query = supabase
        .from('services')
        .select(`
          id,
          folio,
          service_date,
          scheduled_date,
          created_at,
          type,
          origin_address,
          destination_address,
          subtotal,
          total,
          status,
          vehicle_plates
        `)
        .ilike('vehicle_plates', normalizedPlates)
        .order('service_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(20);

      // Filter by tenant if available (RLS should also enforce this)
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      if (excludeServiceId) {
        query = query.neq('id', excludeServiceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!normalizedPlates,
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { VipService, BatchProgressCallback } from '@/types/vipPipeline';

export function useClientServices(clientId: string | null) {
  const { authUser } = useAuth();
  const tenantId = authUser?.tenant?.id;

  const query = useQuery({
    queryKey: ['client-services', clientId, tenantId],
    queryFn: async () => {
      if (!clientId || !tenantId) return [];

      const { data, error } = await supabase
        .from('services')
        .select(`
          id,
          folio,
          status,
          type,
          priority,
          scheduled_date,
          service_date,
          created_at,
          vehicle_brand,
          vehicle_model,
          vehicle_plates,
          origin_address,
          destination_address,
          subtotal,
          total,
          quote_number,
          purchase_order_number,
          observations,
          client:clients!services_client_id_fkey(id, name, code, tax_id),
          crane:cranes(id, unit_number, type, plates),
          operator:operators(id, full_name, employee_number)
        `)
        .eq('client_id', clientId)
        .eq('tenant_id', tenantId)
        .neq('status', 'cancelled')
        .order('service_date', { ascending: false });

      if (error) throw error;
      return (data || []) as VipService[];
    },
    enabled: !!clientId && !!tenantId,
  });

  return {
    services: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export interface ServiceBatchUpdateData {
  serviceIds: string[];
  fields: {
    status?: string;
    quote_number?: string;
    purchase_order_number?: string;
    observations?: string;
  };
  appendObservations?: boolean;
  onProgress?: (progress: BatchProgressCallback) => void;
}

export function useUpdateServicesBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ServiceBatchUpdateData) => {
      const { serviceIds, fields, appendObservations, onProgress } = data;
      const total = serviceIds.length;
      let successCount = 0;

      for (let index = 0; index < serviceIds.length; index++) {
        const serviceId = serviceIds[index];
        
        let updateFields = { ...fields };
        
        // Handle appending observations
        if (appendObservations && fields.observations) {
          const { data: currentService } = await supabase
            .from('services')
            .select('observations')
            .eq('id', serviceId)
            .single();
          
          const existingObs = currentService?.observations || '';
          const timestamp = new Date().toLocaleString('es-CL');
          updateFields.observations = existingObs 
            ? `${existingObs}\n\n[${timestamp}] ${fields.observations}`
            : `[${timestamp}] ${fields.observations}`;
        }

        const { error } = await supabase
          .from('services')
          .update(updateFields)
          .eq('id', serviceId);

        if (error) {
          console.error(`Error updating service ${serviceId}:`, error);
        } else {
          successCount++;
        }

        onProgress?.({
          current: index + 1,
          total,
          percentage: ((index + 1) / total) * 100,
          currentItemId: serviceId,
        });
      }

      return { success: true, count: successCount, total };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['client-services'] });
      toast.success(`${result.count} de ${result.total} servicios actualizados`);
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

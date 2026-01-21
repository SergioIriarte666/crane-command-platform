import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { ServiceInsert, ServiceUpdate, ServiceStatus } from '@/types/services';

export function useNextFolio() {
  const { authUser } = useAuth();
  const tenantId = authUser?.tenant?.id || authUser?.profile?.tenant_id;
  
  return useQuery({
    queryKey: ['next-service-folio-preview', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant');
      
      // Use peek_ (read-only) instead of generate_ (which increments)
      // The actual generate_service_folio is only called when creating a service
      const { data, error } = await supabase
        .rpc('peek_next_service_folio', { _tenant_id: tenantId });
      
      if (error) throw error;
      return data as string;
    },
    enabled: !!tenantId,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

export function useServices() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  const servicesQuery = useQuery({
    queryKey: ['services', authUser?.tenant?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          client:clients!services_client_id_fkey(id, name, code),
          crane:cranes(id, unit_number, type),
          operator:operators(id, full_name, employee_number)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!authUser?.tenant?.id,
  });

  const createService = useMutation({
    mutationFn: async (
      service: Omit<ServiceInsert, 'tenant_id' | 'folio'> & {
        custom_folio?: string;
        operators?: Array<{ operatorId: string; commission: number; role: string }>;
        costs?: Array<{
          category_id: string;
          description: string;
          amount: number;
          quantity: number;
          unitPrice: number;
          subcategory?: string;
          notes?: string;
          cost_date?: string;
        }>;
      }
    ) => {
      const tenantId = authUser?.tenant?.id;
      const profileId = authUser?.profile?.id;
      if (!tenantId) throw new Error('No tenant');
      if (!profileId) throw new Error('No profile');

      const { custom_folio, operators, costs, ...serviceData } = service;
      let folio: string;

      if (custom_folio) {
        // Validate that custom folio doesn't already exist
        const { data: existing } = await supabase
          .from('services')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('folio', custom_folio)
          .maybeSingle();

        if (existing) {
          throw new Error('Este folio ya existe. Por favor ingrese uno diferente.');
        }
        folio = custom_folio;
      } else {
        // Generate folio automatically
        const { data: generatedFolio, error: folioError } = await supabase
          .rpc('generate_service_folio', { _tenant_id: tenantId });

        if (folioError) throw folioError;
        folio = generatedFolio;
      }

      const { data, error } = await supabase
        .from('services')
        .insert({
          ...serviceData,
          folio,
          tenant_id: tenantId,
          created_by: profileId,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert service operators
      if (operators && operators.length > 0) {
        const operatorsToInsert = operators.map((op) => ({
          service_id: data.id,
          tenant_id: tenantId,
          operator_id: op.operatorId,
          role: op.role,
          commission: op.commission,
        }));

        const { error: opError } = await supabase
          .from('service_operators')
          .insert(operatorsToInsert);

        if (opError) throw opError;
      }

      // Insert service costs
      if (costs && costs.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const costsToInsert = costs.map((cost) => ({
          service_id: data.id,
          tenant_id: tenantId,
          category_id: cost.category_id || null,
          description: cost.description,
          amount: cost.amount,
          quantity: cost.quantity,
          unit_price: cost.unitPrice,
          subcategory: cost.subcategory || null,
          notes: cost.notes || null,
          cost_date: cost.cost_date || today,
        }));

        const { error: costError } = await supabase
          .from('service_costs')
          .insert(costsToInsert);

        if (costError) throw costError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service-operators'] });
      queryClient.invalidateQueries({ queryKey: ['service-costs'] });
      toast.success('Servicio creado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al crear servicio: ${error.message}`);
    },
  });

  const updateService = useMutation({
    mutationFn: async (
      {
        id,
        operators,
        costs,
        ...updates
      }: ServiceUpdate & {
        id: string;
        operators?: Array<{ operatorId: string; commission: number; role: string }>;
        costs?: Array<{
          category_id: string;
          description: string;
          amount: number;
          quantity: number;
          unitPrice: number;
          subcategory?: string;
          notes?: string;
          cost_date?: string;
        }>;
      }
    ) => {
      const tenantId = authUser?.tenant?.id;

      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Sync operators: delete existing and insert new ones
      if (operators !== undefined) {
        await supabase.from('service_operators').delete().eq('service_id', id);

        if (operators.length > 0 && tenantId) {
          const operatorsToInsert = operators.map((op) => ({
            service_id: id,
            tenant_id: tenantId,
            operator_id: op.operatorId,
            role: op.role,
            commission: op.commission,
          }));

          const { error: opError } = await supabase
            .from('service_operators')
            .insert(operatorsToInsert);

          if (opError) console.error('Error updating operators:', opError);
        }
      }

      // Sync costs: delete existing and insert current form costs
      if (costs !== undefined && tenantId) {
        await supabase.from('service_costs').delete().eq('service_id', id);

        if (costs.length > 0) {
          const today = new Date().toISOString().split('T')[0];
          const costsToInsert = costs.map((cost) => ({
            service_id: id,
            tenant_id: tenantId,
            category_id: cost.category_id || null,
            description: cost.description,
            amount: cost.amount,
            quantity: cost.quantity,
            unit_price: cost.unitPrice,
            subcategory: cost.subcategory || null,
            notes: cost.notes || null,
            cost_date: cost.cost_date || today,
          }));

          const { error: costError } = await supabase
            .from('service_costs')
            .insert(costsToInsert);

          if (costError) console.error('Error updating costs:', costError);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service-operators'] });
      queryClient.invalidateQueries({ queryKey: ['service-costs'] });
      toast.success('Servicio actualizado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al actualizar servicio: ${error.message}`);
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ServiceStatus }) => {
      const { data, error } = await supabase
        .from('services')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success(`Estado cambiado a "${data.status}"`);
    },
    onError: (error) => {
      toast.error(`Error al cambiar estado: ${error.message}`);
    },
  });

  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Servicio eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al eliminar servicio: ${error.message}`);
    },
  });

  // Group services by status for pipeline view
  const servicesByStatus = servicesQuery.data?.reduce((acc, service) => {
    const status = service.status as ServiceStatus;
    if (!acc[status]) acc[status] = [];
    acc[status].push(service);
    return acc;
  }, {} as Record<ServiceStatus, typeof servicesQuery.data>) || {};

  // Calculate metrics
  const metrics = {
    total: servicesQuery.data?.length || 0,
    byStatus: Object.entries(servicesByStatus).map(([status, services]) => ({
      status: status as ServiceStatus,
      count: (services as any[]).length,
      total: (services as any[]).reduce((sum: number, s: any) => sum + (s.total || 0), 0),
    })),
    totalValue: servicesQuery.data?.reduce((sum, s) => sum + (s.total || 0), 0) || 0,
  };

  return {
    services: servicesQuery.data || [],
    servicesByStatus,
    metrics,
    isLoading: servicesQuery.isLoading,
    error: servicesQuery.error,
    createService,
    updateService,
    updateStatus,
    deleteService,
    refetch: servicesQuery.refetch,
  };
}

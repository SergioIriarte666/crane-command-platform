import { useState, useMemo, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UseServicesForClosuresOptions {
  dateFrom?: Date;
  dateTo?: Date;
}

interface Service {
  id: string;
  folio: string;
  scheduled_date?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_plates?: string;
  total?: number;
  subtotal?: number;
  client?: { id: string; name: string } | null;
  status?: string;
}

export interface ProcessedServiceInfo {
  serviceId: string;
  serviceFolio: string;
  purchaseOrder: string | null;
  clientName: string;
  closureId: string;
  closureFolio: string;
  invoiceId: string | null;
  invoiceFolio: string | null;
}

interface ServicesData {
  availableServices: Service[];
  pendingServices: Service[];
  usedServiceIds: Set<string>;
  totalCompleted: number;
}

export const useServicesForClosures = (options: UseServicesForClosuresOptions = {}) => {
  const { authUser } = useAuth();
  const [data, setData] = useState<ServicesData>({
    availableServices: [],
    pendingServices: [],
    usedServiceIds: new Set(),
    totalCompleted: 0
  });
  const [loading, setLoading] = useState(false);
  const [processedServices, setProcessedServices] = useState<ProcessedServiceInfo[]>([]);
  const [searchingProcessed, setSearchingProcessed] = useState(false);

  const { dateFrom, dateTo } = options;
  
  // Flag para búsqueda global (sin filtro de fechas)
  const isGlobalSearch = !dateFrom && !dateTo;

  const fetchServicesData = useCallback(async () => {
    if (!authUser?.tenant?.id) return;
    
    try {
      setLoading(true);
      
      // Si no hay fechas, usar últimos 90 días por defecto
      let effectiveDateFrom = dateFrom;
      if (isGlobalSearch) {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        effectiveDateFrom = ninetyDaysAgo;
      }
      
      // Query para servicios completados/facturables
      let billableQuery = supabase
        .from('services')
        .select(`
          id,
          folio,
          scheduled_date,
          vehicle_brand,
          vehicle_model,
          vehicle_plates,
          total,
          subtotal,
          status,
          billing_closure_id,
          client:clients!services_client_id_fkey(id, name)
        `)
        .eq('tenant_id', authUser.tenant.id)
        .eq('status', 'completed')
        .is('billing_closure_id', null)
        .order('scheduled_date', { ascending: false });

      // Query para servicios pendientes
      let pendingQuery = supabase
        .from('services')
        .select(`
          id,
          folio,
          scheduled_date,
          vehicle_brand,
          vehicle_model,
          vehicle_plates,
          total,
          subtotal,
          status,
          client:clients!services_client_id_fkey(id, name)
        `)
        .eq('tenant_id', authUser.tenant.id)
        .in('status', ['draft', 'confirmed', 'assigned', 'en_route', 'on_site', 'in_progress'])
        .order('scheduled_date', { ascending: false });

      // Agregar filtro de fechas (incluyendo servicios sin scheduled_date para billable)
      if (effectiveDateFrom && dateTo) {
        const dateFromStr = effectiveDateFrom.toISOString().split('T')[0];
        const dateToStr = dateTo.toISOString().split('T')[0];
        
        // Para billableQuery: servicios en rango O sin fecha programada
        billableQuery = billableQuery.or(
          `and(scheduled_date.gte.${dateFromStr},scheduled_date.lte.${dateToStr}),scheduled_date.is.null`
        );
        
        // Para pendingQuery: solo dentro del rango
        pendingQuery = pendingQuery
          .gte('scheduled_date', dateFromStr)
          .lte('scheduled_date', dateToStr);
      } else if (effectiveDateFrom) {
        const dateFromStr = effectiveDateFrom.toISOString().split('T')[0];
        billableQuery = billableQuery.or(`scheduled_date.gte.${dateFromStr},scheduled_date.is.null`);
        pendingQuery = pendingQuery.gte('scheduled_date', dateFromStr);
      } else if (dateTo) {
        const dateToStr = dateTo.toISOString().split('T')[0];
        billableQuery = billableQuery.or(`scheduled_date.lte.${dateToStr},scheduled_date.is.null`);
        pendingQuery = pendingQuery.lte('scheduled_date', dateToStr);
      }

      const [billableResult, pendingResult] = await Promise.all([
        billableQuery,
        pendingQuery
      ]);

      if (billableResult.error) throw billableResult.error;
      if (pendingResult.error) throw pendingResult.error;

      // Obtener IDs de servicios ya incluidos en cierres
      const { data: closureServices } = await supabase
        .from('billing_closure_services')
        .select('service_id');

      const usedServiceIds = new Set(closureServices?.map(cs => cs.service_id) || []);

      // Filtrar servicios ya en cierres
      const availableServices = (billableResult.data || []).filter(
        service => !usedServiceIds.has(service.id)
      );

      setData({
        availableServices: availableServices as Service[],
        pendingServices: (pendingResult.data || []) as Service[],
        usedServiceIds,
        totalCompleted: billableResult.data?.length || 0
      });
    } catch (error: any) {
      console.error('Error fetching services data:', error);
      toast.error('Error al cargar servicios');
      setData({
        availableServices: [],
        pendingServices: [],
        usedServiceIds: new Set(),
        totalCompleted: 0
      });
    } finally {
      setLoading(false);
    }
  }, [authUser?.tenant?.id, dateFrom, dateTo, isGlobalSearch]);

  const completeService = useCallback(async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ status: 'completed' })
        .eq('id', serviceId);

      if (error) throw error;

      await fetchServicesData();
      toast.success('Servicio completado');
    } catch (error: any) {
      console.error('Error completing service:', error);
      toast.error('Error al completar servicio');
    }
  }, [fetchServicesData]);

  const completeMultipleServices = useCallback(async (serviceIds: string[]) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ status: 'completed' })
        .in('id', serviceIds);

      if (error) throw error;

      await fetchServicesData();
      toast.success(`${serviceIds.length} servicio(s) completados`);
    } catch (error: any) {
      console.error('Error completing services:', error);
      toast.error('Error al completar servicios');
    }
  }, [fetchServicesData]);

  // Búsqueda de servicios ya procesados (en cierres/facturas)
  const searchProcessedServices = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim() || !authUser?.tenant?.id) {
      setProcessedServices([]);
      return;
    }

    try {
      setSearchingProcessed(true);
      const searchPattern = `%${searchTerm.trim()}%`;

      const { data: processedData, error } = await supabase
        .from('services')
        .select(`
          id,
          folio,
          purchase_order,
          client:clients!services_client_id_fkey(id, name),
          billing_closure:billing_closures!services_billing_closure_id_fkey(
            id,
            folio,
            invoice:invoices!billing_closures_invoice_id_fkey(id, folio)
          )
        `)
        .eq('tenant_id', authUser.tenant.id)
        .not('billing_closure_id', 'is', null)
        .or(`purchase_order.ilike.${searchPattern},folio.ilike.${searchPattern},vehicle_plates.ilike.${searchPattern}`)
        .limit(10);

      if (error) {
        console.error('Error searching processed services:', error);
        setProcessedServices([]);
        return;
      }

      const transformed: ProcessedServiceInfo[] = (processedData || []).map((service: any) => {
        const closure = service.billing_closure;
        const invoice = closure?.invoice;

        return {
          serviceId: service.id,
          serviceFolio: service.folio,
          purchaseOrder: service.purchase_order,
          clientName: service.client?.name || 'Cliente desconocido',
          closureId: closure?.id || '',
          closureFolio: closure?.folio || '',
          invoiceId: invoice?.id || null,
          invoiceFolio: invoice?.folio || null
        };
      });

      setProcessedServices(transformed);
    } catch (error) {
      console.error('Error in searchProcessedServices:', error);
      setProcessedServices([]);
    } finally {
      setSearchingProcessed(false);
    }
  }, [authUser?.tenant?.id]);

  const clearProcessedServices = useCallback(() => {
    setProcessedServices([]);
  }, []);

  useEffect(() => {
    fetchServicesData();
  }, [fetchServicesData]);

  return {
    services: data.availableServices,
    pendingServices: data.pendingServices,
    usedServiceIds: data.usedServiceIds,
    totalCompleted: data.totalCompleted,
    loading,
    completeService,
    completeMultipleServices,
    refetch: fetchServicesData,
    isGlobalSearch,
    processedServices,
    searchingProcessed,
    searchProcessedServices,
    clearProcessedServices
  };
};

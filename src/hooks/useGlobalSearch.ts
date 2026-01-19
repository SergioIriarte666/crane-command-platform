import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export interface SearchResult {
  id: string;
  type: 'service' | 'client' | 'crane' | 'operator';
  title: string;
  subtitle: string;
  url: string;
}

interface SearchResults {
  services: SearchResult[];
  clients: SearchResult[];
  cranes: SearchResult[];
  operators: SearchResult[];
}

export function useGlobalSearch(query: string) {
  const { authUser } = useAuth();
  const [results, setResults] = useState<SearchResults>({
    services: [],
    clients: [],
    cranes: [],
    operators: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const search = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2 || !authUser?.tenant?.id) {
        setResults({ services: [], clients: [], cranes: [], operators: [] });
        return;
      }

      setIsLoading(true);
      const tenantId = authUser.tenant.id;
      const searchTerm = `%${debouncedQuery}%`;

      try {
        const [servicesRes, clientsRes, cranesRes, operatorsRes] = await Promise.all([
          // Search services
          supabase
            .from('services')
            .select('id, folio, status, vehicle_brand, vehicle_model, vehicle_plates')
            .eq('tenant_id', tenantId)
            .or(`folio.ilike.${searchTerm},vehicle_plates.ilike.${searchTerm},vehicle_brand.ilike.${searchTerm}`)
            .limit(5),

          // Search clients
          supabase
            .from('clients')
            .select('id, name, code, tax_id')
            .eq('tenant_id', tenantId)
            .or(`name.ilike.${searchTerm},code.ilike.${searchTerm},tax_id.ilike.${searchTerm}`)
            .limit(5),

          // Search cranes
          supabase
            .from('cranes')
            .select('id, unit_number, brand, model, plates')
            .eq('tenant_id', tenantId)
            .or(`unit_number.ilike.${searchTerm},brand.ilike.${searchTerm},model.ilike.${searchTerm},plates.ilike.${searchTerm}`)
            .limit(5),

          // Search operators
          supabase
            .from('operators')
            .select('id, full_name, employee_number, phone')
            .eq('tenant_id', tenantId)
            .or(`full_name.ilike.${searchTerm},employee_number.ilike.${searchTerm}`)
            .limit(5),
        ]);

        const services: SearchResult[] = (servicesRes.data || []).map((s) => ({
          id: s.id,
          type: 'service' as const,
          title: s.folio,
          subtitle: [s.vehicle_brand, s.vehicle_model, s.vehicle_plates].filter(Boolean).join(' ') || 'Sin vehículo',
          url: `/servicios?search=${s.folio}`,
        }));

        const clients: SearchResult[] = (clientsRes.data || []).map((c) => ({
          id: c.id,
          type: 'client' as const,
          title: c.name,
          subtitle: c.code || c.tax_id || '',
          url: `/clientes/${c.id}`,
        }));

        const cranes: SearchResult[] = (cranesRes.data || []).map((cr) => ({
          id: cr.id,
          type: 'crane' as const,
          title: cr.unit_number,
          subtitle: [cr.brand, cr.model].filter(Boolean).join(' ') || cr.plates || '',
          url: `/flota/${cr.id}`,
        }));

        const operators: SearchResult[] = (operatorsRes.data || []).map((op) => ({
          id: op.id,
          type: 'operator' as const,
          title: op.full_name,
          subtitle: op.employee_number || '',
          url: `/operadores/${op.id}`,
        }));

        setResults({ services, clients, cranes, operators });
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    search();
  }, [debouncedQuery, authUser?.tenant?.id]);

  const hasResults = useMemo(() => {
    return (
      results.services.length > 0 ||
      results.clients.length > 0 ||
      results.cranes.length > 0 ||
      results.operators.length > 0
    );
  }, [results]);

  const totalResults = useMemo(() => {
    return (
      results.services.length +
      results.clients.length +
      results.cranes.length +
      results.operators.length
    );
  }, [results]);

  return {
    results,
    isLoading,
    hasResults,
    totalResults,
  };
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CatalogSubcategory {
  id: string;
  name: string;
  code: string;
  parent_id: string | null;
}

export function useCatalogSubcategories(parentId: string | null) {
  const { authUser } = useAuth();
  const tenantId = authUser?.tenant?.id;

  return useQuery({
    queryKey: ['catalog-subcategories', tenantId, parentId],
    queryFn: async (): Promise<CatalogSubcategory[]> => {
      if (!tenantId || !parentId) return [];

      const { data, error } = await supabase
        .from('catalog_items')
        .select('id, name, code, parent_id')
        .eq('tenant_id', tenantId)
        .eq('parent_id', parentId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId && !!parentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

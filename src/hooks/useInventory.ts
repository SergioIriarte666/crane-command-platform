import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { InventoryItemInsert, InventoryItemUpdate, MovementType, InventoryLocation, InventoryBatch } from '@/types/inventory';

export function useInventory() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  const inventoryQuery = useQuery({
    queryKey: ['inventory', authUser?.tenant?.id],
    queryFn: async () => {
      if (!authUser?.tenant?.id) return [];
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('code', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!authUser?.tenant?.id,
  });

  // Stub locations query - table not yet in schema
  const locationsQuery = useQuery({
    queryKey: ['inventory_locations', authUser?.tenant?.id],
    queryFn: async (): Promise<InventoryLocation[]> => {
      // inventory_locations table does not exist yet
      return [];
    },
    enabled: false,
  });

  // Stub batches query - table not yet in schema
  const batchesQuery = useQuery({
    queryKey: ['inventory_batches', authUser?.tenant?.id],
    queryFn: async (): Promise<InventoryBatch[]> => {
      // inventory_batches table does not exist yet
      return [];
    },
    enabled: false,
  });

  // Movements query - simplified to work without location/batch joins
  const movementsQuery = useQuery({
    queryKey: ['inventory_movements', authUser?.tenant?.id],
    queryFn: async () => {
      if (!authUser?.tenant?.id) return [];
      const { data, error } = await supabase
        .from('inventory_movements')
        .select(`
          *,
          item:inventory_items(name, code, unit)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!authUser?.tenant?.id,
  });

  const createItem = useMutation({
    mutationFn: async (item: Omit<InventoryItemInsert, 'tenant_id'>) => {
      if (!authUser?.tenant?.id) throw new Error('No tenant');
      if (!authUser?.profile?.id) throw new Error('No user profile');
      
      const { data, error } = await supabase
        .from('inventory_items')
        .insert({
          ...item,
          tenant_id: authUser.tenant.id,
          created_by: authUser.profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Artículo creado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al crear artículo: ${error.message}`);
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: InventoryItemUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Artículo actualizado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al actualizar artículo: ${error.message}`);
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Artículo eliminado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al eliminar artículo: ${error.message}`);
    },
  });

  const createMovement = useMutation({
    mutationFn: async (movement: {
      item_id: string;
      type: MovementType;
      quantity: number;
      unit_cost?: number;
      notes?: string;
      reference_id?: string;
      reference_type?: string;
      location_id?: string;
      batch_id?: string;
    }) => {
      if (!authUser?.tenant?.id) throw new Error('No tenant');
      if (!authUser?.profile?.id) throw new Error('No user profile');
      
      const { data, error } = await supabase
        .from('inventory_movements')
        .insert({
          ...movement,
          tenant_id: authUser.tenant.id,
          created_by: authUser.profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast.success('Movimiento registrado exitosamente');
    },
    onError: (error) => {
      toast.error(`Error al registrar movimiento: ${error.message}`);
    },
  });

  // Stub createBatch - table not yet in schema
  const createBatch = useMutation({
    mutationFn: async (_batch: {
      item_id: string;
      batch_number: string;
      expiration_date?: string;
      cost?: number;
    }): Promise<InventoryBatch | null> => {
      // inventory_batches table does not exist yet
      throw new Error('Batches feature not yet available');
    },
    onError: (error) => {
      toast.error(`Error al crear lote: ${error.message}`);
    },
  });

  // Stub deleteBatch - table not yet in schema
  const deleteBatch = useMutation({
    mutationFn: async (_batchId: string): Promise<void> => {
      // inventory_batches table does not exist yet
      throw new Error('Batches feature not yet available');
    },
  });

  const generateCode = async (): Promise<string> => {
    if (!authUser?.tenant?.id) return 'INV-0001';
    
    const { data, error } = await supabase
      .rpc('generate_inventory_code', { _tenant_id: authUser.tenant.id });

    if (error) throw error;
    return data;
  };

  return {
    items: inventoryQuery.data || [],
    movements: movementsQuery.data ?? [],
    locations: locationsQuery.data || [],
    batches: batchesQuery.data || [],
    isLoading: inventoryQuery.isLoading || movementsQuery.isLoading || locationsQuery.isLoading,
    error: inventoryQuery.error,
    createItem,
    updateItem,
    deleteItem,
    createMovement,
    createBatch,
    deleteBatch,
    generateCode,
    refetch: inventoryQuery.refetch,
  };
}

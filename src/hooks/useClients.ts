import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Client, ClientFormData, ClientContact } from '@/types/clients';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

export function useClients() {
  const { authUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const clientsQuery = useQuery({
    queryKey: ['clients', authUser?.tenant?.id],
    queryFn: async () => {
      if (!authUser?.tenant?.id) return [];
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        contacts: (item.contacts as unknown as ClientContact[]) || [],
      })) as Client[];
    },
    enabled: !!authUser?.tenant?.id,
  });

  const createClient = useMutation({
    mutationFn: async (formData: ClientFormData) => {
      if (!authUser?.tenant?.id) throw new Error('No tenant');

      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_client_code', { _tenant_id: authUser.tenant.id });
      
      if (codeError) throw codeError;

      const { data, error } = await supabase
        .from('clients')
        .insert({
          tenant_id: authUser.tenant.id,
          code: codeData,
          type: formData.type,
          name: formData.name,
          trade_name: formData.trade_name || null,
          tax_id: formData.tax_id || null,
          tax_regime: formData.tax_regime || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          zip_code: formData.zip_code || null,
          phone: formData.phone || null,
          phone_alt: formData.phone_alt || null,
          email: formData.email || null,
          website: formData.website || null,
          contacts: formData.contacts as unknown as Json,
          payment_terms: formData.payment_terms,
          credit_limit: formData.credit_limit,
          requires_po: formData.requires_po,
          requires_approval: formData.requires_approval,
          default_discount: formData.default_discount,
          notes: formData.notes || null,
          created_by: authUser.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Cliente creado', description: 'El cliente se ha creado correctamente.' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error al crear cliente', description: error.message });
    },
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, ...formData }: ClientFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update({
          type: formData.type,
          name: formData.name,
          trade_name: formData.trade_name || null,
          tax_id: formData.tax_id || null,
          tax_regime: formData.tax_regime || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || null,
          zip_code: formData.zip_code || null,
          phone: formData.phone || null,
          phone_alt: formData.phone_alt || null,
          email: formData.email || null,
          website: formData.website || null,
          contacts: formData.contacts as unknown as Json,
          payment_terms: formData.payment_terms,
          credit_limit: formData.credit_limit,
          requires_po: formData.requires_po,
          requires_approval: formData.requires_approval,
          default_discount: formData.default_discount,
          notes: formData.notes || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Cliente actualizado', description: 'El cliente se ha actualizado correctamente.' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error al actualizar cliente', description: error.message });
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Cliente eliminado', description: 'El cliente se ha eliminado correctamente.' });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error al eliminar cliente', description: error.message });
    },
  });

  const toggleClientStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('clients')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: data.is_active ? 'Cliente activado' : 'Cliente desactivado',
        description: `El cliente ${data.name} ha sido ${data.is_active ? 'activado' : 'desactivado'}.`,
      });
    },
    onError: (error: Error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  return {
    clients: clientsQuery.data || [],
    isLoading: clientsQuery.isLoading,
    error: clientsQuery.error,
    createClient,
    updateClient,
    deleteClient,
    toggleClientStatus,
  };
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        contacts: (data.contacts as unknown as ClientContact[]) || [],
      } as Client;
    },
    enabled: !!id,
  });
}

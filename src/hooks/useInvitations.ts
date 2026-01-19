import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { AppRole } from '@/types/auth';

interface Invitation {
  id: string;
  email: string;
  role: AppRole;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  tenant_id: string;
  invited_by: string;
}

export function useInvitations() {
  const { authUser } = useAuth();
  const tenantId = authUser?.tenant?.id;

  return useQuery({
    queryKey: ['invitations', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Invitation[];
    },
    enabled: !!tenantId,
  });
}

export function usePendingInvitations() {
  const { data: invitations, ...rest } = useInvitations();
  
  return {
    data: invitations?.filter(inv => !inv.accepted_at && new Date(inv.expires_at) > new Date()),
    ...rest,
  };
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();
  const { authUser, user } = useAuth();

  return useMutation({
    mutationFn: async ({ email, role }: { email: string; role: AppRole }) => {
      if (!authUser?.tenant?.id || !user?.id) {
        throw new Error('No tienes un tenant asignado');
      }

      // Check if invitation already exists
      const { data: existing } = await supabase
        .from('invitations')
        .select('id')
        .eq('tenant_id', authUser.tenant.id)
        .eq('email', email)
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (existing) {
        throw new Error('Ya existe una invitación pendiente para este email');
      }

      // Check if user already exists in tenant
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .eq('tenant_id', authUser.tenant.id)
        .maybeSingle();

      if (existingProfile) {
        throw new Error('Este usuario ya pertenece a la empresa');
      }

      // Check plan limits
      if (authUser.tenant.max_users !== null) {
        const { count: userCount, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', authUser.tenant.id)
          .eq('is_active', true);
          
        if (countError) throw countError;
        
        if (userCount !== null && userCount >= authUser.tenant.max_users) {
          throw new Error(`Has alcanzado el límite de usuarios de tu plan (${authUser.tenant.max_users}). Contacta a soporte para aumentar tu plan.`);
        }
      }

      const { error } = await supabase.from('invitations').insert({
        tenant_id: authUser.tenant.id,
        email,
        role,
        invited_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('Invitación creada', {
        description: 'El usuario recibirá instrucciones para registrarse',
      });
    },
    onError: (error: any) => {
      toast.error('Error al crear invitación', {
        description: error.message,
      });
    },
  });
}

export function useDeleteInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('Invitación eliminada');
    },
    onError: (error: any) => {
      toast.error('Error al eliminar', { description: error.message });
    },
  });
}

export function useResendInvitation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (invitation: Invitation) => {
      // Delete old invitation and create new one with fresh expiry
      const { error: deleteError } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitation.id);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase.from('invitations').insert({
        tenant_id: invitation.tenant_id,
        email: invitation.email,
        role: invitation.role,
        invited_by: user?.id,
      });

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast.success('Invitación reenviada', {
        description: 'Se ha generado un nuevo enlace de invitación',
      });
    },
    onError: (error: any) => {
      toast.error('Error al reenviar', { description: error.message });
    },
  });
}

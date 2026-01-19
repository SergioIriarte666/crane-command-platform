import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PlanLimits {
  maxUsers: number | null;
  currentUsers: number;
  maxCranes: number | null;
  currentCranes: number;
  maxOperators: number | null;
  currentOperators: number;
  canCreateUser: boolean;
  canCreateCrane: boolean;
  canCreateOperator: boolean;
  isLoading: boolean;
  refetch: () => void;
}

export const getProgressPercentage = (current: number, max: number | null) => {
  if (max === null) return 0;
  if (max === 0) return 100;
  return Math.min((current / max) * 100, 100);
};

export const getProgressColor = (current: number, max: number | null) => {
  if (max === null) return 'bg-green-500';
  if (max === 0) return 'bg-destructive';
  const percentage = (current / max) * 100;
  if (percentage >= 90) return 'bg-destructive';
  if (percentage >= 75) return 'bg-yellow-500';
  return 'bg-primary';
};

export const formatLimit = (current: number, max: number | null) => {
  if (max === null) return `${current} / Ilimitado`;
  return `${current} / ${max}`;
};

export const usePlanUsage = usePlanLimits;

export function usePlanLimits(): PlanLimits {
  const { authUser } = useAuth();
  const tenant = authUser?.tenant;

  const { data: counts, isLoading, refetch } = useQuery({
    queryKey: ['plan-limits-counts', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return { users: 0, cranes: 0, operators: 0 };

      // Count users (profiles linked to tenant)
      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('is_active', true);

      if (userError) throw userError;

      // Count cranes
      const { count: craneCount, error: craneError } = await supabase
        .from('cranes')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id);

      if (craneError) throw craneError;

      // Count operators
      const { count: operatorCount, error: operatorError } = await supabase
        .from('operators')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id);

      if (operatorError) throw operatorError;

      return {
        users: userCount || 0,
        cranes: craneCount || 0,
        operators: operatorCount || 0,
      };
    },
    enabled: !!tenant?.id,
  });

  const maxUsers = tenant?.max_users ?? null;
  const maxCranes = tenant?.max_cranes ?? null;
  const maxOperators = tenant?.max_operators ?? null;
  
  const currentUsers = counts?.users || 0;
  const currentCranes = counts?.cranes || 0;
  const currentOperators = counts?.operators || 0;

  // If max is null, we assume unlimited. If it's 0, it means 0 allowed.
  const canCreateUser = maxUsers === null || currentUsers < maxUsers;
  const canCreateCrane = maxCranes === null || currentCranes < maxCranes;
  const canCreateOperator = maxOperators === null || currentOperators < maxOperators;

  return {
    maxUsers,
    currentUsers,
    maxCranes,
    currentCranes,
    maxOperators,
    currentOperators,
    canCreateUser,
    canCreateCrane,
    canCreateOperator,
    isLoading,
    refetch,
  };
}

export function useCreateUpgradeRequest() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      current_plan: string;
      requested_plan: string;
      contact_name: string;
      contact_email: string;
      contact_phone: string | null;
      message: string | null;
    }) => {
      if (!authUser?.tenant?.id) throw new Error('No tenant');

      const { error } = await supabase.from('upgrade_requests').insert({
        tenant_id: authUser.tenant.id,
        current_plan: data.current_plan,
        requested_plan: data.requested_plan,
        contact_name: data.contact_name,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        message: data.message,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Solicitud enviada', {
        description: 'Nos pondremos en contacto contigo pronto.',
      });
    },
    onError: (error) => {
      console.error('Error creating upgrade request:', error);
      toast.error('Error al enviar solicitud', {
        description: 'Por favor intenta de nuevo.',
      });
    },
  });
}

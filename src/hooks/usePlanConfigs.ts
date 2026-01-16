import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlanFeature {
  id: string;
  plan_config_id: string;
  feature_text: string;
  sort_order: number;
}

export interface PlanConfig {
  id: string;
  plan_key: string;
  name: string;
  price: string;
  price_amount: number;
  max_cranes: number | null;
  max_users: number | null;
  max_operators: number | null;
  max_clients: number | null;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  features?: PlanFeature[];
}

// No default configs - all data comes from database

export function usePlanConfigs() {
  return useQuery({
    queryKey: ['plan-configs'],
    queryFn: async () => {
      // Fetch plan configs
      const { data: configs, error: configsError } = await supabase
        .from('plan_configs')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (configsError) throw configsError;

      if (!configs || configs.length === 0) {
        return [];
      }

      // Fetch all features
      const { data: features, error: featuresError } = await supabase
        .from('plan_features')
        .select('*')
        .order('sort_order');

      if (featuresError) throw featuresError;

      // Map features to their plans
      const plansWithFeatures = configs.map((config) => ({
        ...config,
        features: (features || []).filter((f) => f.plan_config_id === config.id),
      }));

      return plansWithFeatures as PlanConfig[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

export function usePlanConfigByKey(planKey: string) {
  const { data: configs, ...rest } = usePlanConfigs();
  const planConfig = configs?.find((c) => c.plan_key === planKey);
  return { data: planConfig, ...rest };
}

export function useUpdatePlanConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<PlanConfig, 'id' | 'features'>>;
    }) => {
      const { error } = await supabase
        .from('plan_configs')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-configs'] });
      toast.success('Plan actualizado correctamente');
    },
    onError: (error) => {
      toast.error('Error al actualizar el plan: ' + error.message);
    },
  });
}

export function useUpdatePlanFeatures() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      planConfigId,
      features,
    }: {
      planConfigId: string;
      features: string[];
    }) => {
      // Delete existing features
      const { error: deleteError } = await supabase
        .from('plan_features')
        .delete()
        .eq('plan_config_id', planConfigId);

      if (deleteError) throw deleteError;

      // Insert new features
      if (features.length > 0) {
        const newFeatures = features.map((text, index) => ({
          plan_config_id: planConfigId,
          feature_text: text,
          sort_order: index + 1,
        }));

        const { error: insertError } = await supabase
          .from('plan_features')
          .insert(newFeatures);

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-configs'] });
    },
    onError: (error) => {
      toast.error('Error al actualizar características: ' + error.message);
    },
  });
}

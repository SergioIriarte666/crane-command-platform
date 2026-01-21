import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useCallback } from 'react';
import { applyPrimaryColor } from '@/hooks/useThemeColor';
import { useTheme } from 'next-themes';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  animations: boolean;
  highContrast: boolean;
  primaryColor: string | null;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  compactMode: false,
  animations: true,
  highContrast: false,
  primaryColor: null,
};

export function useUserPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async (): Promise<UserPreferences> => {
      if (!user?.id) return DEFAULT_PREFERENCES;

      const { data, error } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching preferences:', error);
        return DEFAULT_PREFERENCES;
      }

      return {
        ...DEFAULT_PREFERENCES,
        ...(data?.preferences as Partial<UserPreferences> || {}),
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateUserPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Get current preferences first
      const { data: current } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();

      const currentPrefs = (current?.preferences as unknown as UserPreferences) || DEFAULT_PREFERENCES;
      const newPrefs = { ...currentPrefs, ...preferences };

      const { error } = await supabase
        .from('profiles')
        .update({ preferences: newPrefs })
        .eq('id', user.id);

      if (error) throw error;

      return newPrefs;
    },
    onSuccess: (newPrefs) => {
      queryClient.setQueryData(['user-preferences', user?.id], newPrefs);
    },
  });
}

export function applyPreferencesToDocument(preferences: UserPreferences) {
  const html = document.documentElement;

  if (preferences.compactMode) {
    html.classList.add('compact-mode');
  } else {
    html.classList.remove('compact-mode');
  }

  if (!preferences.animations) {
    html.classList.add('no-animations');
  } else {
    html.classList.remove('no-animations');
  }

  if (preferences.highContrast) {
    html.classList.add('high-contrast');
  } else {
    html.classList.remove('high-contrast');
  }

  applyPrimaryColor(preferences.primaryColor);
}

export function useApplyPreferences() {
  const { data: preferences } = useUserPreferences();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (preferences) {
      applyPreferencesToDocument(preferences);
      // Apply theme from saved preferences
      if (preferences.theme) {
        setTheme(preferences.theme);
      }
    }
  }, [preferences, setTheme]);

  const applyNow = useCallback((prefs: UserPreferences) => {
    applyPreferencesToDocument(prefs);
    if (prefs.theme) {
      setTheme(prefs.theme);
    }
  }, [setTheme]);

  return { applyNow };
}

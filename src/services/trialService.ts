
import { supabase } from '@/integrations/supabase/client';

export interface TrialSettings {
  id: string;
  is_active: boolean;
  default_duration_days: number;
  allowed_durations: number[];
  trial_plan: string;
  created_at: string;
  updated_at: string;
}

export const trialService = {
  // Get trial settings
  async getSettings() {
    const { data, error } = await supabase
      .from('trial_settings')
      .select('*')
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "No rows found"
    return data as TrialSettings | null;
  },

  // Update or create trial settings
  async updateSettings(settings: Partial<TrialSettings>) {
    // Check if exists first
    const existing = await this.getSettings();

    if (existing) {
      const { data, error } = await supabase
        .from('trial_settings')
        .update(settings)
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as TrialSettings;
    } else {
      const { data, error } = await supabase
        .from('trial_settings')
        .insert(settings)
        .select()
        .single();
      
      if (error) throw error;
      return data as TrialSettings;
    }
  },

  // Log action
  async logAction(action: string, actorId: string, targetTenantId: string | null, details: any = null) {
    const { error } = await supabase
      .from('trial_audit_logs')
      .insert({
        action,
        actor_id: actorId,
        target_tenant_id: targetTenantId,
        details
      });
    
    if (error) console.error('Error logging trial action:', error);
  },

  // Start a trial for a tenant
  async startTrial(tenantId: string, durationDays: number, actorId?: string) {
    // 1. Check for duplicate trials by email
    const { data: tenant } = await supabase
      .from('tenants')
      .select('email')
      .eq('id', tenantId)
      .single();

    if (tenant?.email) {
      const { data: existingTrials } = await supabase
        .from('tenants')
        .select('id')
        .eq('email', tenant.email)
        .not('trial_ends_at', 'is', null)
        .neq('id', tenantId); // Exclude self

      if (existingTrials && existingTrials.length > 0) {
        throw new Error('Este email ya ha utilizado una prueba gratuita anteriormente.');
      }
    }

    // 2. Get trial settings for plan
    const settings = await this.getSettings();
    const trialPlan = settings?.trial_plan || 'basic';

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    const { data, error } = await supabase
      .from('tenants')
      .update({
        is_trial: true,
        trial_ends_at: endDate.toISOString(),
        plan: trialPlan
      })
      .eq('id', tenantId)
      .select()
      .single();

    if (error) throw error;
    
    // Log the action
    if (actorId) {
      await this.logAction('START_TRIAL', actorId, tenantId, { durationDays, endDate, plan: trialPlan });
    }
    
    return data;
  },

  // End a trial
  async endTrial(tenantId: string, actorId?: string) {
    const { data, error } = await supabase
      .from('tenants')
      .update({
        is_trial: false,
        trial_ends_at: new Date().toISOString(), // Ended now
      })
      .eq('id', tenantId)
      .select()
      .single();

    if (error) throw error;

    // Log the action
    if (actorId) {
      await this.logAction('END_TRIAL', actorId, tenantId, { reason: 'manual_stop' });
    }

    return data;
  },

  // Check trial status
  checkTrialStatus(trialEndsAt: string | null) {
    if (!trialEndsAt) return 'none';
    const end = new Date(trialEndsAt);
    const now = new Date();
    
    if (now > end) return 'expired';
    
    const diffTime = Math.abs(end.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return 'expiring_soon';
    return 'active';
  }
};

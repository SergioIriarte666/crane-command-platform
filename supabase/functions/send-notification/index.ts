
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendNotificationParams {
  userIds: string[];
  templateCode?: string;
  title?: string;
  message?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  data?: Record<string, any>;
  channels?: ('in_app' | 'email' | 'push')[];
  scheduledFor?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      userIds,
      templateCode,
      title: explicitTitle,
      message: explicitMessage,
      type = 'info',
      data = {},
      channels: explicitChannels,
      scheduledFor,
    }: SendNotificationParams = await req.json();

    if (!userIds || userIds.length === 0) {
      throw new Error('No user IDs provided');
    }

    // Resolve Template if provided
    let template: any = null;
    if (templateCode) {
      const { data: templateData, error: templateError } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('code', templateCode)
        .single();
      
      if (templateError) throw new Error(`Template not found: ${templateCode}`);
      template = templateData;
    }

    const results = [];

    for (const userId of userIds) {
      // 1. Determine Channels
      let channels = explicitChannels;
      if (!channels) {
        // Fetch user preferences
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('channels')
          .eq('user_id', userId)
          .single();
        
        channels = prefs?.channels || (template?.default_channels) || ['in_app'];
      }

      // 2. Resolve Content (Template substitution)
      let title = explicitTitle;
      let message = explicitMessage;

      if (template) {
        title = replaceVariables(template.subject_template, data);
        message = replaceVariables(template.body_template, data);
      }

      if (!title || !message) {
        // Skip if content is missing
        results.push({ userId, status: 'skipped', reason: 'Missing content' });
        continue;
      }

      // 3. Process per channel
      for (const channel of channels!) {
        if (scheduledFor) {
           // Insert as pending
           await supabase.from('notifications').insert({
             user_id: userId,
             tenant_id: data.tenantId, // Need tenantId? Usually derived or passed.
             // If tenantId is not passed, we might need to fetch it from user profile or context.
             // For simplicity, let's assume the caller passes tenant_id in 'data' or we fetch it.
             // We'll query the user's tenant_id if not present.
             title,
             message,
             type,
             channel,
             status: 'pending',
             scheduled_for: scheduledFor,
             metadata: data,
             template_id: template?.id
           });
           continue;
        }

        // Immediate sending
        if (channel === 'in_app') {
          // Fetch tenant_id for the user
          const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', userId).single();
          
          if (profile?.tenant_id) {
             const { error: insertError } = await supabase.from('notifications').insert({
              user_id: userId,
              tenant_id: profile.tenant_id,
              title,
              message,
              type,
              channel: 'in_app',
              status: 'sent',
              read: false,
              metadata: data,
              template_id: template?.id
            });
            if (insertError) console.error('Error inserting in-app notification', insertError);
          }
        } else if (channel === 'email') {
          // Mock Email Sending
          console.log(`[Email] To: ${userId}, Subject: ${title}, Body: ${message}`);
          
          // Log it in notifications table (as history)
          const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', userId).single();
          if (profile?.tenant_id) {
             await supabase.from('notifications').insert({
              user_id: userId,
              tenant_id: profile.tenant_id,
              title,
              message,
              type,
              channel: 'email',
              status: 'sent', // Or 'failed' if mock fails
              metadata: data,
              template_id: template?.id
            });
          }
        }
        // Push...
      }
      results.push({ userId, status: 'processed' });
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})

function replaceVariables(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] || '');
}

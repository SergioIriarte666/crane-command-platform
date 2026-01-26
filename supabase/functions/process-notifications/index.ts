
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch pending notifications
    // Limit to batch size (e.g., 50) to avoid timeouts
    const { data: pending, error } = await supabase
      .from('notifications')
      .select('*')
      .in('status', ['pending'])
      .or(`scheduled_for.is.null,scheduled_for.lte.${new Date().toISOString()}`)
      .limit(50);

    if (error) throw error;

    const results = [];

    for (const notification of pending) {
      try {
        // Update to processing
        await supabase
          .from('notifications')
          .update({ status: 'processing' })
          .eq('id', notification.id);

        // Process based on channel
        if (notification.channel === 'email') {
           // Mock Email Send
           console.log(`[Email] Processing ID: ${notification.id}, To: ${notification.user_id}, Subject: ${notification.title}`);
           // In real implementation: await sendEmail(...)
        } else if (notification.channel === 'push') {
           // Mock Push
           console.log(`[Push] Processing ID: ${notification.id}, To: ${notification.user_id}`);
        }
        
        // Update to sent
        await supabase
          .from('notifications')
          .update({ status: 'sent', updated_at: new Date().toISOString() })
          .eq('id', notification.id);
        
        results.push({ id: notification.id, status: 'sent' });
      } catch (err: any) {
        console.error(`Error processing notification ${notification.id}:`, err);
        await supabase
          .from('notifications')
          .update({ status: 'failed', metadata: { ...notification.metadata, error: err.message } })
          .eq('id', notification.id);
        
        results.push({ id: notification.id, status: 'failed', error: err.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})

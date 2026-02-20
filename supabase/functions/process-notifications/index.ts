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

        console.log(`Processing notification ${notification.id} via ${notification.channel}`);

        // Process based on channel
        if (notification.channel === 'whatsapp' || notification.channel === 'sms') {
          const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
          const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
          const messagingServiceSid = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID');
          
          if (!accountSid || !authToken) {
            throw new Error('Twilio credentials not configured');
          }

          if (!notification.metadata?.phone) {
             console.error(`Notification ${notification.id} missing phone number in metadata`);
             throw new Error('No phone number provided in metadata');
          }

          const phone = notification.metadata.phone;
          const to = notification.channel === 'whatsapp' 
            ? (phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`)
            : phone;
            
          let from = notification.channel === 'whatsapp'
            ? (Deno.env.get('TWILIO_WHATSAPP_NUMBER') || 'whatsapp:+14155238886')
            : (Deno.env.get('TWILIO_PHONE_NUMBER') || messagingServiceSid);

          // Asegurar prefijo whatsapp: en 'From' si el canal es whatsapp
          if (notification.channel === 'whatsapp' && from && !from.startsWith('whatsapp:')) {
            from = `whatsapp:${from}`;
          }

          if (!to) throw new Error('No phone number provided in metadata');

          // Encode credentials for Basic Auth
          const basicAuth = btoa(`${accountSid}:${authToken}`)

          // Create form data for the request
          const formData = new URLSearchParams()
          formData.append('To', to)
          formData.append('From', from || '')
          formData.append('Body', notification.message)

          // Make direct fetch request to Twilio API
          const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formData.toString(),
            }
          )

          if (!response.ok) {
             const errorData = await response.json();
             throw new Error(errorData.message || 'Twilio API Error');
          }
          
          console.log(`[Twilio] Sent ${notification.channel} to ${to}`);

        } else if (notification.channel === 'email') {
           // Mock Email Send
           console.log(`[Email] Processing ID: ${notification.id}, To: ${notification.user_id}, Subject: ${notification.title}`);
           // In real implementation: await sendEmail(...)
        } else if (notification.channel === 'push') {
           // Mock Push
           console.log(`[Push] Processing ID: ${notification.id}, To: ${notification.user_id}`);
        } else {
           // Default/In-App only requires DB update which is done below
           console.log(`[In-App] Notification ${notification.id} ready`);
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
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})

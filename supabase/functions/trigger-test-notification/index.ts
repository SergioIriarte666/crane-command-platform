import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { phone, channel = 'whatsapp' } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Get a user ID (any user) to associate the notification with
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, tenant_id')
      .limit(1)
    
    let userId = null;
    let tenantId = null;
    if (users && users.length > 0) {
        userId = users[0].id;
        tenantId = users[0].tenant_id;
    } else {
        // Fallback: try to get from auth.users via admin api if possible, or just fail/warn
        // Since we can't easily access auth.users from here without admin key (which we have), let's try.
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
        if (authUsers && authUsers.users.length > 0) {
            userId = authUsers.users[0].id;
        }
    }

    if (!userId) {
        throw new Error('No user found to assign notification to. Please sign up a user first.');
    }

    // 2. Insert notification
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        tenant_id: tenantId,
        title: 'Nuevo Servicio Asignado',
        message: '🔔 Crane Command: Se te ha asignado el servicio #TEST-001. Cliente: Demo. Origen: Base Central.',
        channel,
        status: 'pending',
        metadata: {
            phone: phone, // Use provided phone for the test
            service_id: 'test-service-id'
        }
      })
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, notification: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error(error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

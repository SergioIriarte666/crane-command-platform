
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { phone } = await req.json()
    
    if (!phone) {
      throw new Error('El campo "phone" es requerido en el cuerpo de la solicitud')
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const fromNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER')

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Faltan credenciales de Twilio en Supabase Secrets')
    }

    const to = phone.startsWith('whatsapp:') ? phone : `whatsapp:${phone}`
    const from = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`

    console.log(`Sending from ${from} to ${to}`)

    // Encode credentials for Basic Auth
    const basicAuth = btoa(`${accountSid}:${authToken}`)

    // Create form data for the request
    const formData = new URLSearchParams()
    formData.append('To', to)
    formData.append('From', from)
    formData.append('Body', '🔔 Crane Command: Esta es una prueba de conexión exitosa. Tu integración con Twilio está funcionando.')

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

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Error al enviar mensaje a Twilio')
    }

    return new Response(
      JSON.stringify({ success: true, sid: data.sid }),
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

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
    
    // Create Supabase client with Admin context
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the user from the authorization header (to verify caller permissions)
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !caller) {
      throw new Error('No autorizado');
    }

    // Verify caller is super_admin
    const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', { user_id: caller.id });
    
    if (!isSuperAdmin) {
      throw new Error('Solo los super administradores pueden crear usuarios manualmente');
    }

    const { email, fullName, role, tenantId: requestedTenantId, mustChangePassword } = await req.json();

    if (!email || !fullName || !role) {
      throw new Error('Faltan datos requeridos (email, fullName, role)');
    }

    // Determine target tenant
    const targetTenantId = requestedTenantId;

    if (!targetTenantId) {
      throw new Error('No se pudo determinar la empresa del usuario. Se requiere tenantId.');
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

    // 1. Create Invitation Record (for consistency with invitation flow)
    // This allows us to reuse the process_invitation_on_signup logic if it triggers,
    // and keeps a record of the "invite".
    const { error: inviteError } = await supabase
      .from('invitations')
      .insert({
        tenant_id: targetTenantId,
        email,
        role,
        invited_by: caller.id,
        // We don't set accepted_at yet, so the trigger can find it
      });

    if (inviteError) {
      console.error('Error creating invitation record:', inviteError);
      // Continue anyway? No, validation might fail (duplicate invite).
      // But if user doesn't exist, invite shouldn't exist ideally.
      // If invite exists, we might want to overwrite it or error.
      throw new Error('Error al preparar la invitación: ' + inviteError.message);
    }

    // 2. Create User in Auth
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (createError) {
      // Cleanup invitation if user creation fails
      await supabase.from('invitations').delete().eq('email', email).eq('tenant_id', targetTenantId);
      throw createError;
    }

    if (!newUser.user) {
      throw new Error('No se pudo crear el usuario');
    }

    // 3. Ensure Profile Exists and Trigger Logic
    // The 'process_invitation_on_signup' trigger runs AFTER INSERT on public.profiles.
    // We need to ensure public.profiles is inserted.
    // If the system has a trigger on auth.users -> public.profiles, it might have run already.
    // Let's check if profile exists.
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', newUser.user.id)
      .single();

    if (!profile) {
      // Manual profile creation if not auto-created
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUser.user.id,
          email: email,
          full_name: fullName,
          tenant_id: targetTenantId, // Set directly just in case
          role: role, // If profile has role column? Usually role is in user_roles.
          must_change_password: mustChangePassword || false
        });
      
      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Don't throw, maybe partial success?
      }
    } else {
      // Profile exists (auto-created), but we need to ensure Tenant/Role are assigned.
      // The trigger 'process_invitation_on_signup' might have run if profile was created AFTER invitation insert.
      // But if profile was created BEFORE invitation insert (unlikely here), we need to run logic manually.
      // However, we inserted invitation FIRST. So if profile creation triggered the function, it should have found the invitation.
      
      // Update must_change_password if needed
      if (mustChangePassword) {
        await supabase
          .from('profiles')
          .update({ must_change_password: true })
          .eq('id', newUser.user.id);
      }
      
      // Let's double check if user_role exists
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', newUser.user.id)
        .eq('tenant_id', targetTenantId);

      if (!userRoles || userRoles.length === 0) {
        // Manually assign role if trigger didn't catch it
        await supabase
          .from('user_roles')
          .insert({
            user_id: newUser.user.id,
            tenant_id: targetTenantId,
            role: role
          });
          
        // And update profile tenant
        await supabase
          .from('profiles')
          .update({ tenant_id: targetTenantId })
          .eq('id', newUser.user.id);

        // And mark invitation accepted
        await supabase
          .from('invitations')
          .update({ accepted_at: new Date().toISOString() })
          .eq('email', email)
          .eq('tenant_id', targetTenantId);
      }
    }

    // 4. Audit Log
    await supabase.from('audit_logs').insert({
      action: 'manual_user_creation',
      actor_id: caller.id,
      target_resource: 'auth.users',
      target_id: newUser.user.id,
      tenant_id: targetTenantId,
      details: {
        email,
        role,
        invited_by: caller.id,
        must_change_password: mustChangePassword
      }
    });

    // 5. Send Email (Placeholder / Return Credentials)
    // If RESEND_API_KEY is present, we could send email here.
    // For now, return the credentials.

    return new Response(
      JSON.stringify({
        success: true,
        user: newUser.user,
        tempPassword: tempPassword,
        message: 'Usuario creado exitosamente. Por favor comparta la contraseña temporal con el usuario.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

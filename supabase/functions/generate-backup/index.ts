import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { AuthValidator } from './authValidator.ts'
import { BackupLogger } from './backupLogger.ts'
import { BackupGenerators } from './backupGenerators.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! }
      }
    });

    // Validate authentication
    const authValidator = new AuthValidator(supabase);
    const { user, tenantId, isSuperAdmin } = await authValidator.validateRequest(
      req.headers.get('Authorization')
    );

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const type = body.type || 'full';
    const format = body.format || 'json';

    // Restrict SQL dumps to super_admin
    if (format === 'sql' && !isSuperAdmin) {
      throw new Error('Solo los super administradores pueden generar respaldos SQL');
    }

    console.log(`Generating ${type} backup in ${format} format for user ${user.email}`);

    // Initialize logger and generators
    const logger = new BackupLogger(supabase);
    const generators = new BackupGenerators(supabase, tenantId);

    // Create log entry
    const backupType = `${type}_${format}`;
    const logId = await logger.startLog(backupType, user.id, tenantId);

    try {
      let result;

      // Generate backup based on type and format
      if (type === 'quick') {
        result = await generators.generateQuickBackup(user.email);
      } else if (format === 'sql') {
        result = await generators.generateSQLBackup(user.email);
      } else {
        result = await generators.generateFullBackup(user.email);
      }

      // Update log with success
      if (logId) {
        await logger.completeLog(logId, result.size, {
          fileName: result.fileName,
          contentType: result.contentType,
          format: format
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          fileName: result.fileName,
          content: result.content,
          size: result.size,
          type: type,
          format: format
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (genError: unknown) {
      // Log failure
      if (logId) {
        const errorMessage = genError instanceof Error ? genError.message : 'Unknown error';
        await logger.failLog(logId, errorMessage);
      }
      throw genError;
    }

  } catch (error: unknown) {
    console.error('Backup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al generar respaldo';
    const isAuthError = errorMessage.includes('autenticado') || errorMessage.includes('administrador');
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        status: isAuthError ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

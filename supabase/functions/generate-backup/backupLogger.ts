import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface BackupLogData {
  id?: string;
  backup_type: string;
  status: 'started' | 'completed' | 'failed';
  created_by: string;
  tenant_id: string;
  file_size_bytes?: number;
  metadata?: Record<string, unknown>;
  error_message?: string;
}

export class BackupLogger {
  constructor(private supabase: SupabaseClient) {}

  async startLog(backupType: string, userId: string, tenantId: string): Promise<string | null> {
    try {
      const { data: logData, error: logError } = await this.supabase
        .from('backup_logs')
        .insert({
          backup_type: backupType,
          status: 'started',
          created_by: userId,
          tenant_id: tenantId
        })
        .select()
        .single();

      if (logError) {
        console.error('Error creating backup log:', logError);
        return null;
      }

      return logData?.id || null;
    } catch (error) {
      console.error('Exception creating backup log:', error);
      return null;
    }
  }

  async completeLog(logId: string, fileSize: number, metadata: Record<string, unknown>): Promise<void> {
    try {
      const { error: updateError } = await this.supabase
        .from('backup_logs')
        .update({
          status: 'completed',
          file_size_bytes: fileSize,
          metadata
        })
        .eq('id', logId);

      if (updateError) {
        console.error('Error updating backup log:', updateError);
      }
    } catch (error) {
      console.error('Exception updating backup log:', error);
    }
  }

  async failLog(logId: string, errorMessage: string): Promise<void> {
    try {
      const { error: updateError } = await this.supabase
        .from('backup_logs')
        .update({
          status: 'failed',
          error_message: errorMessage
        })
        .eq('id', logId);

      if (updateError) {
        console.error('Error updating backup log with error:', updateError);
      }
    } catch (error) {
      console.error('Exception updating backup log with error:', error);
    }
  }
}

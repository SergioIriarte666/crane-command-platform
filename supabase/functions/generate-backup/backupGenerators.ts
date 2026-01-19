import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export interface BackupResult {
  content: string;
  fileName: string;
  contentType: string;
  size: number;
}

export class BackupGenerators {
  constructor(private supabase: SupabaseClient, private tenantId: string) {}

  async generateQuickBackup(userEmail: string): Promise<BackupResult> {
    console.log('Generating quick backup...');
    
    const { data, error } = await this.supabase.rpc('generate_quick_backup');
    
    if (error) {
      console.error('Error generating quick backup:', error);
      throw new Error(`Error al generar respaldo rápido: ${error.message}`);
    }

    const content = JSON.stringify(data, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `backup-config-${timestamp}.json`;

    return {
      content,
      fileName,
      contentType: 'application/json',
      size: new TextEncoder().encode(content).length
    };
  }

  async generateFullBackup(userEmail: string): Promise<BackupResult> {
    console.log('Generating full JSON backup...');
    
    const tables = [
      'clients',
      'operators',
      'cranes',
      'suppliers',
      'services',
      'costs',
      'cost_categories',
      'invoices',
      'commissions',
      'payments',
      'catalog_items'
    ];

    const backupData: Record<string, unknown> = {
      metadata: {
        generated_at: new Date().toISOString(),
        generated_by: userEmail,
        tenant_id: this.tenantId,
        type: 'full',
        format: 'json',
        version: '1.0'
      },
      data: {}
    };

    for (const table of tables) {
      try {
        const { data, error } = await this.supabase
          .from(table)
          .select('*')
          .eq('tenant_id', this.tenantId);
        
        if (!error && data) {
          (backupData.data as Record<string, unknown>)[table] = data;
        }
      } catch (e) {
        console.warn(`Could not backup table ${table}:`, e);
      }
    }

    const content = JSON.stringify(backupData, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `backup-full-${timestamp}.json`;

    return {
      content,
      fileName,
      contentType: 'application/json',
      size: new TextEncoder().encode(content).length
    };
  }

  async generateSQLBackup(userEmail: string): Promise<BackupResult> {
    console.log('Generating SQL backup...');
    
    const { data, error } = await this.supabase.rpc('generate_database_backup');
    
    if (error) {
      console.error('Error generating SQL backup:', error);
      throw new Error(`Error al generar dump SQL: ${error.message}`);
    }

    const content = data as string;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `backup-dump-${timestamp}.sql`;

    return {
      content,
      fileName,
      contentType: 'application/sql',
      size: new TextEncoder().encode(content).length
    };
  }
}

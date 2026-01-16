import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import type { BackupLog, BackupProgress, BackupResult } from '@/types/backup';

export const useBackupManager = () => {
  const { authUser } = useAuth();
  const [progress, setProgress] = useState<BackupProgress>({
    isGenerating: false,
    progress: 0,
    stage: ''
  });

  // Query para obtener logs de respaldos
  const { 
    data: backupLogs, 
    error, 
    refetch: refetchLogs 
  } = useQuery({
    queryKey: ['backup-logs', authUser?.tenant?.id],
    queryFn: async () => {
      if (!authUser?.tenant?.id) return [];
      
      const { data, error } = await supabase
        .from('backup_logs')
        .select('*')
        .eq('tenant_id', authUser.tenant.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as BackupLog[];
    },
    enabled: !!authUser?.tenant?.id
  });

  // Generar respaldo
  const generateBackup = async (
    type: 'full' | 'quick' = 'full',
    format: 'json' | 'sql' = 'json'
  ): Promise<BackupResult> => {
    if (!authUser?.tenant?.id) {
      throw new Error('No hay tenant asociado');
    }

    setProgress({
      isGenerating: true,
      progress: 10,
      stage: 'Iniciando respaldo...'
    });

    try {
      // Crear log inicial
      const backupType = `${type}_${format}`;
      let logId: string | null = null;
      
      try {
        const { data: logData, error: logError } = await supabase
          .from('backup_logs')
          .insert({
            backup_type: backupType,
            status: 'started' as const,
            created_by: authUser.id,
            tenant_id: authUser.tenant.id
          })
          .select('id')
          .single();

        if (!logError && logData) {
          logId = logData.id;
        }
      } catch (e) {
        console.error('Error creating backup log:', e);
      }

      setProgress({
        isGenerating: true,
        progress: 30,
        stage: 'Extrayendo datos...'
      });

      let result: BackupResult;

      if (type === 'quick') {
        // Respaldo rápido usando RPC
        const { data, error } = await supabase.rpc('generate_quick_backup');
        
        if (error) throw error;
        
        const content = JSON.stringify(data, null, 2);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const fileName = `backup-config-${timestamp}.json`;
        
        result = {
          success: true,
          fileName,
          content,
          size: new TextEncoder().encode(content).length,
          format: 'json'
        };
      } else if (format === 'sql') {
        // Dump SQL usando RPC
        setProgress({
          isGenerating: true,
          progress: 50,
          stage: 'Generando dump SQL...'
        });

        const { data, error } = await supabase.rpc('generate_database_backup');
        
        if (error) throw error;
        
        const content = data as string;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const fileName = `backup-dump-${timestamp}.sql`;
        
        result = {
          success: true,
          fileName,
          content,
          size: new TextEncoder().encode(content).length,
          format: 'sql'
        };
      } else {
        // Respaldo JSON completo
        setProgress({
          isGenerating: true,
          progress: 40,
          stage: 'Exportando tablas...'
        });

        const tables = [
          'clients',
          'operators', 
          'cranes',
          'suppliers',
          'services',
          'costs',
          'cost_categories',
          'cost_subcategories',
          'invoices',
          'invoice_items',
          'billing_closures',
          'commissions',
          'payments',
          'catalog_items'
        ];

        const backupData: Record<string, unknown> = {
          metadata: {
            generated_at: new Date().toISOString(),
            generated_by: authUser.email,
            tenant_id: authUser.tenant.id,
            type: 'full',
            format: 'json',
            version: '1.0'
          },
          data: {}
        };

        let progressValue = 40;
        const progressIncrement = 40 / tables.length;

        for (const tableName of tables) {
          try {
            const { data: tableData, error: tableError } = await supabase
              .from(tableName as 'clients')
              .select('*');
            
            if (!tableError && tableData) {
              (backupData.data as Record<string, unknown>)[tableName] = tableData;
            }
            
            progressValue += progressIncrement;
            setProgress({
              isGenerating: true,
              progress: Math.min(progressValue, 80),
              stage: `Exportando ${tableName}...`
            });
          } catch (e) {
            console.warn(`Could not backup table ${tableName}:`, e);
          }
        }

        const content = JSON.stringify(backupData, null, 2);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const fileName = `backup-full-${timestamp}.json`;

        result = {
          success: true,
          fileName,
          content,
          size: new TextEncoder().encode(content).length,
          format: 'json'
        };
      }

      setProgress({
        isGenerating: true,
        progress: 90,
        stage: 'Finalizando...'
      });

      // Actualizar log con éxito
      if (logId) {
        try {
          await supabase
            .from('backup_logs')
            .update({
              status: 'completed' as const,
              file_size_bytes: result.size,
              metadata: {
                fileName: result.fileName,
                contentType: format === 'sql' ? 'application/sql' : 'application/json',
                format: format
              }
            })
            .eq('id', logId);
        } catch (e) {
          console.error('Error updating backup log:', e);
        }
      }

      setProgress({
        isGenerating: false,
        progress: 100,
        stage: 'Respaldo completado'
      });

      refetchLogs();
      return result;

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al generar respaldo';
      setProgress({
        isGenerating: false,
        progress: 0,
        stage: '',
        error: errorMessage
      });
      throw err;
    }
  };

  // Descargar archivo de respaldo
  const downloadBackup = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Combinar generación y descarga
  const generateAndDownloadBackup = async (
    type: 'full' | 'quick' = 'full',
    format: 'json' | 'sql' = 'json'
  ) => {
    try {
      toast.info('Generando respaldo...', { duration: 2000 });
      
      const result = await generateBackup(type, format);
      
      if (result.success && result.content && result.fileName) {
        const contentType = format === 'sql' 
          ? 'application/sql' 
          : 'application/json';
        
        downloadBackup(result.content, result.fileName, contentType);
        
        toast.success('Respaldo descargado exitosamente', {
          description: `Archivo: ${result.fileName}`
        });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast.error('Error al generar respaldo', {
        description: errorMessage
      });
    }
  };

  return {
    progress,
    backupLogs,
    generateBackup,
    downloadBackup,
    generateAndDownloadBackup,
    refetchLogs,
    error
  };
};

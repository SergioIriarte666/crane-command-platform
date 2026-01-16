import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Database, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { BackupLog } from '@/types/backup';

interface BackupHistorySectionProps {
  backupLogs?: BackupLog[];
}

export const BackupHistorySection: React.FC<BackupHistorySectionProps> = ({ backupLogs }) => {
  
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800">Completado</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800">Fallido</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800">En progreso</Badge>;
    }
  };

  const getBackupTypeLabel = (type: string) => {
    if (type.includes('quick')) return 'Configuración';
    return 'Completo';
  };

  const getFormatLabel = (type: string, metadata?: { format?: string }) => {
    if (metadata?.format) return metadata.format.toUpperCase();
    if (type.includes('sql')) return 'SQL';
    if (type.includes('json')) return 'JSON';
    return '';
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground">Historial de Respaldos</h4>
      
      {backupLogs && backupLogs.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {backupLogs.slice(0, 10).map((log) => (
            <div 
              key={log.id} 
              className="flex items-center justify-between p-3 border rounded-lg bg-background border-border"
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(log.status)}
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {getBackupTypeLabel(log.backup_type)}
                    {' '}
                    <span className="text-muted-foreground">
                      ({getFormatLabel(log.backup_type, log.metadata)})
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground block">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: es })}
                    {log.file_size_bytes && ` • ${formatFileSize(log.file_size_bytes)}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(log.status)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed border-border">
          <Database className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm">No hay respaldos registrados</p>
        </div>
      )}
    </div>
  );
};

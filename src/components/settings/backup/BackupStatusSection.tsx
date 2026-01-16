import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { BackupLog } from '@/types/backup';

interface BackupStatusSectionProps {
  lastSuccessfulBackup?: BackupLog;
  hookError?: Error | null;
}

export const BackupStatusSection: React.FC<BackupStatusSectionProps> = ({
  lastSuccessfulBackup,
  hookError
}) => {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-foreground">Estado del Sistema</h4>
      
      {/* Error del hook */}
      {hookError && (
        <Alert variant="destructive" className="bg-background border-destructive/50">
          <XCircle className="w-4 h-4 text-destructive" />
          <AlertDescription className="text-destructive">
            Error al cargar datos de respaldos: {hookError.message}
          </AlertDescription>
        </Alert>
      )}

      {lastSuccessfulBackup ? (
        <Alert className="bg-background border-green-200 dark:border-green-800">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            Último respaldo exitoso: {' '}
            {formatDistanceToNow(new Date(lastSuccessfulBackup.created_at), {
              addSuffix: true,
              locale: es
            })}
            {lastSuccessfulBackup.metadata?.fileName && (
              <span className="block text-xs mt-1 text-green-600 dark:text-green-500">
                Archivo: {lastSuccessfulBackup.metadata.fileName}
              </span>
            )}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-background border-yellow-200 dark:border-yellow-800">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <AlertDescription className="text-yellow-700 dark:text-yellow-400">
            No se encontraron respaldos anteriores. Se recomienda generar un respaldo.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

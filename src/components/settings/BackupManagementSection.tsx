import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, AlertTriangle, RefreshCw } from 'lucide-react';
import { useBackupManager } from '@/hooks/useBackupManager';
import { BackupStatusSection } from './backup/BackupStatusSection';
import { BackupControlsSection } from './backup/BackupControlsSection';
import { BackupHistorySection } from './backup/BackupHistorySection';

export const BackupManagementSection = () => {
  const {
    progress,
    backupLogs,
    generateAndDownloadBackup,
    error: hookError,
    refetchLogs
  } = useBackupManager();

  const lastSuccessfulBackup = backupLogs?.find(log => log.status === 'completed');

  return (
    <Card className="bg-card border-border mt-6">
      <CardHeader className="border-b border-border p-6">
        <CardTitle className="flex items-center justify-between text-foreground">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-primary" />
            <span>Gestión de Respaldos</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => refetchLogs()} 
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <BackupStatusSection 
          lastSuccessfulBackup={lastSuccessfulBackup}
          hookError={hookError as Error | null}
        />

        <Separator className="bg-border" />

        <BackupControlsSection 
          progress={progress}
          onGenerateBackup={generateAndDownloadBackup}
        />

        <Separator className="bg-border" />

        <BackupHistorySection backupLogs={backupLogs} />

        {/* Información adicional */}
        <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50">
          <AlertTriangle className="w-4 h-4 text-blue-500" />
          <AlertDescription className="text-sm text-blue-700 dark:text-blue-400">
            <strong>Importante:</strong> Almacene los respaldos en ubicaciones seguras y externas al sistema. 
            Los respaldos completos permiten restauración total en caso de emergencia.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

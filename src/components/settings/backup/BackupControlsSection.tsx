import React from 'react';
import { Button } from '@/components/ui/button';
import { Database, FileJson, Settings, Loader2 } from 'lucide-react';
import { BackupProgressDisplay } from './BackupProgressDisplay';
import type { BackupProgress } from '@/types/backup';

interface BackupControlsSectionProps {
  progress: BackupProgress;
  onGenerateBackup: (type: 'full' | 'quick', format?: 'json' | 'sql') => Promise<void>;
}

export const BackupControlsSection: React.FC<BackupControlsSectionProps> = ({
  progress,
  onGenerateBackup
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-foreground">Generar Respaldo Manual</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Respaldo Completo */}
        <div className="space-y-3 p-4 border rounded-lg bg-muted/50 border-border">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-primary" />
            <span className="font-medium text-foreground">Respaldo Completo</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Exporta todas las tablas del sistema incluyendo servicios, clientes, 
            operadores, grúas, costos, facturas y configuración.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => onGenerateBackup('full', 'sql')}
              disabled={progress.isGenerating}
              size="sm"
              className="flex-1"
            >
              {progress.isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Database className="w-4 h-4 mr-2" />
              )}
              Dump SQL
            </Button>
            <Button
              onClick={() => onGenerateBackup('full', 'json')}
              disabled={progress.isGenerating}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              {progress.isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileJson className="w-4 h-4 mr-2" />
              )}
              Export JSON
            </Button>
          </div>
        </div>

        {/* Respaldo Rápido */}
        <div className="space-y-3 p-4 border rounded-lg bg-muted/50 border-border">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-foreground">Respaldo Rápido</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Exporta solo la configuración esencial: datos de empresa, 
            ajustes del sistema y contadores de folios.
          </p>
          <Button
            onClick={() => onGenerateBackup('quick', 'json')}
            disabled={progress.isGenerating}
            size="sm"
            variant="outline"
            className="w-full"
          >
            {progress.isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Settings className="w-4 h-4 mr-2" />
            )}
            Configuración JSON
          </Button>
        </div>
      </div>

      {/* Display de progreso */}
      <BackupProgressDisplay progress={progress} />
    </div>
  );
};

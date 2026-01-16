import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { XCircle } from 'lucide-react';
import type { BackupProgress } from '@/types/backup';

interface BackupProgressDisplayProps {
  progress: BackupProgress;
}

export const BackupProgressDisplay: React.FC<BackupProgressDisplayProps> = ({ progress }) => {
  if (!progress.isGenerating && !progress.error) {
    return null;
  }

  return (
    <div className="space-y-2">
      {progress.isGenerating && (
        <div className="space-y-2 p-4 rounded-lg border bg-background border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">{progress.stage}</span>
            <span className="text-muted-foreground">{progress.progress}%</span>
          </div>
          <Progress value={progress.progress} className="w-full h-2" />
        </div>
      )}

      {progress.error && (
        <Alert className="border-destructive/50 bg-background">
          <XCircle className="w-4 h-4 text-destructive" />
          <AlertDescription className="text-destructive">
            Error: {progress.error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

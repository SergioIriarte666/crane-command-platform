import { useState, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { RetroProgressBar } from '@/components/ui/retro-progress-bar';
import { CheckCircle2, XCircle, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { playRetroSuccessSound, playRetroErrorSound } from '@/lib/sounds';
import type { BatchProgressState } from '@/types/vipPipeline';

interface BatchProgressModalProps {
  state: BatchProgressState;
  onClose?: () => void;
}

export const BatchProgressModal = ({ state, onClose }: BatchProgressModalProps) => {
  const { isOpen, current, total, operationName, currentItemName, isComplete, hasError, errorMessage } = state;
  const percentage = total > 0 ? (current / total) * 100 : 0;

  const canClose = isComplete || hasError;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && canClose && onClose?.()}>
      <DialogContent className="bg-gray-950 border-cyan-500/50 text-white max-w-md">
        {/* Header with retro styling */}
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-cyan-400" />
          <h3 className="text-cyan-400 font-mono text-lg tracking-wider uppercase">
            {operationName}
          </h3>
        </div>

        {/* Progress bar */}
        <RetroProgressBar value={percentage} hasError={hasError} />

        {/* Current item */}
        {currentItemName && !isComplete && !hasError && (
          <p className="text-center text-cyan-300/70 font-mono text-sm mt-2 truncate">
            Procesando: {currentItemName}
          </p>
        )}

        {/* Counter and status */}
        <div className="flex items-center justify-center gap-3 mt-4">
          {hasError ? (
            <XCircle className="w-6 h-6 text-red-500" />
          ) : isComplete ? (
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          ) : (
            <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
          )}
          <span className={cn(
            'font-mono text-lg',
            hasError ? 'text-red-400' : isComplete ? 'text-green-400' : 'text-cyan-300'
          )}>
            {current} / {total}
          </span>
        </div>

        {/* Percentage */}
        <p className={cn(
          'text-center font-mono text-2xl font-bold',
          hasError ? 'text-red-400' : isComplete ? 'text-green-400' : 'text-cyan-400'
        )}>
          {Math.round(percentage)}%
        </p>

        {/* Error message */}
        {hasError && errorMessage && (
          <p className="text-center text-red-400 text-sm mt-2 font-mono">
            {errorMessage}
          </p>
        )}

        {/* Status message */}
        <p className={cn(
          'text-center text-sm mt-2',
          hasError ? 'text-red-300' : isComplete ? 'text-green-300' : 'text-cyan-300/70'
        )}>
          {hasError 
            ? 'Error en la operación' 
            : isComplete 
              ? '¡Operación completada!' 
              : 'Procesando...'}
        </p>

        {/* Close button when finished */}
        {canClose && (
          <Button 
            onClick={onClose}
            variant={hasError ? 'destructive' : 'default'}
            className="mt-4 w-full font-mono"
          >
            Cerrar
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Hook for managing batch progress state
export const useBatchProgress = () => {
  const [state, setState] = useState<BatchProgressState>({
    isOpen: false,
    current: 0,
    total: 0,
    operationName: '',
  });

  const start = useCallback((operationName: string, total: number) => {
    setState({
      isOpen: true,
      current: 0,
      total,
      operationName,
      isComplete: false,
      hasError: false,
    });
  }, []);

  const update = useCallback((current: number, currentItemName?: string) => {
    setState(prev => ({ ...prev, current, currentItemName }));
  }, []);

  const complete = useCallback(() => {
    playRetroSuccessSound();
    setState(prev => ({ ...prev, current: prev.total, isComplete: true }));
  }, []);

  const error = useCallback((message?: string) => {
    playRetroErrorSound();
    setState(prev => ({ ...prev, hasError: true, errorMessage: message }));
  }, []);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  return { state, start, update, complete, error, close };
};

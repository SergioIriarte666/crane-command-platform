import { useDroppable } from '@dnd-kit/core';
import { Check, ArrowRight, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/types/finance';
import type { Payment } from '@/types/finance';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface PaymentDropZoneProps {
  payment: Payment & { 
    client?: { id: string; name: string } | null;
    invoice?: { id: string; folio: string } | null;
  };
  draggedAmount?: number | null;
  onConfirm?: (paymentId: string) => Promise<void>;
}

export function PaymentDropZone({ payment, draggedAmount, onConfirm }: PaymentDropZoneProps) {
  const { isOver, setNodeRef, active } = useDroppable({
    id: `payment-${payment.id}`,
    data: { type: 'payment', payment },
  });

  const [isConfirming, setIsConfirming] = useState(false);

  const amountDiff = draggedAmount ? Math.abs(payment.amount - draggedAmount) : null;
  const isExactMatch = amountDiff === 0;
  const isCloseMatch = amountDiff && amountDiff <= payment.amount * 0.05;
  const hasDraggedItem = active?.data?.current?.type === 'bank-transaction';

  const handleConfirm = async () => {
    if (!onConfirm) return;
    setIsConfirming(true);
    try {
      await onConfirm(payment.id);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'p-4 border-2 border-dashed rounded-lg transition-all',
        isOver && isExactMatch && 'border-green-500 bg-green-50 dark:bg-green-950/30',
        isOver && isCloseMatch && !isExactMatch && 'border-amber-500 bg-amber-50 dark:bg-amber-950/30',
        isOver && !isExactMatch && !isCloseMatch && 'border-red-500 bg-red-50 dark:bg-red-950/30',
        !isOver && hasDraggedItem && 'border-primary/50 bg-primary/5',
        !isOver && !hasDraggedItem && 'border-muted-foreground/20 hover:border-muted-foreground/40'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{payment.client?.name || 'Cliente desconocido'}</p>
          {payment.invoice && (
            <p className="text-sm text-muted-foreground">Factura: {payment.invoice.folio}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {format(new Date(payment.payment_date), 'dd/MM/yyyy')} • {payment.reference_number || 'Sin referencia'}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-green-600">{formatCurrency(payment.amount)}</p>
          <div className="mt-1">
            <Badge variant="outline" className="text-xs">
              {payment.payment_method || 'N/A'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Confirm button when not dragging */}
      {!hasDraggedItem && onConfirm && (
        <div className="mt-3 pt-3 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={handleConfirm}
            disabled={isConfirming}
            className="w-full text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
          >
            {isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Confirmando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirmar sin conciliación
              </>
            )}
          </Button>
        </div>
      )}

      {isOver && draggedAmount && (
        <div className={cn(
          'mt-3 pt-3 border-t flex items-center justify-between',
          isExactMatch && 'border-green-300',
          isCloseMatch && !isExactMatch && 'border-amber-300',
          !isExactMatch && !isCloseMatch && 'border-red-300'
        )}>
          <div className="flex items-center gap-2 text-sm">
            {isExactMatch ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-green-600 font-medium">Montos coinciden exactamente</span>
              </>
            ) : isCloseMatch ? (
              <>
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-amber-600 font-medium">
                  Diferencia: {formatCurrency(amountDiff)}
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-red-600 font-medium">
                  Diferencia significativa: {formatCurrency(amountDiff)}
                </span>
              </>
            )}
          </div>
          <ArrowRight className={cn(
            'h-5 w-5',
            isExactMatch && 'text-green-600',
            isCloseMatch && !isExactMatch && 'text-amber-600',
            !isExactMatch && !isCloseMatch && 'text-red-600'
          )} />
        </div>
      )}

      {!isOver && hasDraggedItem && (
        <div className="mt-3 pt-3 border-t border-dashed text-center">
          <p className="text-sm text-muted-foreground">Suelta aquí para conciliar</p>
        </div>
      )}
    </div>
  );
}

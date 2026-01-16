import { useDraggable } from '@dnd-kit/core';
import { GripVertical, Link2Off, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, RECONCILIATION_STATUS_CONFIG } from '@/types/finance';
import type { ReconciliationStatus, BankTransaction } from '@/types/finance';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface BankTransactionCardProps {
  transaction: BankTransaction;
  isSelected?: boolean;
  onSelect?: () => void;
  onUnmatch?: () => void;
  suggestedMatch?: boolean;
}

export function BankTransactionCard({
  transaction,
  isSelected,
  onSelect,
  onUnmatch,
  suggestedMatch,
}: BankTransactionCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: transaction.id,
    data: { type: 'bank-transaction', transaction },
    disabled: transaction.status === 'matched',
  });

  const statusConfig = RECONCILIATION_STATUS_CONFIG[transaction.status as ReconciliationStatus];

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 1000,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'p-3 border rounded-lg transition-all bg-background',
        isDragging && 'opacity-50 shadow-lg scale-105',
        isSelected && 'border-primary bg-primary/5 ring-2 ring-primary/20',
        transaction.status === 'pending' && 'cursor-grab hover:bg-muted/50',
        transaction.status === 'matched' && 'bg-muted/30',
        suggestedMatch && 'border-amber-400 bg-amber-50 dark:bg-amber-950/20'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-2">
        {transaction.status === 'pending' && (
          <div
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-sm font-medium">
              {format(new Date(transaction.transaction_date), 'dd/MM/yyyy')}
            </span>
            <div className="flex items-center gap-1">
              {suggestedMatch && (
                <Badge variant="outline" className="text-xs border-amber-400 text-amber-600 bg-amber-100 dark:bg-amber-900/30">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Match
                </Badge>
              )}
              <Badge className={cn(statusConfig.bgColor, statusConfig.textColor, 'border-0 text-xs')}>
                {statusConfig.label}
              </Badge>
            </div>
          </div>
          <p className="text-sm truncate font-medium">{transaction.description}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted-foreground">{transaction.reference || 'Sin referencia'}</span>
            <span className={cn('font-bold', transaction.is_credit ? 'text-green-600' : 'text-red-600')}>
              {transaction.is_credit ? '+' : '-'}{formatCurrency(transaction.amount)}
            </span>
          </div>
          {transaction.bank_name && (
            <span className="text-xs text-muted-foreground">{transaction.bank_name}</span>
          )}
          {transaction.status === 'matched' && onUnmatch && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full text-xs text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onUnmatch();
              }}
            >
              <Link2Off className="w-3 h-3 mr-1" />
              Deshacer Conciliación
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

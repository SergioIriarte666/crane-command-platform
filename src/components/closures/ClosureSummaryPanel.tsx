import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Receipt, Calendar, User, ListChecks, DollarSign, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, ClosureStatus, CLOSURE_STATUS_CONFIG } from '@/types/finance';

interface ClosureSummaryPanelProps {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  clientName: string;
  selectedCount: number;
  total: number;
  purchaseOrder: string;
  status: ClosureStatus;
}

export const ClosureSummaryPanel = ({
  dateFrom,
  dateTo,
  clientName,
  selectedCount,
  total,
  purchaseOrder,
  status,
}: ClosureSummaryPanelProps) => {
  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const statusConfig = CLOSURE_STATUS_CONFIG[status] || CLOSURE_STATUS_CONFIG.draft;

  return (
    <Card className="bg-gradient-to-b from-card to-muted/30 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-violet-500" />
            Resumen del Cierre
          </span>
          <Badge className={cn(
            statusConfig.bgColor,
            statusConfig.textColor,
            "border-transparent"
          )}>
            {statusConfig.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Período */}
        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <span className="text-xs text-muted-foreground block">Período:</span>
            <span className="text-sm font-medium">
              {formatDate(dateFrom)} - {formatDate(dateTo)}
            </span>
          </div>
        </div>

        {/* Cliente */}
        {clientName && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Cliente:</span>
            <span className="text-sm font-medium truncate">{clientName}</span>
          </div>
        )}

        {/* Servicios */}
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Servicios:</span>
          <Badge variant={selectedCount > 0 ? "default" : "secondary"} className={cn(
            selectedCount > 0 && "bg-violet-600 text-white"
          )}>
            {selectedCount} seleccionados
          </Badge>
        </div>

        {/* Orden de Compra */}
        {purchaseOrder && (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">OC:</span>
            <span className="text-sm font-mono">{purchaseOrder}</span>
          </div>
        )}

        <Separator className="my-3" />

        {/* Total */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total:</span>
          </div>
          <span className={cn(
            "text-lg font-bold",
            total > 0 ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
          )}>
            {formatCurrency(total)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

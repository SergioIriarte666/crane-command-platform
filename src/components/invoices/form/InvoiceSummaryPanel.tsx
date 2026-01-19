import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Receipt, Calendar, DollarSign, FileText, Building2 } from 'lucide-react';
import { formatCurrency, INVOICE_STATUS_CONFIG } from '@/types/finance';
import type { InvoiceStatus } from '@/types/finance';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface InvoiceSummaryPanelProps {
  status: InvoiceStatus;
  numeroFiscal: string;
  issueDate: Date | undefined;
  dueDate: Date | undefined;
  paymentDate?: Date;
  clientName: string;
  closureFolio: string;
  subtotal: number;
  vat: number;
  total: number;
  isEditing: boolean;
}

export const InvoiceSummaryPanel = ({
  status,
  numeroFiscal,
  issueDate,
  dueDate,
  paymentDate,
  clientName,
  closureFolio,
  subtotal,
  vat,
  total,
  isEditing,
}: InvoiceSummaryPanelProps) => {
  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return format(date, 'dd/MM/yyyy', { locale: es });
  };

  const statusConfig = INVOICE_STATUS_CONFIG[status] || INVOICE_STATUS_CONFIG.draft;

  return (
    <Card className="bg-gradient-to-b from-card to-muted/30 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-violet-500" />
            Resumen de Factura
          </span>
          <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0`}>
            {statusConfig.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Número Fiscal */}
        {numeroFiscal && (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">N° Fiscal:</span>
            <span className="text-sm font-mono font-semibold text-violet-600">
              {numeroFiscal}
            </span>
          </div>
        )}

        {/* Cliente */}
        {clientName && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Cliente:</span>
            <span className="text-sm font-medium truncate">{clientName}</span>
          </div>
        )}

        {/* Cierre */}
        {closureFolio && (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Cierre:</span>
            <Badge variant="secondary" className="text-xs bg-violet-500/10 text-violet-700">
              {closureFolio}
            </Badge>
          </div>
        )}

        <Separator />

        {/* Fechas */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Fechas:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs ml-6">
            <div>
              <span className="text-muted-foreground">Emisión:</span>
              <span className="ml-1">{formatDate(issueDate)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Vencimiento:</span>
              <span className="ml-1">{formatDate(dueDate)}</span>
            </div>
            {paymentDate && status === 'paid' && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Pago:</span>
                <span className="ml-1 text-green-600">{formatDate(paymentDate)}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Totales */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Montos:</span>
          </div>
          
          <div className="space-y-1 ml-6 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA (19%):</span>
              <span>{formatCurrency(vat)}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span className="text-violet-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Indicador de modo edición */}
        {isEditing && (
          <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-md">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Modo edición - Los cambios actualizarán la factura existente
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

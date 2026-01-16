import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

import { CostWithRelations, COST_STATUS_CONFIG, COST_CATEGORY_CONFIG } from '@/types/costs';

interface CostDetailDialogProps {
  cost: CostWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CostDetailDialog({ cost, open, onOpenChange }: CostDetailDialogProps) {
  if (!cost) return null;

  const formatCurrency = (value: number | null) => {
    if (value === null) return '$0';
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalle del Costo</span>
            <Badge className={`${COST_STATUS_CONFIG[cost.status].bgColor} ${COST_STATUS_CONFIG[cost.status].textColor} border-0`}>
              {COST_STATUS_CONFIG[cost.status].label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información básica */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Código</p>
                <p className="font-mono font-medium">{cost.code}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Categoría</p>
                <p className="flex items-center gap-1">
                  {COST_CATEGORY_CONFIG[cost.category].icon}
                  {COST_CATEGORY_CONFIG[cost.category].label}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Descripción</p>
              <p className="text-sm">{cost.description}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Fecha del Costo</p>
              <p>{format(new Date(cost.cost_date), "dd 'de' MMMM, yyyy", { locale: es })}</p>
            </div>
          </div>

          <Separator />

          {/* Valores */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Desglose de Valores</h4>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor Unitario</span>
                <span className="font-mono">{formatCurrency(Number(cost.unit_value))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cantidad</span>
                <span className="font-mono">{cost.quantity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">{formatCurrency(Number(cost.subtotal))}</span>
              </div>
              {Number(cost.discount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Descuento</span>
                  <span className="font-mono text-red-600">-{formatCurrency(Number(cost.discount))}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA ({cost.tax_rate}%)</span>
                <span className="font-mono">{formatCurrency(Number(cost.tax_amount))}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="font-mono text-lg">{formatCurrency(Number(cost.total))}</span>
              </div>
            </div>
          </div>

          {/* Referencias */}
          {(cost.service || cost.crane || cost.operator || cost.supplier) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Referencias</h4>
                <div className="grid grid-cols-2 gap-3">
                  {cost.service && (
                    <div>
                      <p className="text-xs text-muted-foreground">Servicio</p>
                      <Link 
                        to={`/servicios/${cost.service.id}/editar`} 
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        {cost.service.folio}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                  {cost.crane && (
                    <div>
                      <p className="text-xs text-muted-foreground">Grúa</p>
                      <p className="text-sm">{cost.crane.unit_number}</p>
                    </div>
                  )}
                  {cost.operator && (
                    <div>
                      <p className="text-xs text-muted-foreground">Operador</p>
                      <p className="text-sm">{cost.operator.full_name}</p>
                    </div>
                  )}
                  {cost.supplier && (
                    <div>
                      <p className="text-xs text-muted-foreground">Proveedor</p>
                      <p className="text-sm">{cost.supplier.name}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Notas */}
          {cost.notes && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Notas</p>
                <p className="text-sm text-muted-foreground">{cost.notes}</p>
              </div>
            </>
          )}

          {/* Rechazo */}
          {cost.status === 'rejected' && cost.rejection_reason && (
            <>
              <Separator />
              <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-4">
                <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Motivo del Rechazo</p>
                <p className="text-sm text-red-700 dark:text-red-300">{cost.rejection_reason}</p>
              </div>
            </>
          )}

          {/* Auditoría */}
          <Separator />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Creado: {format(new Date(cost.created_at!), "dd/MM/yyyy HH:mm", { locale: es })}</p>
            {cost.approved_at && (
              <p>Aprobado: {format(new Date(cost.approved_at), "dd/MM/yyyy HH:mm", { locale: es })}</p>
            )}
            {cost.rejected_at && (
              <p>Rechazado: {format(new Date(cost.rejected_at), "dd/MM/yyyy HH:mm", { locale: es })}</p>
            )}
          </div>

          {/* Actions */}
          {cost.status !== 'approved' && (
            <div className="flex justify-end">
              <Button asChild variant="outline">
                <Link to={`/costos/${cost.id}/editar`}>
                  Editar Costo
                </Link>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

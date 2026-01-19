import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Ban, FileText, Building2, DollarSign, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/types/finance';
import type { Invoice } from '@/types/finance';

export const CANCELLATION_REASONS = [
  { value: 'error_datos_cliente', label: 'Error en datos del cliente' },
  { value: 'error_montos', label: 'Error en montos facturados' },
  { value: 'servicio_no_prestado', label: 'Servicio no prestado' },
  { value: 'duplicado', label: 'Duplicado de factura' },
  { value: 'solicitud_cliente', label: 'Solicitud del cliente' },
  { value: 'otro', label: 'Otro (especificar en detalles)' },
];

interface InvoiceCancellationModalProps {
  invoice: Invoice | null;
  clientName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    creditNoteNumber: string;
    cancellationReason: string;
    reasonDetails?: string;
  }) => Promise<void>;
}

export const InvoiceCancellationModal = ({
  invoice,
  clientName,
  isOpen,
  onClose,
  onConfirm,
}: InvoiceCancellationModalProps) => {
  const [creditNoteNumber, setCreditNoteNumber] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [reasonDetails, setReasonDetails] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!invoice || !creditNoteNumber.trim() || !cancellationReason || !confirmed) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({
        creditNoteNumber: creditNoteNumber.trim(),
        cancellationReason,
        reasonDetails: reasonDetails.trim() || undefined,
      });
      
      // Reset form
      setCreditNoteNumber('');
      setCancellationReason('');
      setReasonDetails('');
      setConfirmed(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setCreditNoteNumber('');
      setCancellationReason('');
      setReasonDetails('');
      setConfirmed(false);
    }
    onClose();
  };

  const isValid = creditNoteNumber.trim() && cancellationReason && confirmed;

  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Ban className="h-5 w-5" />
            Anular Factura con Nota de Crédito
          </DialogTitle>
          <DialogDescription>
            Esta acción registrará la anulación contable de la factura.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Invoice Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Factura:</span>
              <span>{invoice.folio}</span>
              {invoice.fiscal_folio && (
                <span className="text-violet-600 font-medium">({invoice.fiscal_folio})</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Cliente:</span>
              <span>{clientName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Total:</span>
              <span className="text-lg font-semibold">
                {formatCurrency(invoice.total || 0)}
              </span>
            </div>
          </div>

          {/* Credit Note Number */}
          <div className="space-y-2">
            <Label htmlFor="creditNoteNumber">
              Número de Nota de Crédito <span className="text-destructive">*</span>
            </Label>
            <Input
              id="creditNoteNumber"
              value={creditNoteNumber}
              onChange={(e) => setCreditNoteNumber(e.target.value)}
              placeholder="Ej: NC-00001234"
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Este número debe coincidir con el documento emitido en el SII
            </p>
          </div>

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <Label>Motivo de Anulación <span className="text-destructive">*</span></Label>
            <Select value={cancellationReason} onValueChange={setCancellationReason} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar motivo..." />
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Details */}
          <div className="space-y-2">
            <Label>Detalle adicional</Label>
            <Textarea
              value={reasonDetails}
              onChange={(e) => setReasonDetails(e.target.value)}
              placeholder="Descripción detallada del motivo de anulación..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Warning */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium mb-1">Esta acción:</p>
                <ul className="list-disc list-inside text-xs space-y-1">
                  <li>Cambiará el estado de la factura a "Anulada"</li>
                  <li>Liberará el cierre para poder ser facturado nuevamente</li>
                  <li>Revertirá los servicios asociados a estado "Completado"</li>
                  <li>Registrará la Nota de Crédito en el historial</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
              disabled={isSubmitting}
            />
            <label
              htmlFor="confirm"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Confirmo que he emitido la Nota de Crédito en el SII
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleSubmit} 
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <Ban className="h-4 w-4 mr-2" />
                Anular Factura
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

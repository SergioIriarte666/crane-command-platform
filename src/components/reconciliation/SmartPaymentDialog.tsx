import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { useClients } from '@/hooks/useClients';
import { usePayments } from '@/hooks/usePayments';
import { useInvoices } from '@/hooks/useInvoices';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, PAYMENT_METHODS } from '@/types/finance';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Zap, CalendarIcon, Loader2, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQueryClient } from '@tanstack/react-query';

interface SmartPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SmartPaymentDialog({ open, onOpenChange }: SmartPaymentDialogProps) {
  const { clients } = useClients();
  const { createPayment } = usePayments();
  const { invoices } = useInvoices();
  const { authUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [clientId, setClientId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState<string>('transfer');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [confirmImmediately, setConfirmImmediately] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter pending invoices for selected client
  const clientPendingInvoices = invoices?.filter(
    inv => inv.client_id === clientId && 
    (inv.status === 'sent' || inv.status === 'overdue' || inv.status === 'partial')
  ) || [];

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setClientId('');
      setAmount('');
      setPaymentDate(new Date());
      setPaymentMethod('transfer');
      setReference('');
      setNotes('');
      setSelectedInvoiceId('');
      setConfirmImmediately(true);
    }
  }, [open]);

  // Auto-fill amount and enable confirm when invoice is selected
  useEffect(() => {
    if (selectedInvoiceId) {
      const invoice = clientPendingInvoices.find(inv => inv.id === selectedInvoiceId);
      if (invoice) {
        const balanceDue = invoice.balance_due ?? invoice.total ?? 0;
        setAmount(balanceDue.toString());
        setConfirmImmediately(true);
      }
    }
  }, [selectedInvoiceId, clientPendingInvoices]);

  const handleSubmit = async () => {
    if (!clientId || !amount || parseFloat(amount) <= 0) return;

    setIsSubmitting(true);
    try {
      await createPayment.mutateAsync({
        client_id: clientId,
        amount: parseFloat(amount),
        payment_date: format(paymentDate, 'yyyy-MM-dd'),
        payment_method: paymentMethod as any,
        reference_number: reference || null,
        notes: notes || null,
        invoice_id: selectedInvoiceId || null,
        status: confirmImmediately ? 'confirmed' : 'pending',
        confirmed_at: confirmImmediately ? new Date().toISOString() : null,
        confirmed_by: confirmImmediately ? (authUser?.profile?.id ?? null) : null,
      });
      
      // Invalidate additional queries for state updates
      queryClient.invalidateQueries({ queryKey: ['closures'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClient = clients?.find(c => c.id === clientId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        {/* Header violeta */}
        <DialogHeader className="bg-violet-600 text-white px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Zap className="h-5 w-5" />
            Registrar Pago Inteligente
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Cliente */}
          <div className="space-y-2">
            <Label htmlFor="client" className="text-sm font-medium">
              Cliente <span className="text-destructive">*</span>
            </Label>
            <Select value={clientId} onValueChange={(value) => {
              setClientId(value);
              setSelectedInvoiceId('');
            }}>
              <SelectTrigger id="client">
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-[200px]">
                  {clients?.filter(c => c.is_active).map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>

          {/* Facturas pendientes del cliente */}
          {clientId && clientPendingInvoices.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Facturas Pendientes de {selectedClient?.name}
              </Label>
              <div className="border rounded-lg divide-y max-h-[150px] overflow-y-auto">
                {clientPendingInvoices.map((invoice) => (
                  <div 
                    key={invoice.id}
                    className={cn(
                      "p-3 cursor-pointer transition-colors hover:bg-muted/50",
                      selectedInvoiceId === invoice.id && "bg-violet-50 dark:bg-violet-900/20"
                    )}
                    onClick={() => setSelectedInvoiceId(
                      selectedInvoiceId === invoice.id ? '' : invoice.id
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{invoice.folio}</span>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "ml-2 text-xs",
                            invoice.status === 'overdue' && "border-red-500 text-red-500"
                          )}
                        >
                          {invoice.status === 'overdue' ? 'Vencida' : 'Pendiente'}
                        </Badge>
                      </div>
                      <span className="font-semibold text-primary">
                        {formatCurrency(invoice.balance_due ?? invoice.total ?? 0)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vence: {format(new Date(invoice.due_date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {clientId && clientPendingInvoices.length === 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              Este cliente no tiene facturas pendientes de pago
            </div>
          )}

          {/* Monto del Pago */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Monto del Pago <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-7"
              />
            </div>
          </div>

          {/* Fecha y Método de Pago */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Fecha de Pago <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !paymentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {paymentDate ? format(paymentDate, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={paymentDate}
                    onSelect={(date) => date && setPaymentDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Método de Pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHODS).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        {config.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Referencia Bancaria */}
          <div className="space-y-2">
            <Label htmlFor="reference" className="text-sm font-medium">
              Referencia Bancaria
            </Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Número de referencia o comprobante"
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notas
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones adicionales"
              rows={3}
            />
          </div>

          {/* Confirmar inmediatamente */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="confirm-immediately" className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Confirmar pago inmediatamente
              </Label>
              <p className="text-xs text-muted-foreground">
                Actualiza automáticamente factura, cierre y servicios
              </p>
            </div>
            <Switch
              id="confirm-immediately"
              checked={confirmImmediately}
              onCheckedChange={setConfirmImmediately}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={!clientId || !amount || parseFloat(amount) <= 0 || isSubmitting}
              className={cn(
                "flex-1",
                confirmImmediately ? "bg-green-600 hover:bg-green-700" : "bg-violet-600 hover:bg-violet-700"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : confirmImmediately ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirmar y Registrar
                </>
              ) : (
                'Registrar Pago Pendiente'
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, FileText, AlertCircle } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useClosures } from '@/hooks/useClosures';
import { useInvoices } from '@/hooks/useInvoices';
import { useCatalogOptions } from '@/hooks/useCatalogs';
import { formatCurrency } from '@/types/finance';

const invoiceSchema = z.object({
  closure_id: z.string().min(1, 'Selecciona un cierre'),
  fiscal_folio: z.string().min(1, 'Ingresa el folio fiscal'),
  payment_terms_id: z.string().min(1, 'Selecciona condiciones de pago'),
  issue_date: z.date(),
  due_date: z.date(),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface NewInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewInvoiceDialog({ open, onOpenChange }: NewInvoiceDialogProps) {
  const { closures, updateClosure } = useClosures();
  const { createInvoice } = useInvoices();
  const { data: paymentTermsOptions, isLoading: loadingPaymentTerms } = useCatalogOptions('payment_terms');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter closures: only approved ones without an invoice
  const approvedClosures = useMemo(() => {
    return closures.filter(c => c.status === 'approved' && !c.invoice_id);
  }, [closures]);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      closure_id: '',
      fiscal_folio: '',
      payment_terms_id: '',
      issue_date: new Date(),
      due_date: addDays(new Date(), 30),
      notes: '',
    },
  });

  const selectedClosureId = form.watch('closure_id');
  const selectedClosure = approvedClosures.find(c => c.id === selectedClosureId);

  const onSubmit = async (data: InvoiceFormData) => {
    if (!selectedClosure) return;

    setIsSubmitting(true);
    try {
      // 1. Create invoice linked to closure
      const invoice = await createInvoice.mutateAsync({
        billing_closure_id: data.closure_id,
        client_id: selectedClosure.client_id,
        fiscal_folio: data.fiscal_folio,
        payment_terms_id: data.payment_terms_id,
        subtotal: selectedClosure.subtotal || 0,
        tax_rate: selectedClosure.tax_rate || 16,
        tax_amount: selectedClosure.tax_amount || 0,
        total: selectedClosure.total || 0,
        balance_due: selectedClosure.total || 0,
        issue_date: format(data.issue_date, 'yyyy-MM-dd'),
        due_date: format(data.due_date, 'yyyy-MM-dd'),
        notes: data.notes || null,
        status: 'draft',
      });

      // 2. Update closure with invoice_id and status
      await updateClosure.mutateAsync({
        id: data.closure_id,
        invoice_id: invoice.id,
        status: 'invoicing',
      });

      form.reset();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva Factura</DialogTitle>
          <DialogDescription>Genera una factura a partir de un cierre aprobado</DialogDescription>
        </DialogHeader>

        {approvedClosures.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No hay cierres aprobados pendientes</p>
            <p className="text-sm mt-1">Aprueba un cierre primero para crear una factura</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Closure selector */}
              <FormField
                control={form.control}
                name="closure_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cierre de Facturación *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un cierre aprobado" />
                      </SelectTrigger>
                      <SelectContent>
                        {approvedClosures.map((closure) => (
                          <SelectItem key={closure.id} value={closure.id}>
                            <span className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              {closure.folio} - {closure.client?.name} - {formatCurrency(closure.total || 0)}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Show closure details when selected */}
              {selectedClosure && (
                <div className="bg-muted/50 border rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Cliente:</span>
                      <p className="font-medium">{selectedClosure.client?.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Período:</span>
                      <p className="font-medium">
                        {format(new Date(selectedClosure.period_start), 'dd/MM/yyyy', { locale: es })} - {format(new Date(selectedClosure.period_end), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Servicios incluidos:</span>
                    <span className="font-medium ml-2">{selectedClosure.services_count || 0}</span>
                  </div>
                </div>
              )}

              {/* Fiscal folio field */}
              <FormField
                control={form.control}
                name="fiscal_folio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Folio Fiscal *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingresa el folio fiscal de la factura" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment terms selector */}
              <FormField
                control={form.control}
                name="payment_terms_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condiciones de Pago *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={loadingPaymentTerms}>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingPaymentTerms ? "Cargando..." : "Selecciona condiciones de pago"} />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentTermsOptions?.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="issue_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Emisión</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? format(field.value, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar'}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            locale={es}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Vencimiento</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? format(field.value, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar'}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            locale={es}
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Financial summary from closure */}
              {selectedClosure && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedClosure.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IVA ({selectedClosure.tax_rate || 16}%):</span>
                    <span>{formatCurrency(selectedClosure.tax_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedClosure.total || 0)}</span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Notas adicionales para la factura..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting || !selectedClosure}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Crear Factura
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

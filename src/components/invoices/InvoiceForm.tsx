import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, Save, X, Receipt, CalendarIcon, Loader2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useClosures } from '@/hooks/useClosures';
import { useCatalogOptions } from '@/hooks/useCatalogs';
import { INVOICE_STATUS_CONFIG, formatCurrency } from '@/types/finance';
import type { InvoiceStatus, Invoice } from '@/types/finance';
import { InvoiceFormStepNavigation, getInvoiceFormSteps, type InvoiceFormStep } from './form/InvoiceFormStepNavigation';
import { InvoiceSummaryPanel } from './form/InvoiceSummaryPanel';
import { EnhancedClosureSelector } from './form/EnhancedClosureSelector';
import { ColoredSectionCard } from '@/components/services/form/ColoredSectionCard';

const invoiceSchema = z.object({
  closureId: z.string().min(1, 'Debe seleccionar un cierre'),
  issueDate: z.date(),
  dueDate: z.date(),
  status: z.enum(['draft', 'pending', 'sent', 'paid', 'partial', 'overdue', 'cancelled'] as const),
  paymentTermsId: z.string().optional(),
  paymentDate: z.date().optional(),
  numeroFiscal: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
  invoice?: Invoice | null;
  preselectedClosureId?: string | null;
  onSubmit: (data: {
    closureId: string;
    clientId: string;
    issueDate: string;
    dueDate: string;
    status: InvoiceStatus;
    paymentTermsId?: string;
    paymentDate?: string;
    numeroFiscal?: string;
    subtotal: number;
    vat: number;
    total: number;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  invoice,
  preselectedClosureId,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const isEditing = !!invoice;

  const { closures, isLoading: loadingClosures } = useClosures();
  const { data: paymentTermsOptions, isLoading: loadingTerms } = useCatalogOptions('payment_terms');

  // Filter closures: only 'closed' status (ready for invoicing) or include invoiced if editing
  const availableClosures = useMemo(() => {
    if (isEditing) {
      return closures.filter(c => c.status === 'closed' || c.status === 'invoiced' || c.status === 'invoicing');
    }
    return closures.filter(c => c.status === 'closed' && !c.invoice_id);
  }, [closures, isEditing]);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      closureId: preselectedClosureId || invoice?.billing_closure_id || '',
      issueDate: invoice?.issue_date ? new Date(invoice.issue_date) : new Date(),
      dueDate: invoice?.due_date ? new Date(invoice.due_date) : addDays(new Date(), 30),
      status: (invoice?.status as InvoiceStatus) || 'draft',
      paymentTermsId: invoice?.payment_terms_id || undefined,
      paymentDate: invoice?.paid_at ? new Date(invoice.paid_at) : undefined,
      numeroFiscal: invoice?.fiscal_folio || '',
    },
    mode: 'onChange',
  });

  const selectedClosureId = form.watch('closureId');
  const selectedStatus = form.watch('status');
  const selectedPaymentTermId = form.watch('paymentTermsId');
  const issueDate = form.watch('issueDate');

  const selectedClosure = useMemo(() =>
    availableClosures.find(c => c.id === selectedClosureId),
    [availableClosures, selectedClosureId]
  );

  // Calculate amounts (Subtotal from closure + 19% VAT)
  const { subtotal, vat, total } = useMemo(() => {
    const subtotalValue = Math.round(selectedClosure?.total || 0);
    const vatValue = Math.round(subtotalValue * 0.19);
    return { subtotal: subtotalValue, vat: vatValue, total: subtotalValue + vatValue };
  }, [selectedClosure?.total]);

  // Auto-calculate due date based on payment terms
  useEffect(() => {
    if (selectedPaymentTermId && issueDate && !isEditing) {
      const term = paymentTermsOptions?.find(t => t.id === selectedPaymentTermId);
      if (term) {
        // Get days from metadata if available
        const metadata = (term as any).metadata as { days?: number } | null;
        const days = metadata?.days || 30;
        if (days > 0) {
          const dueDate = addDays(issueDate, days);
          form.setValue('dueDate', dueDate);
        }
      }
    }
  }, [selectedPaymentTermId, issueDate, paymentTermsOptions, form, isEditing]);

  // Build steps with completion/error status
  const steps: InvoiceFormStep[] = useMemo(() => {
    const baseSteps = getInvoiceFormSteps();
    return baseSteps.map(step => ({
      ...step,
      isCompleted: step.id < currentStep || (step.id === 1 && !!selectedClosureId),
      hasError: step.id === 1 && !selectedClosureId && currentStep > 1,
    }));
  }, [currentStep, selectedClosureId]);

  const handleFormSubmit = async (data: InvoiceFormData) => {
    if (!selectedClosure) return;

    await onSubmit({
      closureId: data.closureId,
      clientId: selectedClosure.client_id,
      issueDate: format(data.issueDate, 'yyyy-MM-dd'),
      dueDate: format(data.dueDate, 'yyyy-MM-dd'),
      status: data.status,
      paymentTermsId: data.paymentTermsId,
      paymentDate: data.paymentDate ? format(data.paymentDate, 'yyyy-MM-dd') : undefined,
      numeroFiscal: data.numeroFiscal,
      subtotal,
      vat,
      total,
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: return !!selectedClosureId;
      case 2: return !!form.getValues('issueDate') && !!form.getValues('dueDate');
      case 3: return true;
      default: return true;
    }
  };

  const canGoNext = validateStep(currentStep);
  const canSubmit = validateStep(1) && validateStep(2) && validateStep(3);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <ColoredSectionCard title="Seleccionar Cierre" color="violet">
              <EnhancedClosureSelector
                closures={availableClosures}
                selectedClosureId={selectedClosureId}
                onClosureChange={(id) => form.setValue('closureId', id)}
                isEditing={isEditing}
                disabled={isEditing && selectedStatus !== 'draft'}
                isLoading={loadingClosures}
              />
            </ColoredSectionCard>

            {selectedClosure && (
              <ColoredSectionCard title="Resumen del Cierre" color="blue">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cliente:</span>
                    <p className="font-medium">{selectedClosure.client?.name || 'Sin cliente'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Período:</span>
                    <p className="font-medium">
                      {format(new Date(selectedClosure.period_start), 'dd/MM/yyyy', { locale: es })} - 
                      {format(new Date(selectedClosure.period_end), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Servicios:</span>
                    <p className="font-medium">{selectedClosure.services_count || 0}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Subtotal (Neto):</span>
                    <p className="font-medium text-violet-600">{formatCurrency(subtotal)}</p>
                  </div>
                </div>
              </ColoredSectionCard>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <ColoredSectionCard title="Condiciones de Pago" color="orange">
              <FormField
                control={form.control}
                name="paymentTermsId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condición de Pago</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value} 
                      disabled={loadingTerms}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingTerms ? "Cargando..." : "Seleccionar condición"} />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentTermsOptions?.map((term) => (
                          <SelectItem key={term.id} value={term.id}>
                            {term.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </ColoredSectionCard>

            <ColoredSectionCard title="Fechas" color="blue">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Emisión *</FormLabel>
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
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Vencimiento *</FormLabel>
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
            </ColoredSectionCard>

            {selectedStatus === 'paid' && (
              <ColoredSectionCard title="Fecha de Pago" color="green">
                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha en que se recibió el pago</FormLabel>
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
              </ColoredSectionCard>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <ColoredSectionCard title="Estado de la Factura" color="violet">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(INVOICE_STATUS_CONFIG)
                          .filter(([key]) => key !== 'cancelled') // No permitir seleccionar cancelled directamente
                          .map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </ColoredSectionCard>

            <ColoredSectionCard title="Número Fiscal" color="blue">
              <FormField
                control={form.control}
                name="numeroFiscal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Folio Fiscal (SII)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingresa el folio fiscal de la factura" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">
                      Número único de la factura electrónica emitida en el SII
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </ColoredSectionCard>

            {/* Resumen financiero */}
            <ColoredSectionCard title="Resumen Financiero" color="green">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal (Neto):</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA (19%):</span>
                  <span>{formatCurrency(vat)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span className="text-violet-600 text-lg">{formatCurrency(total)}</span>
                </div>
              </div>
            </ColoredSectionCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="bg-card border max-h-[90vh] overflow-hidden flex flex-col">
      <CardHeader className="bg-gradient-to-r from-violet-600 to-violet-500 text-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {isEditing ? 'Editar Factura' : 'Nueva Factura'}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCancel}
            className="text-white/80 hover:text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <Form {...form}>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                {/* Panel izquierdo: Navegación + Resumen */}
                <div className="lg:col-span-1 space-y-4">
                  <InvoiceFormStepNavigation
                    steps={steps}
                    currentStep={currentStep}
                    onStepClick={setCurrentStep}
                  />
                  <InvoiceSummaryPanel
                    status={selectedStatus}
                    numeroFiscal={form.watch('numeroFiscal') || ''}
                    issueDate={form.watch('issueDate')}
                    dueDate={form.watch('dueDate')}
                    paymentDate={form.watch('paymentDate')}
                    clientName={selectedClosure?.client?.name || ''}
                    closureFolio={selectedClosure?.folio || ''}
                    subtotal={subtotal}
                    vat={vat}
                    total={total}
                    isEditing={isEditing}
                  />
                </div>

                {/* Panel derecho: Contenido del paso */}
                <div className="lg:col-span-2">
                  {renderStepContent()}
                </div>
              </div>
            </div>

            {/* Footer con navegación - STICKY */}
            <div className="border-t bg-card p-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" /> Anterior
                </Button>
                <div className="flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancelar
                  </Button>
                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      onClick={() => canGoNext && setCurrentStep(currentStep + 1)}
                      disabled={!canGoNext}
                      className="bg-violet-600 hover:bg-violet-700 text-white"
                    >
                      Siguiente <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={form.handleSubmit(handleFormSubmit)}
                      disabled={!canSubmit || isLoading}
                      className="bg-violet-600 hover:bg-violet-700 text-white"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {isEditing ? 'Actualizar' : 'Crear'} Factura
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
};

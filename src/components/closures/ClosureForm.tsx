import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react';
import { useServicesForClosures } from '@/hooks/useServicesForClosures';
import { useClients } from '@/hooks/useClients';
import { useClosures } from '@/hooks/useClosures';
import { ClosureFormStepNavigation, getClosureFormSteps, ClosureFormStep } from './ClosureFormStepNavigation';
import { ClosureSummaryPanel } from './ClosureSummaryPanel';
import DateRangePicker from './DateRangePicker';
import ClientSelector from './ClientSelector';
import EnhancedServicesSelector from './EnhancedServicesSelector';
import { ColoredSectionCard } from '@/components/services/form/ColoredSectionCard';
import { format } from 'date-fns';
import { ClosureStatus } from '@/types/finance';

interface ClosureFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  clientId: string;
  serviceIds: string[];
  total: number;
  status: ClosureStatus;
  purchaseOrder: string;
}

const ClosureForm = ({ open, onOpenChange }: ClosureFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    dateFrom: undefined,
    dateTo: undefined,
    clientId: '',
    serviceIds: [],
    total: 0,
    status: 'draft',
    purchaseOrder: ''
  });
  const [loading, setLoading] = useState(false);

  const { clients } = useClients();
  const { createClosure, addServicesToClosure } = useClosures();
  const selectedClient = clients.find(c => c.id === formData.clientId);

  const {
    services,
    pendingServices,
    usedServiceIds,
    totalCompleted,
    loading: servicesLoading,
    completeService,
    completeMultipleServices,
    refetch,
    isGlobalSearch,
    processedServices,
    searchingProcessed,
    searchProcessedServices,
    clearProcessedServices
  } = useServicesForClosures({
    dateFrom: formData.dateFrom,
    dateTo: formData.dateTo
  });

  // Calcular completitud de pasos
  const steps = useMemo((): ClosureFormStep[] => {
    const baseSteps = getClosureFormSteps();
    
    const step1Complete = !!formData.dateFrom && !!formData.dateTo;
    const step2Complete = formData.serviceIds.length > 0;
    const step3Complete = true; // Detalles son opcionales

    const completionStatus = [step1Complete, step2Complete, step3Complete];
    
    return baseSteps.map((step, index) => ({
      ...step,
      isCompleted: completionStatus[index],
      hasError: false,
    }));
  }, [formData]);

  const handleSubmit = async () => {
    if (!formData.dateFrom || !formData.dateTo) return;
    if (formData.serviceIds.length === 0) return;

    setLoading(true);
    try {
      // Crear cierre
      const closure = await createClosure.mutateAsync({
        client_id: formData.clientId || services.find(s => formData.serviceIds.includes(s.id))?.client?.id || '',
        period_start: format(formData.dateFrom, 'yyyy-MM-dd'),
        period_end: format(formData.dateTo, 'yyyy-MM-dd'),
        notes: formData.purchaseOrder ? `OC: ${formData.purchaseOrder}` : null,
        status: 'draft',
      });

      // Agregar servicios al cierre
      await addServicesToClosure.mutateAsync({
        closureId: closure.id,
        serviceIds: formData.serviceIds,
      });

      // Reset form
      setFormData({
        dateFrom: undefined,
        dateTo: undefined,
        clientId: '',
        serviceIds: [],
        total: 0,
        status: 'draft',
        purchaseOrder: ''
      });
      setCurrentStep(1);
      refetch();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating closure:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceSelection = (serviceId: string, checked: boolean) => {
    setFormData(prev => {
      const newServiceIds = checked 
        ? [...prev.serviceIds, serviceId] 
        : prev.serviceIds.filter(id => id !== serviceId);

      const selectedServices = services.filter(s => newServiceIds.includes(s.id));
      const total = selectedServices.reduce((sum, s) => sum + (s.total || 0), 0);
      
      // Auto-detectar cliente único
      let detectedClientId = prev.clientId;
      if (selectedServices.length > 0) {
        const clientIds = [...new Set(selectedServices.map(s => s.client?.id).filter(Boolean))];
        if (clientIds.length === 1 && clientIds[0]) {
          detectedClientId = clientIds[0];
        }
      } else {
        detectedClientId = '';
      }
      
      return {
        ...prev,
        serviceIds: newServiceIds,
        total,
        clientId: detectedClientId
      };
    });
  };

  const handleAutoFillDates = (dateFrom: Date, dateTo: Date) => {
    setFormData(prev => ({ ...prev, dateFrom, dateTo }));
    setCurrentStep(1);
  };

  const isFormValid = formData.dateFrom && formData.dateTo && formData.serviceIds.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border max-w-5xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header con gradiente violeta */}
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-violet-500/10 to-purple-500/10">
            <DialogTitle className="text-2xl font-bold text-foreground">
              Nuevo Cierre de Servicios
            </DialogTitle>
            <p className="text-muted-foreground">
              Agrupa servicios completados para facturación
            </p>
          </DialogHeader>

          {/* Layout de 2 columnas */}
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-4 h-full">
              {/* Sidebar Izquierdo */}
              <div className="lg:col-span-1 border-r bg-muted/30 p-4 overflow-y-auto space-y-4">
                <ClosureFormStepNavigation
                  steps={steps}
                  currentStep={currentStep}
                  onStepClick={setCurrentStep}
                />
                
                <div className="hidden lg:block">
                  <ClosureSummaryPanel
                    dateFrom={formData.dateFrom}
                    dateTo={formData.dateTo}
                    clientName={selectedClient?.name || ''}
                    selectedCount={formData.serviceIds.length}
                    total={formData.total}
                    purchaseOrder={formData.purchaseOrder}
                    status={formData.status}
                  />
                </div>
              </div>

              {/* Contenido Principal */}
              <div className="lg:col-span-3 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Paso 1: Período */}
                  {currentStep === 1 && (
                    <ColoredSectionCard title="Período del Cierre" color="violet">
                      <div className="space-y-4">
                        <DateRangePicker 
                          dateFrom={formData.dateFrom} 
                          dateTo={formData.dateTo} 
                          onDateFromChange={(date) => setFormData(prev => ({ ...prev, dateFrom: date, serviceIds: [], total: 0 }))} 
                          onDateToChange={(date) => setFormData(prev => ({ ...prev, dateTo: date, serviceIds: [], total: 0 }))} 
                        />
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Solo se incluirán servicios completados dentro del período seleccionado que no estén en otro cierre.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </ColoredSectionCard>
                  )}

                  {/* Paso 2: Cliente y Servicios */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <ColoredSectionCard title="Cliente (Opcional)" color="blue">
                        <ClientSelector 
                          clientId={formData.clientId} 
                          onClientChange={(clientId) => setFormData(prev => ({ ...prev, clientId, serviceIds: [], total: 0 }))} 
                        />
                      </ColoredSectionCard>

                      <ColoredSectionCard title="Servicios Disponibles" color="green">
                        <EnhancedServicesSelector 
                          services={services} 
                          pendingServices={pendingServices}
                          loading={servicesLoading} 
                          clientId={formData.clientId} 
                          selectedServiceIds={formData.serviceIds} 
                          onServiceToggle={handleServiceSelection}
                          onCompleteService={completeService}
                          onCompleteMultipleServices={completeMultipleServices}
                          totalCompleted={totalCompleted}
                          usedServiceIds={usedServiceIds}
                          isGlobalSearch={isGlobalSearch}
                          onAutoFillDates={handleAutoFillDates}
                          processedServices={processedServices}
                          searchingProcessed={searchingProcessed}
                          onSearchProcessed={searchProcessedServices}
                          onClearProcessed={clearProcessedServices}
                        />
                      </ColoredSectionCard>
                    </div>
                  )}

                  {/* Paso 3: Detalles */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <ColoredSectionCard title="Orden de Compra" color="orange">
                        <div className="space-y-2">
                          <Label className="text-foreground">
                            Orden de Compra 
                            {formData.serviceIds.length > 0 && formData.purchaseOrder && (
                              <span className="text-xs text-muted-foreground ml-2">(Auto-detectada)</span>
                            )}
                          </Label>
                          <Input 
                            type="text" 
                            placeholder="Ej: OC-2024-001"
                            value={formData.purchaseOrder} 
                            onChange={e => setFormData(prev => ({ ...prev, purchaseOrder: e.target.value }))} 
                          />
                        </div>
                      </ColoredSectionCard>

                      <ColoredSectionCard title="Total" color="blue">
                        <div className="space-y-2">
                          <Label className="text-foreground">Total</Label>
                          <Input 
                            type="text" 
                            value={formData.total.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })} 
                            readOnly 
                            className="font-mono text-lg bg-muted" 
                          />
                        </div>
                      </ColoredSectionCard>
                    </div>
                  )}
                </div>

                {/* Footer con navegación */}
                <div className="border-t bg-muted/30 px-6 py-4 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                    disabled={currentStep === 1}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>

                  <span className="text-sm text-muted-foreground">
                    Paso {currentStep} de 3
                  </span>

                  <div className="flex gap-2">
                    {currentStep < 3 ? (
                      <Button
                        type="button"
                        onClick={() => setCurrentStep(prev => Math.min(3, prev + 1))}
                        className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || !isFormValid}
                        className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Crear Cierre
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClosureForm;

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Car, Users, DollarSign, ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react';
import { FormStepNavigation, FormStep } from './form/FormStepNavigation';
import { FormSummaryPanel } from './form/FormSummaryPanel';
import { BasicInfoStep } from './form/steps/BasicInfoStep';
import { VehicleLocationStep } from './form/steps/VehicleLocationStep';
import { ResourcesStep } from './form/steps/ResourcesStep';
import { FinancialStep } from './form/steps/FinancialStep';
import { ServiceFormData, getDefaultServiceFormData, ServiceOperator } from '@/types/serviceForm';
import { useServiceFormValidation } from '@/hooks/useServiceFormValidation';
import { useServices, useNextFolio } from '@/hooks/useServices';
import { useClients } from '@/hooks/useClients';
import { useCranes } from '@/hooks/useCranes';
import { useOperators } from '@/hooks/useOperators';
import { useCatalogs } from '@/hooks/useCatalogs';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/types/services';

interface EnhancedServiceFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingService?: Service | null;
  duplicatingService?: Service | null;
}

export function EnhancedServiceForm({ isOpen, onOpenChange, editingService, duplicatingService }: EnhancedServiceFormProps) {
  const [currentStep, setCurrentStep] = useState('basic');
  const [formData, setFormData] = useState<ServiceFormData>(getDefaultServiceFormData());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: nextFolio } = useNextFolio();
  const { createService, updateService } = useServices();
  const { clients } = useClients();
  const { cranes } = useCranes();
  const { operators } = useOperators();
  const { catalogs: brands } = useCatalogs('vehicle_brand');
  const { catalogs: models } = useCatalogs('vehicle_model');
  const { catalogs: serviceTypes } = useCatalogs('service_type');
  const { catalogs: vehicleConditions } = useCatalogs('vehicle_condition');
  const { catalogs: vehicleTypes } = useCatalogs('vehicle_type');

  // Fetch service operators when editing
  const { data: serviceOperatorsData } = useQuery({
    queryKey: ['service-operators', editingService?.id],
    queryFn: async () => {
      if (!editingService?.id) return [];
      const { data, error } = await supabase
        .from('service_operators')
        .select('*, operator:operators(full_name)')
        .eq('service_id', editingService.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!editingService?.id && isOpen,
  });

  const { isFieldInvalid, getFieldError, hasStepErrors, isStepComplete, isFormValid } = useServiceFormValidation({ formData });

  // Define steps with dynamic completion status
  const steps: FormStep[] = useMemo(() => [
    { id: 'basic', title: 'Información Básica', description: 'Folio, fechas y cliente', icon: FileText, isCompleted: isStepComplete('basic'), hasError: hasStepErrors('basic') },
    { id: 'vehicle', title: 'Vehículo y Ubicación', description: 'Datos del vehículo', icon: Car, isCompleted: isStepComplete('vehicle'), hasError: hasStepErrors('vehicle') },
    { id: 'resources', title: 'Recursos', description: 'Grúa y operadores', icon: Users, isCompleted: isStepComplete('resources'), hasError: hasStepErrors('resources') },
    { id: 'financial', title: 'Financiero', description: 'Valor y costos', icon: DollarSign, isCompleted: isStepComplete('financial'), hasError: hasStepErrors('financial') },
  ], [isStepComplete, hasStepErrors]);

  const currentIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;
  const isLastStep = currentIndex === steps.length - 1;

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      if (editingService) {
        // Map operators from service_operators table
        const mappedOperators: ServiceOperator[] = (serviceOperatorsData || []).map((op: any) => ({
          id: op.id,
          operatorId: op.operator_id,
          operatorName: op.operator?.full_name || '',
          commission: op.commission || 0,
          role: op.role || 'Principal',
        }));

        // Parse times from timestamp if available
        const parseTimeFromTimestamp = (timestamp: string | null): string => {
          if (!timestamp) return '';
          try {
            const date = new Date(timestamp);
            return date.toTimeString().substring(0, 5); // "HH:mm"
          } catch {
            return '';
          }
        };

        const hasStartTime = !!editingService.dispatch_time;
        const hasEndTime = !!editingService.completion_time;

        setFormData({
          ...getDefaultServiceFormData(),
          folio: editingService.folio,
          folioAuto: false,
          // Dates
          requestDate: editingService.request_date || editingService.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          serviceDate: editingService.service_date || editingService.scheduled_date || new Date().toISOString().split('T')[0],
          // Client
          clientId: editingService.client_id || '',
          clientContactName: editingService.client_contact_name || '',
          purchaseOrder: editingService.po_number || '',
          quoteNumber: editingService.quote_number || '',
          // Service type
          serviceType: editingService.type,
          priority: editingService.priority,
          // Optional time tracking
          trackStartTime: hasStartTime,
          trackEndTime: hasEndTime,
          startTime: parseTimeFromTimestamp(editingService.dispatch_time),
          endTime: parseTimeFromTimestamp(editingService.completion_time),
          trackDistance: !!editingService.distance_km,
          distanceKm: editingService.distance_km || undefined,
          // Vehicle
          vehicleBrand: editingService.vehicle_brand || '',
          vehicleModel: editingService.vehicle_model || '',
          vehiclePlates: editingService.vehicle_plates || '',
          // Location
          originAddress: editingService.origin_address || '',
          originCity: editingService.origin_city || '',
          originReferences: editingService.origin_references || '',
          destinationAddress: editingService.destination_address || '',
          destinationCity: editingService.destination_city || '',
          destinationReferences: editingService.destination_references || '',
          // Resources
          craneId: editingService.crane_id || '',
          // Use subtotal (net value) instead of total (with tax)
          serviceValue: editingService.subtotal || 0,
          taxRate: editingService.tax_rate || 19,
          subtotal: editingService.subtotal || 0,
          taxAmount: editingService.tax_amount || 0,
          total: editingService.total || 0,
          status: editingService.status,
          observations: editingService.notes || '',
          internalNotes: editingService.internal_notes || '',
          operators: mappedOperators,
        });
      } else if (duplicatingService) {
        // Duplicate mode: preserve vehicle/client data, reset dates and other fields
        const today = new Date().toISOString().split('T')[0];
        setFormData({
          ...getDefaultServiceFormData(),
          folio: nextFolio || '',
          folioAuto: true,
          // Dates reset to today
          requestDate: today,
          serviceDate: today,
          // Preserve client
          clientId: duplicatingService.client_id || '',
          clientContactName: duplicatingService.client_contact_name || '',
          // Preserve service type and priority
          serviceType: duplicatingService.type,
          priority: duplicatingService.priority || 'normal',
          // Preserve vehicle data
          vehicleBrand: duplicatingService.vehicle_brand || '',
          vehicleModel: duplicatingService.vehicle_model || '',
          vehiclePlates: duplicatingService.vehicle_plates || '',
          vehicleType: duplicatingService.vehicle_type || 'sedan',
          vehicleCondition: duplicatingService.vehicle_condition || 'runs',
          vehicleKeys: duplicatingService.vehicle_keys ?? true,
          // Reset everything else (locations, times, resources, financials)
          status: 'draft',
        });
      } else {
        setFormData({ ...getDefaultServiceFormData(), folio: nextFolio || '' });
      }
      setCurrentStep('basic');
    }
  }, [isOpen, editingService, duplicatingService, nextFolio, serviceOperatorsData]);

  const handleChange = (updates: Partial<ServiceFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentIndex < steps.length - 1) setCurrentStep(steps[currentIndex + 1].id);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentStep(steps[currentIndex - 1].id);
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setIsSubmitting(true);
    try {
      // Build timestamps for dispatch_time and completion_time if tracked
      let dispatchTime = null;
      let completionTime = null;
      
      if (formData.trackStartTime && formData.startTime && formData.serviceDate) {
        dispatchTime = `${formData.serviceDate}T${formData.startTime}:00`;
      }
      if (formData.trackEndTime && formData.endTime && formData.serviceDate) {
        completionTime = `${formData.serviceDate}T${formData.endTime}:00`;
      }

      const payload = {
        type: formData.serviceType,
        priority: formData.priority,
        status: formData.status,
        client_id: formData.clientId || null,
        client_contact_name: formData.clientContactName || null,
        // Dates
        request_date: formData.requestDate || null,
        service_date: formData.serviceDate || null,
        scheduled_date: formData.serviceDate || null, // For backwards compatibility
        // Times
        dispatch_time: dispatchTime,
        completion_time: completionTime,
        // Vehicle info
        vehicle_brand: formData.vehicleBrand || null,
        vehicle_model: formData.vehicleModel || null,
        vehicle_plates: formData.vehiclePlates || null,
        vehicle_type: formData.vehicleType,
        vehicle_condition: formData.vehicleCondition,
        vehicle_keys: formData.vehicleKeys,
        // Location info
        origin_address: formData.originAddress || null,
        origin_city: formData.originCity || null,
        origin_references: formData.originReferences || null,
        destination_address: formData.destinationAddress || null,
        destination_city: formData.destinationCity || null,
        destination_references: formData.destinationReferences || null,
        distance_km: formData.trackDistance && formData.distanceKm ? formData.distanceKm : null,
        // Resources
        crane_id: formData.craneId || null,
        operator_id: formData.operators[0]?.operatorId || null,
        // Client reference numbers
        po_number: formData.purchaseOrder || null,
        quote_number: formData.quoteNumber || null,
        // Financials
        subtotal: formData.subtotal,
        tax_rate: formData.taxRate,
        tax_amount: formData.taxAmount,
        total: formData.total,
        // Notes
        notes: formData.observations,
        internal_notes: formData.internalNotes,
      };

      const operatorsData = formData.operators
        .filter(op => op.operatorId)
        .map(op => ({
          operatorId: op.operatorId,
          commission: op.commission || 0,
          role: op.role || 'Principal',
        }));

      // Sync costs when saving the service (so user doesn't need to click "Guardar" per-row)
      const costsData = formData.costs
        .filter(cost => cost.category_id && cost.description?.trim() && (cost.amount || 0) > 0)
        .map(cost => ({
          category_id: cost.category_id,
          description: cost.description,
          amount: cost.amount,
          quantity: cost.quantity,
          unitPrice: cost.unitPrice,
          subcategory: cost.subcategory,
          notes: cost.notes,
          cost_date: cost.date,
        }));

      if (editingService) {
        await updateService.mutateAsync({
          id: editingService.id,
          ...payload,
          operators: operatorsData,
          costs: costsData,
        });
      } else {
        await createService.mutateAsync({
          ...payload,
          custom_folio: formData.folioAuto ? undefined : formData.folio,
          operators: operatorsData,
          costs: costsData,
        });
      }
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clientName = clients.find(c => c.id === formData.clientId)?.name;
  const craneName = cranes.find(c => c.id === formData.craneId)?.unit_number;
  const totalCommissions = formData.operators.reduce((sum, op) => sum + (op.commission || 0), 0);
  const totalCosts = formData.costs.reduce((sum, cost) => sum + cost.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col">
        {/* Header */}
        <DialogHeader className="bg-primary text-primary-foreground p-4 rounded-t-lg shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>
              {editingService ? 'Editar Servicio' : duplicatingService ? 'Duplicar Servicio' : 'Nuevo Servicio'}
            </DialogTitle>
            <span className="text-sm opacity-80">Paso {currentIndex + 1} de {steps.length}</span>
          </div>
          <Progress value={progress} className="h-1 mt-2 bg-primary-foreground/20" />
        </DialogHeader>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-72 border-r bg-muted/30 p-4 flex flex-col gap-4 shrink-0">
            <FormStepNavigation steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />
            <FormSummaryPanel
              folio={formData.folioAuto ? nextFolio || '' : formData.folio}
              clientName={clientName}
              serviceType={formData.serviceType}
              value={formData.total}
              totalCommissions={totalCommissions}
              totalCosts={totalCosts}
              operatorCount={formData.operators.length}
              craneName={craneName}
              origin={formData.originAddress}
              destination={formData.destinationAddress}
              status={formData.status}
              isEditing={!!editingService}
            />
          </div>

          {/* Main Form Area */}
          <ScrollArea className="flex-1 p-6">
            {currentStep === 'basic' && (
              <BasicInfoStep formData={formData} onChange={handleChange} clients={clients} serviceTypes={serviceTypes} nextFolio={nextFolio} isFieldInvalid={isFieldInvalid} getFieldError={getFieldError} />
            )}
            {currentStep === 'vehicle' && (
              <VehicleLocationStep formData={formData} onChange={handleChange} brands={brands} models={models} vehicleConditions={vehicleConditions} vehicleTypes={vehicleTypes} isFieldInvalid={isFieldInvalid} getFieldError={getFieldError} />
            )}
            {currentStep === 'resources' && (
              <ResourcesStep formData={formData} onChange={handleChange} cranes={cranes} operators={operators} isFieldInvalid={isFieldInvalid} getFieldError={getFieldError} serviceId={editingService?.id} />
            )}
            {currentStep === 'financial' && (
              <FinancialStep formData={formData} onChange={handleChange} isFieldInvalid={isFieldInvalid} getFieldError={getFieldError} />
            )}
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t shrink-0">
          <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentIndex === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            {isLastStep ? (
              <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {editingService ? 'Guardar Cambios' : 'Crear Servicio'}
              </Button>
            ) : (
              <Button type="button" onClick={handleNext}>
                Siguiente <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

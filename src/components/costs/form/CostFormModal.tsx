import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

import { CostFormStepNavigation } from './CostFormStepNavigation';
import { CostSummaryPanel } from './CostSummaryPanel';
import { CostBasicInfoStep } from './steps/CostBasicInfoStep';
import { CostAmountDetailsStep } from './steps/CostAmountDetailsStep';
import { CostAssociationsStep } from './steps/CostAssociationsStep';
import { CostNotesStep } from './steps/CostNotesStep';

import { useCatalogOptions } from '@/hooks/useCatalogs';
import { useCosts } from '@/hooks/useCosts';
import { useCranes } from '@/hooks/useCranes';
import { useOperators } from '@/hooks/useOperators';
import { useServices } from '@/hooks/useServices';
import { useSuppliers } from '@/hooks/useSuppliers';


import {
  CostFormData,
  CostFormStep,
  COST_FORM_STEPS,
  DEFAULT_COST_FORM_DATA,
} from '@/types/costForm';
import { useCostFormValidation } from '@/hooks/useCostFormValidation';
import { CostWithRelations } from '@/types/costs';

interface CostFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingCost?: CostWithRelations | null;
  onSuccess?: () => void;
}

export function CostFormModal({ open, onOpenChange, existingCost, onSuccess }: CostFormModalProps) {
  const navigate = useNavigate();
  // tenantId not needed here - handled by hooks
  

  // Datos desde catálogos unificados
  const { data: categories = [] } = useCatalogOptions('cost_category');
  const { data: costCenters = [] } = useCatalogOptions('cost_center');
  const { cranes } = useCranes();
  const { operators } = useOperators();
  const { services } = useServices();
  const { suppliers } = useSuppliers();
  const { createCost, updateCost } = useCosts({});

  // Estado del formulario
  const [formData, setFormData] = useState<CostFormData>(DEFAULT_COST_FORM_DATA);
  const [currentStep, setCurrentStep] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!existingCost;

  // Validación
  const { errors, hasStepErrors, isStepComplete, isFormValid } = useCostFormValidation({ formData });

  // Cargar datos existentes si estamos editando
  useEffect(() => {
    if (existingCost && open) {
      setFormData({
        cost_date: existingCost.cost_date || DEFAULT_COST_FORM_DATA.cost_date,
        category_id: existingCost.category_id || '',
        description: existingCost.description || '',
        unit_value: existingCost.unit_value || 0,
        quantity: existingCost.quantity || 1,
        discount: existingCost.discount || 0,
        tax_rate: existingCost.tax_rate || 19,
        subcategory_id: existingCost.subcategory_id || '',
        part_name: existingCost.part_name || '',
        supplier_name: existingCost.supplier_name || '',
        supplier_phone: existingCost.supplier_phone || '',
        purchase_quantity: existingCost.purchase_quantity || 0,
        purchase_unit_cost: existingCost.purchase_unit_cost || 0,
        kilometraje: existingCost.kilometraje || 0,
        immediate_consumption: existingCost.immediate_consumption || false,
        crane_id: existingCost.crane_id || '',
        operator_id: existingCost.operator_id || '',
        service_id: existingCost.service_id || '',
        service_folio: existingCost.service_folio || '',
        cost_center_id: existingCost.cost_center_id || '',
        supplier_id: existingCost.supplier_id || '',
        notes: existingCost.notes || '',
      });
      setCurrentStep('basic');
    } else if (!existingCost && open) {
      setFormData(DEFAULT_COST_FORM_DATA);
      setCurrentStep('basic');
    }
  }, [existingCost, open]);

  // Steps con estado
  const steps: CostFormStep[] = useMemo(() => {
    return COST_FORM_STEPS.map(step => ({
      ...step,
      isCompleted: isStepComplete(step.id),
      hasError: hasStepErrors(step.id),
    }));
  }, [formData, isStepComplete, hasStepErrors]);

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleChange = (field: keyof CostFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate financial values
      const subtotal = formData.unit_value * formData.quantity - formData.discount;
      const taxAmount = subtotal * (formData.tax_rate / 100);
      const total = subtotal + taxAmount;

      // Generate a unique code for new costs
      const code = isEditing && existingCost?.code 
        ? existingCost.code 
        : `CST-${Date.now().toString(36).toUpperCase()}`;

      const costData = {
        code,
        cost_date: formData.cost_date,
        category_id: formData.category_id || null,
        description: formData.description,
        unit_value: formData.unit_value,
        quantity: formData.quantity,
        discount: formData.discount,
        tax_rate: formData.tax_rate,
        subtotal,
        tax_amount: taxAmount,
        total,
        subcategory_id: formData.subcategory_id || null,
        part_name: formData.part_name || null,
        supplier_name: formData.supplier_name || null,
        supplier_phone: formData.supplier_phone || null,
        purchase_quantity: formData.purchase_quantity || null,
        purchase_unit_cost: formData.purchase_unit_cost || null,
        kilometraje: formData.kilometraje || null,
        immediate_consumption: formData.immediate_consumption,
        crane_id: formData.crane_id || null,
        operator_id: formData.operator_id || null,
        service_id: formData.service_id || null,
        service_folio: formData.service_folio || null,
        cost_center_id: formData.cost_center_id || null,
        supplier_id: formData.supplier_id || null,
        notes: formData.notes || null,
      };

      if (isEditing && existingCost) {
        await updateCost.mutateAsync({ id: existingCost.id, ...costData });
        toast.success('Costo actualizado correctamente');
      } else {
        await createCost.mutateAsync(costData as any);
        toast.success('Costo registrado correctamente');
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error('Error al guardar: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preparar datos para los componentes
  const cranesData = cranes?.map(c => ({ id: c.id, unit_number: c.unit_number, brand: c.brand, model: c.model })) ?? [];
  const operatorsData = operators?.map(o => ({ id: o.id, full_name: o.full_name, employee_number: o.employee_number })) ?? [];
  const servicesData = services?.map(s => ({ id: s.id, folio: s.folio, crane_id: s.crane_id, operator_id: s.operator_id })) ?? [];
  const suppliersData = suppliers?.map(s => ({ id: s.id, name: s.name })) ?? [];

  const renderStep = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <CostBasicInfoStep
            formData={formData}
            onChange={handleChange}
            categories={categories}
            errors={errors}
          />
        );
      case 'amount':
        return (
          <CostAmountDetailsStep
            formData={formData}
            onChange={handleChange}
            errors={errors}
          />
        );
      case 'associations':
        return (
          <CostAssociationsStep
            formData={formData}
            onChange={handleChange}
            cranes={cranesData}
            operators={operatorsData}
            services={servicesData}
            suppliers={suppliersData}
            costCenters={costCenters}
          />
        );
      case 'notes':
        return <CostNotesStep formData={formData} onChange={handleChange} />;
      default:
        return null;
    }
  };

  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0 flex flex-col">
        {/* Header */}
        <div className="bg-violet-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {isEditing ? 'Editar Costo' : 'Nuevo Costo'}
              </h2>
              <p className="text-violet-200 text-sm">
                {steps[currentStepIndex]?.title} - Paso {currentStepIndex + 1} de {steps.length}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-violet-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <Progress value={progress} className="mt-3 h-1 bg-violet-400" />
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-72 border-r bg-muted/30 p-4 flex flex-col gap-4 overflow-y-auto">
            <CostFormStepNavigation
              steps={steps}
              currentStep={currentStep}
              onStepClick={setCurrentStep}
            />
            <CostSummaryPanel
              formData={formData}
              categories={categories}
              cranes={cranesData}
              operators={operatorsData}
              services={servicesData}
              isEditing={isEditing}
            />
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {renderStep()}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex items-center justify-between bg-background">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            {isLastStep ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !isFormValid()}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEditing ? 'Actualizar' : 'Guardar'}
              </Button>
            ) : (
              <Button onClick={handleNext} className="bg-violet-600 hover:bg-violet-700">
                Siguiente
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

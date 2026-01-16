import { useMemo } from 'react';
import { ServiceFormData, ServiceTypeConfig, getDefaultServiceTypeConfig } from '@/types/serviceForm';

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  step: string;
}

interface UseServiceFormValidationProps {
  formData: ServiceFormData;
  serviceTypeConfig?: Partial<ServiceTypeConfig>;
}

export function useServiceFormValidation({ formData, serviceTypeConfig }: UseServiceFormValidationProps) {
  const config = serviceTypeConfig || getDefaultServiceTypeConfig();

  const validationErrors = useMemo(() => {
    const errors: ValidationError[] = [];

    // === PASO 1: Información Básica ===
    if (!formData.folio && !formData.folioAuto) {
      errors.push({
        field: 'folio',
        message: 'Se requiere un folio',
        severity: 'error',
        step: 'basic',
      });
    }

    if (!formData.clientId) {
      errors.push({
        field: 'clientId',
        message: 'Se requiere seleccionar un cliente',
        severity: 'error',
        step: 'basic',
      });
    }

    if (!formData.requestDate) {
      errors.push({
        field: 'requestDate',
        message: 'Se requiere la fecha de solicitud',
        severity: 'error',
        step: 'basic',
      });
    }

    if (!formData.serviceDate) {
      errors.push({
        field: 'serviceDate',
        message: 'Se requiere la fecha del servicio',
        severity: 'error',
        step: 'basic',
      });
    }

    // === PASO 2: Vehículo y Ubicación ===
    if (config?.vehicleBrandRequired && !formData.vehicleBrand?.trim()) {
      errors.push({
        field: 'vehicleBrand',
        message: 'Se requiere la marca del vehículo',
        severity: 'error',
        step: 'vehicle',
      });
    }

    if (config?.vehicleModelRequired && !formData.vehicleModel?.trim()) {
      errors.push({
        field: 'vehicleModel',
        message: 'Se requiere el modelo del vehículo',
        severity: 'error',
        step: 'vehicle',
      });
    }

    if (config?.licensePlateRequired && !formData.vehiclePlates?.trim()) {
      errors.push({
        field: 'vehiclePlates',
        message: 'Se requiere la patente del vehículo',
        severity: 'error',
        step: 'vehicle',
      });
    }

    if (config?.originRequired && !formData.originAddress?.trim()) {
      errors.push({
        field: 'originAddress',
        message: 'Se requiere la dirección de origen',
        severity: 'error',
        step: 'vehicle',
      });
    }

    if (config?.destinationRequired && !formData.destinationAddress?.trim()) {
      errors.push({
        field: 'destinationAddress',
        message: 'Se requiere la dirección de destino',
        severity: 'error',
        step: 'vehicle',
      });
    }

    // === PASO 3: Recursos ===
    if (config?.craneRequired && !formData.craneId) {
      errors.push({
        field: 'craneId',
        message: 'Se requiere seleccionar una grúa',
        severity: 'error',
        step: 'resources',
      });
    }

    if (config?.operatorRequired && formData.operators.length === 0) {
      errors.push({
        field: 'operators',
        message: 'Se requiere al menos un operador',
        severity: 'error',
        step: 'resources',
      });
    }

    // Validar que cada operador tenga asignación válida
    formData.operators.forEach((op, index) => {
      if (!op.operatorId) {
        errors.push({
          field: `operators.${index}.operatorId`,
          message: `Operador ${index + 1}: Seleccione un operador`,
          severity: 'error',
          step: 'resources',
        });
      }
      if (op.commission < 0) {
        errors.push({
          field: `operators.${index}.commission`,
          message: `Operador ${index + 1}: La comisión no puede ser negativa`,
          severity: 'error',
          step: 'resources',
        });
      }
    });

    // === PASO 4: Financiero ===
    if (formData.serviceValue <= 0) {
      errors.push({
        field: 'serviceValue',
        message: 'El valor del servicio debe ser mayor a 0',
        severity: 'warning',
        step: 'financial',
      });
    }

    if (formData.hasExcess && (formData.clientCoveredAmount === undefined || formData.clientCoveredAmount < 0)) {
      errors.push({
        field: 'clientCoveredAmount',
        message: 'Ingrese el monto cubierto por el cliente',
        severity: 'error',
        step: 'financial',
      });
    }

    if (formData.hasExcess && (formData.excessAmount === undefined || formData.excessAmount < 0)) {
      errors.push({
        field: 'excessAmount',
        message: 'Ingrese el monto de exceso',
        severity: 'error',
        step: 'financial',
      });
    }

    return errors;
  }, [formData, config]);

  const hasErrors = validationErrors.some(e => e.severity === 'error');
  const hasWarnings = validationErrors.some(e => e.severity === 'warning');
  
  const getFieldError = (fieldName: string) => 
    validationErrors.find(e => e.field === fieldName);
  
  const isFieldInvalid = (fieldName: string) => 
    validationErrors.some(e => e.field === fieldName && e.severity === 'error');

  const getStepErrors = (stepId: string) =>
    validationErrors.filter(e => e.step === stepId);

  const hasStepErrors = (stepId: string) =>
    validationErrors.some(e => e.step === stepId && e.severity === 'error');

  const isStepComplete = (stepId: string) => {
    const stepErrors = getStepErrors(stepId);
    return stepErrors.filter(e => e.severity === 'error').length === 0;
  };

  return {
    validationErrors,
    hasErrors,
    hasWarnings,
    getFieldError,
    isFieldInvalid,
    getStepErrors,
    hasStepErrors,
    isStepComplete,
    isFormValid: !hasErrors,
  };
}

import { useMemo } from 'react';
import { CostFormData } from '@/types/costForm';

interface UseCostFormValidationProps {
  formData: CostFormData;
}

export function useCostFormValidation({ formData }: UseCostFormValidationProps) {
  const errors = useMemo(() => {
    const errs: Partial<Record<keyof CostFormData, string>> = {};

    // Paso 1: Información Básica
    if (!formData.cost_date) {
      errs.cost_date = 'La fecha es requerida';
    }
    if (!formData.category_id) {
      errs.category_id = 'La categoría es requerida';
    }
    if (!formData.description || formData.description.trim().length < 3) {
      errs.description = 'La descripción debe tener al menos 3 caracteres';
    }

    // Paso 2: Monto y Detalles
    if (formData.unit_value <= 0) {
      errs.unit_value = 'El valor unitario debe ser mayor a 0';
    }
    if (formData.quantity <= 0) {
      errs.quantity = 'La cantidad debe ser mayor a 0';
    }
    if (formData.discount < 0) {
      errs.discount = 'El descuento no puede ser negativo';
    }
    if (formData.tax_rate < 0 || formData.tax_rate > 100) {
      errs.tax_rate = 'La tasa de impuesto debe estar entre 0 y 100';
    }

    return errs;
  }, [formData]);

  const isFieldInvalid = (field: keyof CostFormData): boolean => {
    return !!errors[field];
  };

  const getFieldError = (field: keyof CostFormData): string | undefined => {
    return errors[field];
  };

  const hasStepErrors = (stepId: string): boolean => {
    switch (stepId) {
      case 'basic':
        return !!(errors.cost_date || errors.category_id || errors.description);
      case 'amount':
        return !!(errors.unit_value || errors.quantity || errors.discount || errors.tax_rate);
      case 'associations':
        return false; // Asociaciones son opcionales
      case 'notes':
        return false; // Notas son opcionales
      default:
        return false;
    }
  };

  const isStepComplete = (stepId: string): boolean => {
    switch (stepId) {
      case 'basic':
        return !!(formData.cost_date && formData.category_id && formData.description?.trim());
      case 'amount':
        return formData.unit_value > 0 && formData.quantity > 0;
      case 'associations':
        return true; // Siempre completo (opcional)
      case 'notes':
        return true; // Siempre completo (opcional)
      default:
        return false;
    }
  };

  const isFormValid = (): boolean => {
    return Object.keys(errors).length === 0 && isStepComplete('basic') && isStepComplete('amount');
  };

  return {
    errors,
    isFieldInvalid,
    getFieldError,
    hasStepErrors,
    isStepComplete,
    isFormValid,
  };
}

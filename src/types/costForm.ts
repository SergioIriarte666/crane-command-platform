import { CostCategory } from '@/hooks/useCostCategories';
import { CostSubcategory } from '@/hooks/useCostSubcategories';
import { CostCenter } from '@/hooks/useCostCenters';

export interface CostFormData {
  // Paso 1: Información Básica
  cost_date: string;
  category_id: string;
  description: string;
  
  // Paso 2: Monto y Detalles
  unit_value: number;
  quantity: number;
  discount: number;
  tax_rate: number;
  subcategory_id: string;
  
  // Campos condicionales para piezas/repuestos
  part_name: string;
  supplier_name: string;
  supplier_phone: string;
  purchase_quantity: number;
  purchase_unit_cost: number;
  kilometraje: number;
  immediate_consumption: boolean;
  
  // Paso 3: Asociaciones
  crane_id: string;
  operator_id: string;
  service_id: string;
  service_folio: string;
  cost_center_id: string;
  supplier_id: string;
  
  // Paso 4: Notas
  notes: string;
}

export interface CostFormStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  isCompleted: boolean;
  hasError: boolean;
}

export const COST_FORM_STEPS: Omit<CostFormStep, 'isCompleted' | 'hasError'>[] = [
  {
    id: 'basic',
    title: 'Información Básica',
    description: 'Fecha, categoría y descripción',
    icon: 'FileText',
  },
  {
    id: 'amount',
    title: 'Monto y Detalles',
    description: 'Valores y subcategoría',
    icon: 'DollarSign',
  },
  {
    id: 'associations',
    title: 'Asociaciones',
    description: 'Grúa, operador, servicio',
    icon: 'Link',
  },
  {
    id: 'notes',
    title: 'Notas',
    description: 'Observaciones adicionales',
    icon: 'StickyNote',
  },
];

export const DEFAULT_COST_FORM_DATA: CostFormData = {
  cost_date: new Date().toISOString().split('T')[0],
  category_id: '',
  description: '',
  unit_value: 0,
  quantity: 1,
  discount: 0,
  tax_rate: 19,
  subcategory_id: '',
  part_name: '',
  supplier_name: '',
  supplier_phone: '',
  purchase_quantity: 0,
  purchase_unit_cost: 0,
  kilometraje: 0,
  immediate_consumption: false,
  crane_id: '',
  operator_id: '',
  service_id: '',
  service_folio: '',
  cost_center_id: '',
  supplier_id: '',
  notes: '',
};

export interface CostFormValidation {
  isFieldInvalid: (field: keyof CostFormData) => boolean;
  getFieldError: (field: keyof CostFormData) => string | undefined;
  hasStepErrors: (stepId: string) => boolean;
  isStepComplete: (stepId: string) => boolean;
  isFormValid: () => boolean;
}

export interface CostFormContextData {
  formData: CostFormData;
  categories: CostCategory[];
  subcategories: CostSubcategory[];
  centers: CostCenter[];
}

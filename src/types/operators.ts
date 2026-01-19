import { Database } from '@/integrations/supabase/types';

// Tipos base de la base de datos
export type Operator = Database['public']['Tables']['operators']['Row'];
export type OperatorInsert = Database['public']['Tables']['operators']['Insert'];
export type OperatorUpdate = Database['public']['Tables']['operators']['Update'];

export type OperatorWithCrane = Operator & {
  assigned_crane?: {
    id: string;
    unit_number: string;
    type: string | null;
    brand: string | null;
    model: string | null;
  } | null;
};

export type OperatorStatus = Database['public']['Enums']['operator_status'];
export type CommissionType = Database['public']['Enums']['commission_type'];

// Constantes de estado de operador
export const OPERATOR_STATUS_CONFIG: Record<OperatorStatus, { label: string; color: string; bgColor: string }> = {
  active: { label: 'Activo', color: 'text-green-700', bgColor: 'bg-green-100' },
  inactive: { label: 'Inactivo', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  vacation: { label: 'Vacaciones', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  suspended: { label: 'Suspendido', color: 'text-red-700', bgColor: 'bg-red-100' },
};

// Tipos de comisión
export const COMMISSION_TYPES: Record<CommissionType, { label: string; description: string }> = {
  percentage: { label: 'Porcentaje', description: 'Comisión basada en porcentaje del servicio' },
  fixed: { label: 'Fijo', description: 'Monto fijo por servicio' },
  mixed: { label: 'Mixto', description: 'Combinación de porcentaje y monto fijo' },
};

// Tipos de licencia chilena
export const LICENSE_TYPES = [
  { value: 'A1', label: 'Clase A1 - Motocicletas hasta 400cc' },
  { value: 'A2', label: 'Clase A2 - Motocicletas sin límite' },
  { value: 'A3', label: 'Clase A3 - Motocicletas con sidecar' },
  { value: 'A4', label: 'Clase A4 - Motos especiales' },
  { value: 'A5', label: 'Clase A5 - Cuatriciclos' },
  { value: 'B', label: 'Clase B - Automóviles y camionetas' },
  { value: 'C', label: 'Clase C - Camiones simples' },
  { value: 'D', label: 'Clase D - Taxis colectivos' },
  { value: 'E', label: 'Clase E - Transporte escolar' },
  { value: 'F', label: 'Clase F - Maquinaria' },
] as const;

// Tipos de sangre
export const BLOOD_TYPES = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
] as const;

// Bancos chilenos
export const CHILEAN_BANKS = [
  'Banco de Chile',
  'Banco Estado',
  'Banco Santander',
  'Banco BCI',
  'Banco Itaú',
  'Scotiabank',
  'Banco BICE',
  'Banco Security',
  'Banco Falabella',
  'Banco Ripley',
  'Banco Consorcio',
  'Banco Internacional',
] as const;

// Función para formatear el porcentaje de comisión
export function formatCommission(operator: Operator): string {
  if (!operator.commission_type) return 'Sin comisión';
  
  switch (operator.commission_type) {
    case 'percentage':
      return `${operator.commission_percentage || 0}%`;
    case 'fixed':
      return `$${(operator.commission_fixed_amount || 0).toLocaleString('es-CL')}`;
    case 'mixed':
      return `${operator.commission_percentage || 0}% + $${(operator.commission_fixed_amount || 0).toLocaleString('es-CL')}`;
    default:
      return 'Sin comisión';
  }
}

// Función para obtener iniciales del nombre
export function getInitials(name: string | null): string {
  if (!name) return '??';
  const words = name.trim().split(' ');
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

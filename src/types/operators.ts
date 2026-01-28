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

export interface OperatorStats {
  totalServices: number;
  completedServices: number;
  averageRating: number;
  totalEarnings: number;
  activeIncidents: number;
}

// Tipos de licencia chilena
export const LICENSE_TYPES = [
  { value: 'A1', label: 'Clase A1 - Taxis' },
  { value: 'A2', label: 'Clase A2 - Taxis, ambulancias y transporte público (10-17 asientos)' },
  { value: 'A3', label: 'Clase A3 - Transporte escolar y público (sin límite)' },
  { value: 'A4', label: 'Clase A4 - Transporte de carga (> 3.500 kg)' },
  { value: 'A5', label: 'Clase A5 - Transporte de carga articulada (> 3.500 kg)' },
  { value: 'B', label: 'Clase B - Automóviles y camionetas' },
  { value: 'C', label: 'Clase C - Motocicletas' },
  { value: 'D', label: 'Clase D - Maquinaria automotriz' },
  { value: 'E', label: 'Clase E - Tracción animal' },
  { value: 'F', label: 'Clase F - Vehículos fiscales' },
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

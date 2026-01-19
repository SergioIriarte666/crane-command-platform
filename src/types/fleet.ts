import { Database } from '@/integrations/supabase/types';

// Tipos base de la base de datos
export type Crane = Database['public']['Tables']['cranes']['Row'];
export type CraneInsert = Database['public']['Tables']['cranes']['Insert'];
export type CraneUpdate = Database['public']['Tables']['cranes']['Update'];

export type CraneType = Database['public']['Enums']['crane_type'];
export type CraneStatus = Database['public']['Enums']['crane_status'];

export type CraneWithOperator = Crane & {
  assigned_operator?: {
    id: string;
    full_name: string;
    employee_number: string | null;
  } | null;
};

// Constantes de tipos de grúa
export const CRANE_TYPES: Record<CraneType, { label: string; description: string }> = {
  plataforma: { label: 'Plataforma', description: 'Grúa con plataforma plana' },
  arrastre: { label: 'Arrastre', description: 'Grúa de arrastre tradicional' },
  pesada: { label: 'Pesada', description: 'Grúa para vehículos pesados' },
  lowboy: { label: 'Lowboy', description: 'Plataforma baja para maquinaria' },
  auxilio: { label: 'Auxilio', description: 'Vehículo de auxilio vial' },
};

// Colores de estado de grúa
export const CRANE_STATUS_CONFIG: Record<CraneStatus, { label: string; color: string; bgColor: string }> = {
  available: { label: 'Disponible', color: 'text-green-700', bgColor: 'bg-green-100' },
  in_service: { label: 'En Servicio', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  maintenance: { label: 'Mantenimiento', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  out_of_service: { label: 'Fuera de Servicio', color: 'text-red-700', bgColor: 'bg-red-100' },
};

// Tipos de combustible
export const FUEL_TYPES = [
  { value: 'diesel', label: 'Diésel' },
  { value: 'gasolina', label: 'Gasolina' },
  { value: 'gas', label: 'Gas LP' },
] as const;

// Función para calcular días hasta vencimiento
export function getDaysUntilExpiry(date: string | null): number | null {
  if (!date) return null;
  const expiryDate = new Date(date);
  const today = new Date();
  const diffTime = expiryDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Función para obtener el color del semáforo de documentos
export function getExpiryColor(days: number | null): 'green' | 'yellow' | 'red' | 'gray' {
  if (days === null) return 'gray';
  if (days <= 0) return 'red';
  if (days <= 30) return 'yellow';
  return 'green';
}

// Función para formatear kilómetros
export function formatKm(km: number | null): string {
  if (km === null) return 'N/A';
  return `${km.toLocaleString('es-CL')} km`;
}

// Función para formatear toneladas
export function formatTons(tons: number | null): string {
  if (tons === null) return 'N/A';
  return `${tons} ton`;
}

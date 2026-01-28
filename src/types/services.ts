// Dynamic status types - now TEXT in database, configured via catalog_items
export type ServiceStatus = string;
export type ServiceType = string;

// Legacy enum types for backward compatibility with existing code
import { Database } from '@/integrations/supabase/types';
export type ServicePriority = Database['public']['Enums']['service_priority'];
export type VehicleType = Database['public']['Enums']['vehicle_type'];
export type VehicleCondition = Database['public']['Enums']['vehicle_condition'];

export type Service = Omit<Database['public']['Tables']['services']['Row'], 'status' | 'type'> & {
  status: string;
  type: string;
};
export type ServiceInsert = Omit<Database['public']['Tables']['services']['Insert'], 'status' | 'type'> & {
  status?: string;
  type?: string;
};
export type ServiceUpdate = Omit<Database['public']['Tables']['services']['Update'], 'status' | 'type'> & {
  status?: string;
  type?: string;
};

// Static config as fallback (will be overridden by dynamic catalogs)
export const SERVICE_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; textColor: string }> = {
  draft: { label: 'Borrador', color: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
  quoted: { label: 'Cotizado', color: '#60a5fa', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  purchase_order_pending: { label: 'Esperando O.C.', color: '#f59e0b', bgColor: 'bg-amber-100', textColor: 'text-amber-700' },
  with_purchase_order: { label: 'Con Orden de Compra', color: '#10b981', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700' },
  confirmed: { label: 'Confirmado', color: '#3b82f6', bgColor: 'bg-blue-200', textColor: 'text-blue-800' },
  pending: { label: 'Programado', color: '#8b5cf6', bgColor: 'bg-violet-100', textColor: 'text-violet-700' },
  assigned: { label: 'Asignado', color: '#8b5cf6', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
  // Simplificado: Operativos fusionados en "En Curso"
  // en_route: { label: 'En Camino', color: '#eab308', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
  // on_site: { label: 'En Sitio', color: '#f97316', bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
  in_progress: { label: 'En Curso', color: '#06b6d4', bgColor: 'bg-cyan-100', textColor: 'text-cyan-700' },
  completed: { label: 'Completado', color: '#22c55e', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  failed: { label: 'Fallido', color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  invoiced: { label: 'Facturado', color: '#15803d', bgColor: 'bg-green-200', textColor: 'text-green-800' },
  cancelled: { label: 'Cancelado', color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-700' },
};

export const SERVICE_TYPES: Record<string, { label: string; icon: string }> = {
  local: { label: 'Local', icon: '🏙️' },
  foraneo: { label: 'Foráneo', icon: '🛣️' },
  pension: { label: 'Pensión', icon: '🅿️' },
  maniobra: { label: 'Maniobra', icon: '🔧' },
  auxilio: { label: 'Auxilio Vial', icon: '🚗' },
};

export const SERVICE_PRIORITIES: Record<ServicePriority, { label: string; color: string; bgColor: string }> = {
  normal: { label: 'Normal', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  urgent: { label: 'Urgente', color: 'text-red-700', bgColor: 'bg-red-100' },
};

export const VEHICLE_TYPES: Record<VehicleType, string> = {
  sedan: 'Sedán',
  suv: 'SUV',
  pickup: 'Pickup',
  van: 'Van',
  truck: 'Camión',
  motorcycle: 'Motocicleta',
  other: 'Otro',
};

// Orden de estados para el pipeline (fallback)
export const STATUS_ORDER: string[] = [
  'draft', 'quoted', 'purchase_order_pending', 'with_purchase_order', 
  'confirmed', 'pending', 'assigned', 
  // 'en_route', 'on_site', 
  'in_progress', 'completed', 'failed', 'invoiced', 'cancelled'
];

// Transiciones válidas de estado (fallback)
export const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['quoted', 'confirmed', 'cancelled'],
  quoted: ['purchase_order_pending', 'with_purchase_order', 'confirmed', 'pending', 'draft', 'cancelled'],
  purchase_order_pending: ['with_purchase_order', 'confirmed', 'pending', 'cancelled'],
  with_purchase_order: ['confirmed', 'pending', 'assigned', 'cancelled'],
  confirmed: ['assigned', 'pending', 'in_progress', 'cancelled'],
  pending: ['assigned', 'in_progress', 'cancelled'],
  assigned: ['in_progress', 'cancelled'], // Directo a in_progress
  // en_route: ['on_site', 'cancelled'],
  // on_site: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'failed', 'cancelled'],
  completed: ['invoiced'],
  failed: ['draft', 'pending', 'cancelled'],
  invoiced: [],
  cancelled: ['draft'],
};

export function canTransitionTo(currentStatus: string, newStatus: string): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

export function getNextStatuses(currentStatus: string): string[] {
  return VALID_TRANSITIONS[currentStatus] || [];
}

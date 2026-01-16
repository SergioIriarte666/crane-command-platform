import { Database } from '@/integrations/supabase/types';

export type Cost = Database['public']['Tables']['costs']['Row'];
export type CostInsert = Database['public']['Tables']['costs']['Insert'];
export type CostUpdate = Database['public']['Tables']['costs']['Update'];

export type CostStatus = Database['public']['Enums']['cost_status'];
export type CostCategory = Database['public']['Enums']['cost_category'];

export const COST_STATUS_CONFIG: Record<CostStatus, { label: string; color: string; bgColor: string; textColor: string }> = {
  draft: { label: 'Borrador', color: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
  pending_approval: { label: 'Pendiente', color: '#f59e0b', bgColor: 'bg-amber-100', textColor: 'text-amber-700' },
  approved: { label: 'Aprobado', color: '#22c55e', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  rejected: { label: 'Rechazado', color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-700' },
};

export const COST_CATEGORY_CONFIG: Record<CostCategory, { label: string; icon: string }> = {
  materials: { label: 'Materiales', icon: '📦' },
  labor: { label: 'Mano de obra', icon: '👷' },
  services: { label: 'Servicios', icon: '🔧' },
  taxes: { label: 'Impuestos', icon: '📋' },
  transport: { label: 'Transporte', icon: '🚚' },
  equipment: { label: 'Equipamiento', icon: '⚙️' },
  other: { label: 'Otros', icon: '📁' },
};

export const COST_CATEGORIES: CostCategory[] = [
  'materials', 'labor', 'services', 'taxes', 'transport', 'equipment', 'other'
];

export const COST_STATUSES: CostStatus[] = [
  'draft', 'pending_approval', 'approved', 'rejected'
];

// Transiciones válidas de estado
export const VALID_STATUS_TRANSITIONS: Record<CostStatus, CostStatus[]> = {
  draft: ['pending_approval', 'approved'],
  pending_approval: ['approved', 'rejected', 'draft'],
  approved: [], // Una vez aprobado, no se puede cambiar (solo admin puede editar)
  rejected: ['draft', 'pending_approval'],
};

export function canTransitionTo(currentStatus: CostStatus, newStatus: CostStatus): boolean {
  return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

export function getNextStatuses(currentStatus: CostStatus): CostStatus[] {
  return VALID_STATUS_TRANSITIONS[currentStatus] || [];
}

// Helper para calcular totales en frontend
export function calculateCostTotals(unitValue: number, quantity: number, discount: number = 0, taxRate: number = 19) {
  const subtotal = unitValue * quantity;
  const discountedSubtotal = subtotal - discount;
  const taxAmount = (discountedSubtotal * taxRate) / 100;
  const total = discountedSubtotal + taxAmount;
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

// Type for cost with relations
export interface CostWithRelations extends Cost {
  service?: { id: string; folio: string } | null;
  crane?: { id: string; unit_number: string } | null;
  operator?: { id: string; full_name: string } | null;
  supplier?: { id: string; name: string } | null;
}

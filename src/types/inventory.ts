import { Database } from '@/integrations/supabase/types';

export type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];
export type InventoryItemInsert = Database['public']['Tables']['inventory_items']['Insert'];
export type InventoryItemUpdate = Database['public']['Tables']['inventory_items']['Update'];

export type InventoryMovement = Database['public']['Tables']['inventory_movements']['Row'] & {
  batch_id?: string | null;
  location_id?: string | null;
  batch?: InventoryBatch | null;
  location?: InventoryLocation | null;
};

export interface InventoryLocation {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  type: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface InventoryBatch {
  id: string;
  tenant_id: string;
  item_id: string;
  batch_number: string;
  expiration_date: string | null;
  cost: number | null;
  created_at: string;
  created_by: string | null;
}

export interface InventoryStock {
  id: string;
  tenant_id: string;
  item_id: string;
  location_id: string;
  batch_id: string | null;
  quantity: number;
  updated_at: string;
  location?: InventoryLocation;
  batch?: InventoryBatch;
}

export type InventoryCategory = Database['public']['Enums']['inventory_category'];
export type InventoryUnit = Database['public']['Enums']['inventory_unit'];
export type MovementType = Database['public']['Enums']['movement_type'];

export const INVENTORY_CATEGORIES: Record<InventoryCategory, { label: string; icon: string }> = {
  parts: { label: 'Refacciones', icon: '⚙️' },
  tires: { label: 'Neumáticos', icon: '🛞' },
  oil: { label: 'Aceites/Lubricantes', icon: '🛢️' },
  tools: { label: 'Herramientas', icon: '🔧' },
  equipment: { label: 'Equipos', icon: '🧰' },
  consumables: { label: 'Consumibles', icon: '📦' },
  other: { label: 'Otros', icon: '📋' },
};

export const INVENTORY_UNITS: Record<InventoryUnit, string> = {
  piece: 'Pieza',
  liter: 'Litro',
  kg: 'Kilogramo',
  set: 'Juego',
  service: 'Servicio',
  hour: 'Hora',
};

export const MOVEMENT_TYPES: Record<MovementType, { label: string; color: string }> = {
  in: { label: 'Entrada', color: 'text-green-600' },
  out: { label: 'Salida', color: 'text-red-600' },
  adjustment: { label: 'Ajuste', color: 'text-yellow-600' },
  transfer: { label: 'Transferencia', color: 'text-blue-600' },
};

export function getStockStatus(item: InventoryItem): 'ok' | 'low' | 'critical' | 'over' {
  const stock = item.current_stock || 0;
  const min = item.min_stock || 0;
  const max = item.max_stock;
  const reorder = item.reorder_point || 0;

  if (stock <= 0) return 'critical';
  if (stock <= reorder) return 'low';
  if (max && stock > max) return 'over';
  return 'ok';
}

export function getStockStatusConfig(status: ReturnType<typeof getStockStatus>) {
  const config = {
    ok: { label: 'Normal', color: 'text-green-700', bgColor: 'bg-green-100' },
    low: { label: 'Bajo', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    critical: { label: 'Crítico', color: 'text-red-700', bgColor: 'bg-red-100' },
    over: { label: 'Exceso', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  };
  return config[status];
}

export function formatCurrency(amount: number | null): string {
  if (amount === null) return '$0';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
}

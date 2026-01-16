import { Database } from '@/integrations/supabase/types';

export type Supplier = Database['public']['Tables']['suppliers']['Row'];
export type SupplierInsert = Database['public']['Tables']['suppliers']['Insert'];
export type SupplierUpdate = Database['public']['Tables']['suppliers']['Update'];

export type SupplierCategory = Database['public']['Enums']['supplier_category'];

export const SUPPLIER_CATEGORIES: Record<SupplierCategory, { label: string; icon: string }> = {
  maintenance: { label: 'Mantenimiento', icon: '🔧' },
  tires: { label: 'Neumáticos', icon: '🛞' },
  fuel: { label: 'Combustible', icon: '⛽' },
  parts: { label: 'Refacciones', icon: '⚙️' },
  services: { label: 'Servicios', icon: '🛠️' },
  other: { label: 'Otros', icon: '📦' },
};

export const RATING_LABELS: Record<number, string> = {
  1: 'Muy Malo',
  2: 'Malo',
  3: 'Regular',
  4: 'Bueno',
  5: 'Excelente',
};

export function getRatingColor(rating: number | null): string {
  if (!rating) return 'text-muted-foreground';
  if (rating <= 2) return 'text-red-500';
  if (rating === 3) return 'text-yellow-500';
  return 'text-green-500';
}

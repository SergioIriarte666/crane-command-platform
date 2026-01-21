// VIP Pipeline Types

export type VipServiceStatus = 
  | 'quoted' 
  | 'purchase_order_pending'
  | 'with_purchase_order'
  | 'pending' 
  | 'in_progress' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'invoiced';

export const VIP_PIPELINE_STATUSES = [
  {
    id: 'quoted' as const,
    title: 'Cotizados',
    description: 'Servicios con cotización enviada',
    color: 'hsl(var(--primary))',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-300',
  },
  {
    id: 'purchase_order_pending' as const,
    title: 'Esperando O.C.',
    description: 'Aguardando orden de compra del cliente',
    color: 'hsl(38, 92%, 50%)',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-700 dark:text-amber-300',
  },
  {
    id: 'with_purchase_order' as const,
    title: 'Con Orden de Compra',
    description: 'Servicios con orden de compra recibida',
    color: 'hsl(142, 76%, 36%)',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    textColor: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    id: 'pending' as const,
    title: 'Programados',
    description: 'Servicios confirmados y programados',
    color: 'hsl(262, 83%, 58%)',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
    textColor: 'text-violet-700 dark:text-violet-300',
  },
  {
    id: 'in_progress' as const,
    title: 'En Progreso',
    description: 'Servicios ejecutándose actualmente',
    color: 'hsl(199, 89%, 48%)',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    textColor: 'text-cyan-700 dark:text-cyan-300',
  },
  {
    id: 'completed' as const,
    title: 'Completados',
    description: 'Servicios finalizados exitosamente',
    color: 'hsl(142, 71%, 45%)',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-300',
  },
  {
    id: 'failed' as const,
    title: 'Fallidos',
    description: 'Servicios que no pudieron completarse',
    color: 'hsl(0, 84%, 60%)',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-300',
  },
  {
    id: 'invoiced' as const,
    title: 'Facturados',
    description: 'Servicios facturados y cerrados',
    color: 'hsl(160, 84%, 39%)',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    textColor: 'text-teal-700 dark:text-teal-300',
  },
];

export interface VipService {
  id: string;
  folio: string;
  status: string;
  type: string;
  priority: string;
  scheduled_date: string | null;
  service_date: string | null;
  created_at: string | null;
  
  // Vehicle
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_plates: string | null;
  
  // Location
  origin_address: string | null;
  destination_address: string | null;
  
  // Financial
  subtotal: number | null;
  total: number | null;
  quote_number: string | null;
  purchase_order_number: string | null;
  
  // Relations
  client?: { id: string; name: string; code: string | null; tax_id: string | null } | null;
  crane?: { id: string; unit_number: string; type: string; plates: string | null } | null;
  operator?: { id: string; full_name: string; employee_number: string } | null;
  
  observations: string | null;
}

export interface ServiceGroup {
  status: VipServiceStatus;
  title: string;
  description: string;
  services: VipService[];
  totalValue: number;
  averageDays: number;
  color: string;
  bgColor: string;
  textColor: string;
}

export interface BatchUpdateData {
  types: ('quote' | 'purchase_order')[];
  services: {
    id: string;
    quote_number?: string;
    purchase_order_number?: string;
    target_status?: string;
  }[];
  notes?: string;
  auto_update_status?: boolean;
}

export interface BatchProgressState {
  isOpen: boolean;
  current: number;
  total: number;
  operationName: string;
  currentItemName?: string;
  isComplete?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

export interface AdvancedFilters {
  serviceTypeId?: string;
  licensePlate?: string;
  quoteNumber?: string;
  purchaseOrderNumber?: string;
  numeroFiscal?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface BatchProgressCallback {
  current: number;
  total: number;
  percentage: number;
  currentItemId?: string;
}

export function getStatusConfig(statusId: string) {
  return VIP_PIPELINE_STATUSES.find(s => s.id === statusId) || {
    id: statusId,
    title: statusId,
    description: '',
    color: 'hsl(var(--muted-foreground))',
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
  };
}

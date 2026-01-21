import { Database } from '@/integrations/supabase/types';

// Database types
export type Invoice = Database['public']['Tables']['invoices']['Row'];
export type InvoiceInsert = Database['public']['Tables']['invoices']['Insert'];
export type InvoiceUpdate = Database['public']['Tables']['invoices']['Update'];

export interface InvoiceHistory {
  id: string;
  invoice_id: string;
  changed_by: string;
  changed_at: string;
  changes: Record<string, { old: any; new: any }>;
  action_type: 'create' | 'update' | 'status_change';
  tenant_id: string;
  user?: {
    full_name: string;
    email: string;
  };
}

export type BillingClosure = Database['public']['Tables']['billing_closures']['Row'];
export type BillingClosureInsert = Database['public']['Tables']['billing_closures']['Insert'];
export type BillingClosureUpdate = Database['public']['Tables']['billing_closures']['Update'];

export type Payment = Database['public']['Tables']['payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];

export type Commission = Database['public']['Tables']['commissions']['Row'];
export type CommissionInsert = Database['public']['Tables']['commissions']['Insert'];

export type BankTransaction = Database['public']['Tables']['bank_transactions']['Row'];
export type BankTransactionInsert = Database['public']['Tables']['bank_transactions']['Insert'];

// Extended types with relations
export type BankTransactionWithPayment = BankTransaction & {
  matched_payment?: { id: string; amount: number; payment_date: string; client?: { name: string } | null } | null;
};

// Enum types
export type InvoiceStatus = Database['public']['Enums']['invoice_status'];
export type ClosureStatus = Database['public']['Enums']['closure_status'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];
export type CommissionStatus = Database['public']['Enums']['commission_status'];
export type ReconciliationStatus = Database['public']['Enums']['reconciliation_status'];
export type PaymentMethod = Database['public']['Enums']['payment_method'];

// Status configurations - Invoice (Simplificado)
export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bgColor: string; textColor: string }> = {
  draft: { label: 'Borrador', color: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
  pending: { label: 'Pendiente', color: '#f59e0b', bgColor: 'bg-amber-100', textColor: 'text-amber-700' }, // Deprecated in UI
  sent: { label: 'Emitida', color: '#3b82f6', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  paid: { label: 'Pagada', color: '#22c55e', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  partial: { label: 'Pago Parcial', color: '#8b5cf6', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
  overdue: { label: 'Vencida', color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-700' },
  cancelled: { label: 'Anulada', color: '#9ca3af', bgColor: 'bg-gray-200', textColor: 'text-gray-600' },
};

// Status configurations - Closure (Simplificado)
export const CLOSURE_STATUS_CONFIG: Record<ClosureStatus, { label: string; color: string; bgColor: string; textColor: string; icon: string }> = {
  draft: { label: 'Borrador', color: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-700', icon: '📝' },
  review: { label: 'Por Aprobar', color: '#f59e0b', bgColor: 'bg-amber-100', textColor: 'text-amber-700', icon: '🔍' },
  client_review: { label: 'Revisión Cliente', color: '#3b82f6', bgColor: 'bg-blue-100', textColor: 'text-blue-700', icon: '👤' }, // Deprecated in UI
  approved: { label: 'Aprobado', color: '#22c55e', bgColor: 'bg-green-100', textColor: 'text-green-700', icon: '✅' },
  closed: { label: 'Cerrado', color: '#0891b2', bgColor: 'bg-cyan-100', textColor: 'text-cyan-700', icon: '🔒' }, // Deprecated in UI
  invoicing: { label: 'Facturando', color: '#8b5cf6', bgColor: 'bg-purple-100', textColor: 'text-purple-700', icon: '📄' }, // Deprecated in UI
  invoiced: { label: 'Facturado', color: '#15803d', bgColor: 'bg-green-200', textColor: 'text-green-800', icon: '✔️' },
  cancelled: { label: 'Cancelado', color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-700', icon: '❌' },
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string; bgColor: string; textColor: string }> = {
  pending: { label: 'Pendiente', color: '#f59e0b', bgColor: 'bg-amber-100', textColor: 'text-amber-700' },
  confirmed: { label: 'Confirmado', color: '#22c55e', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  rejected: { label: 'Rechazado', color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-700' },
};

export const COMMISSION_STATUS_CONFIG: Record<CommissionStatus, { label: string; color: string; bgColor: string; textColor: string }> = {
  pending: { label: 'Pendiente', color: '#f59e0b', bgColor: 'bg-amber-100', textColor: 'text-amber-700' },
  approved: { label: 'Aprobada', color: '#3b82f6', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  paid: { label: 'Pagada', color: '#22c55e', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  cancelled: { label: 'Cancelada', color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-700' },
};

export const RECONCILIATION_STATUS_CONFIG: Record<ReconciliationStatus, { label: string; color: string; bgColor: string; textColor: string }> = {
  pending: { label: 'Pendiente', color: '#f59e0b', bgColor: 'bg-amber-100', textColor: 'text-amber-700' },
  matched: { label: 'Conciliado', color: '#22c55e', bgColor: 'bg-green-100', textColor: 'text-green-700' },
  unmatched: { label: 'Sin Coincidir', color: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
  disputed: { label: 'En Disputa', color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-700' },
};

export const PAYMENT_METHODS: Record<PaymentMethod, { label: string; icon: string }> = {
  cash: { label: 'Efectivo', icon: '💵' },
  transfer: { label: 'Transferencia', icon: '🏦' },
  check: { label: 'Cheque', icon: '📝' },
  card: { label: 'Tarjeta', icon: '💳' },
};

// Workflow transitions - Closure (Simplificado)
export const CLOSURE_TRANSITIONS: Record<ClosureStatus, ClosureStatus[]> = {
  draft: ['review', 'cancelled'],
  review: ['approved', 'draft', 'cancelled'], // "Por Aprobar" -> Aprobado (Skip client_review)
  client_review: ['approved', 'review', 'cancelled'], // Legacy support
  approved: ['invoiced', 'cancelled'], // Skip closed/invoicing
  closed: ['invoicing', 'approved', 'cancelled'], // Legacy
  invoicing: ['invoiced', 'closed'], // Legacy
  invoiced: [],
  cancelled: ['draft'],
};

export const INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ['sent', 'cancelled'], // Skip pending
  pending: ['sent', 'cancelled'], // Legacy
  sent: ['paid', 'partial', 'overdue', 'cancelled'],
  paid: [],
  partial: ['paid', 'overdue', 'cancelled'],
  overdue: ['paid', 'partial', 'cancelled'],
  cancelled: ['draft'],
};

// Helper functions
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getClosureNextStatuses(status: ClosureStatus): ClosureStatus[] {
  return CLOSURE_TRANSITIONS[status] || [];
}

export function getInvoiceNextStatuses(status: InvoiceStatus): InvoiceStatus[] {
  return INVOICE_TRANSITIONS[status] || [];
}

export function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

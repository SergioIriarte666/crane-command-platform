export type ClientType = 'particular' | 'empresa' | 'aseguradora' | 'gobierno';

export interface ClientContact {
  id: string;
  name: string;
  position: string;
  phone: string;
  email: string;
  is_primary: boolean;
}

export interface Client {
  id: string;
  tenant_id: string;
  code: string | null;
  type: ClientType;
  name: string;
  trade_name: string | null;
  tax_id: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string;
  phone: string | null;
  phone_alt: string | null;
  email: string | null;
  website: string | null;
  contacts: ClientContact[];
  payment_terms: number;
  credit_limit: number;
  requires_po: boolean;
  requires_approval: boolean;
  default_discount: number;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientFormData {
  type: ClientType;
  name: string;
  trade_name: string;
  tax_id: string;
  tax_regime: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  phone_alt: string;
  email: string;
  website: string;
  contacts: ClientContact[];
  payment_terms: number;
  credit_limit: number;
  requires_po: boolean;
  requires_approval: boolean;
  default_discount: number;
  notes: string;
}

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  particular: 'Particular',
  empresa: 'Empresa',
  aseguradora: 'Aseguradora',
  gobierno: 'Gobierno',
};

export const CLIENT_TYPE_COLORS: Record<ClientType, string> = {
  particular: 'bg-secondary text-secondary-foreground',
  empresa: 'bg-primary/10 text-primary',
  aseguradora: 'bg-info/10 text-info',
  gobierno: 'bg-warning/10 text-warning',
};

// Configuración de impuestos Chile
export const TAX_CONFIG = {
  country: 'Chile',
  currency: 'CLP',
  currencySymbol: '$',
  taxName: 'IVA',
  taxRate: 0.19, // 19%
  taxRatePercent: 19,
  timezone: 'America/Santiago',
  locale: 'es-CL',
  dateFormat: 'dd-MM-yyyy',
  phonePrefix: '+56',
};

// Formato de RUT chileno
export const formatRUT = (rut: string): string => {
  // Eliminar puntos y guión
  const value = rut.replace(/\./g, '').replace(/-/g, '');
  
  if (value.length < 2) return value;
  
  // Separar número y dígito verificador
  const dv = value.slice(-1);
  const num = value.slice(0, -1);
  
  // Formatear con puntos
  const formattedNum = num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `${formattedNum}-${dv}`;
};

// Validar RUT chileno
export const validateRUT = (rut: string): boolean => {
  if (!rut) return false;
  
  // Limpiar RUT
  const cleanRUT = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  
  if (cleanRUT.length < 2) return false;
  
  const body = cleanRUT.slice(0, -1);
  const dv = cleanRUT.slice(-1);
  
  // Calcular dígito verificador
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDV = 11 - (sum % 11);
  const calculatedDV = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString();
  
  return dv === calculatedDV;
};

// Formatear moneda chilena
export const formatCLP = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Calcular IVA
export const calculateIVA = (netAmount: number): { net: number; iva: number; total: number } => {
  const iva = Math.round(netAmount * TAX_CONFIG.taxRate);
  return {
    net: netAmount,
    iva,
    total: netAmount + iva,
  };
};

// Calcular neto desde total con IVA
export const calculateNetFromTotal = (totalWithIVA: number): { net: number; iva: number; total: number } => {
  const net = Math.round(totalWithIVA / (1 + TAX_CONFIG.taxRate));
  const iva = totalWithIVA - net;
  return {
    net,
    iva,
    total: totalWithIVA,
  };
};

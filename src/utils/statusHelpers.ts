// src/utils/statusHelpers.ts
// Sistema global de estados para servicios, cierres y facturas

import React from 'react';
import { Badge } from '@/components/ui/badge';

// Estados de Servicios (Simplificado)
export type ServiceStatusType = 
  | 'draft'
  | 'quoted'
  | 'confirmed'
  | 'assigned'
  // | 'en_route' // Simplificado
  // | 'on_site' // Simplificado
  | 'in_progress'
  | 'completed'
  | 'invoiced'
  | 'cancelled';

// Estados de Cierres (7 estados)
export type ClosureStatusType = 
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'closed'
  | 'invoicing'
  | 'invoiced'
  | 'cancelled';

// Estados de Facturas (5 estados)
export type InvoiceStatusType = 
  | 'draft'
  | 'pending'
  | 'sent'
  | 'paid'
  | 'overdue'
  | 'cancelled';

interface StatusConfig {
  label: string;
  className: string;
  bgColor: string;
  textColor: string;
  color: string;
}

// Configuración centralizada de estados de servicios
export const SERVICE_STATUS_CONFIG: Record<ServiceStatusType, StatusConfig> = {
  draft: { 
    label: 'Borrador', 
    className: 'bg-gray-500/80 text-white',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    color: '#6b7280'
  },
  quoted: { 
    label: 'Cotizado', 
    className: 'bg-cyan-500/80 text-white',
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-700',
    color: '#06b6d4'
  },
  confirmed: { 
    label: 'Confirmado', 
    className: 'bg-blue-500/80 text-white',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    color: '#3b82f6'
  },
  assigned: { 
    label: 'Asignado', 
    className: 'bg-purple-500/80 text-white',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    color: '#8b5cf6'
  },
  /* Simplificado
  en_route: { 
    label: 'En Camino', 
    className: 'bg-yellow-500/80 text-white',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    color: '#eab308'
  },
  on_site: { 
    label: 'En Sitio', 
    className: 'bg-orange-500/80 text-white',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-700',
    color: '#f97316'
  },
  */
  in_progress: { 
    label: 'En Curso', // Renamed from En Proceso
    className: 'bg-blue-600/80 text-white',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    color: '#2563eb'
  },
  completed: { 
    label: 'Completado', 
    className: 'bg-green-500/80 text-white',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    color: '#22c55e'
  },
  invoiced: { 
    label: 'Facturado', 
    className: 'bg-purple-600/80 text-white',
    bgColor: 'bg-purple-200',
    textColor: 'text-purple-800',
    color: '#9333ea'
  },
  cancelled: { 
    label: 'Cancelado', 
    className: 'bg-red-500/80 text-white',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    color: '#ef4444'
  }
};

// Configuración de estados de cierres
export const CLOSURE_STATUS_CONFIG: Record<ClosureStatusType, StatusConfig> = {
  draft: { 
    label: 'Borrador', 
    className: 'bg-gray-500/80 text-white',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    color: '#6b7280'
  },
  pending_review: { 
    label: 'En Revisión', 
    className: 'bg-yellow-500/80 text-white',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    color: '#eab308'
  },
  approved: { 
    label: 'Aprobado', 
    className: 'bg-green-500/80 text-white',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    color: '#22c55e'
  },
  closed: { 
    label: 'Cerrado', 
    className: 'bg-blue-500/80 text-white',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    color: '#3b82f6'
  },
  invoicing: { 
    label: 'Facturando', 
    className: 'bg-purple-500/80 text-white',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    color: '#8b5cf6'
  },
  invoiced: { 
    label: 'Facturado', 
    className: 'bg-purple-600/80 text-white',
    bgColor: 'bg-purple-200',
    textColor: 'text-purple-800',
    color: '#9333ea'
  },
  cancelled: { 
    label: 'Cancelado', 
    className: 'bg-red-500/80 text-white',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    color: '#ef4444'
  }
};

// Configuración de estados de facturas
export const INVOICE_STATUS_CONFIG: Record<InvoiceStatusType, StatusConfig> = {
  draft: { 
    label: 'Borrador', 
    className: 'bg-gray-500/80 text-white',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    color: '#6b7280'
  },
  pending: { 
    label: 'Pendiente', 
    className: 'bg-yellow-500/80 text-white',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    color: '#eab308'
  },
  sent: { 
    label: 'Enviada', 
    className: 'bg-blue-500/80 text-white',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    color: '#3b82f6'
  },
  paid: { 
    label: 'Pagada', 
    className: 'bg-green-500/80 text-white',
    bgColor: 'bg-green-100',
    textColor: 'text-green-700',
    color: '#22c55e'
  },
  overdue: { 
    label: 'Vencida', 
    className: 'bg-red-500/80 text-white',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    color: '#ef4444'
  },
  cancelled: { 
    label: 'Cancelada', 
    className: 'bg-gray-600/80 text-white',
    bgColor: 'bg-gray-200',
    textColor: 'text-gray-800',
    color: '#4b5563'
  }
};

// Funciones helper para obtener Badge de estado
export const getServiceStatusBadge = (status: string): React.ReactElement => {
  const config = SERVICE_STATUS_CONFIG[status as ServiceStatusType] || { 
    label: 'Desconocido', 
    className: 'bg-gray-500/80 text-white' 
  };
  
  return React.createElement(Badge, { className: `${config.className} border-none` }, config.label);
};

export const getClosureStatusBadge = (status: string): React.ReactElement => {
  const config = CLOSURE_STATUS_CONFIG[status as ClosureStatusType] || { 
    label: 'Desconocido', 
    className: 'bg-gray-500/80 text-white' 
  };
  
  return React.createElement(Badge, { className: `${config.className} border-none` }, config.label);
};

export const getInvoiceStatusBadge = (status: string): React.ReactElement => {
  const config = INVOICE_STATUS_CONFIG[status as InvoiceStatusType] || { 
    label: 'Desconocido', 
    className: 'bg-gray-500/80 text-white' 
  };
  
  return React.createElement(Badge, { className: `${config.className} border-none` }, config.label);
};

// Obtener config de estado para servicios
export const getServiceStatusConfig = (status: string): StatusConfig => {
  return SERVICE_STATUS_CONFIG[status as ServiceStatusType] || {
    label: 'Desconocido',
    className: 'bg-gray-500/80 text-white',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    color: '#6b7280'
  };
};

// Obtener config de estado para cierres
export const getClosureStatusConfig = (status: string): StatusConfig => {
  return CLOSURE_STATUS_CONFIG[status as ClosureStatusType] || {
    label: 'Desconocido',
    className: 'bg-gray-500/80 text-white',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    color: '#6b7280'
  };
};

// Obtener config de estado para facturas
export const getInvoiceStatusConfig = (status: string): StatusConfig => {
  return INVOICE_STATUS_CONFIG[status as InvoiceStatusType] || {
    label: 'Desconocido',
    className: 'bg-gray-500/80 text-white',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    color: '#6b7280'
  };
};

// Utilidad para formatear moneda CLP
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '$0';
  }
  
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0
  }).format(Number(amount));
};

// Utilidad para verificar si mostrar info de vehículo
export const shouldShowVehicleInfo = (service: any): boolean => {
  const isOptional = service.vehicleInfoOptional || service.service_type?.vehicle_info_optional;
  
  if (!isOptional) return true;
  
  const hasRealData = service.vehicleBrand && 
                     service.vehicleModel && 
                     service.licensePlate &&
                     service.vehicleBrand !== 'N/A';
  
  return hasRealData;
};

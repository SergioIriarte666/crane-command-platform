import { ServiceStatus, ServicePriority, VehicleType, VehicleCondition } from './services';

// Operador asignado a un servicio
export interface ServiceOperator {
  id: string;
  operatorId: string;
  operatorName?: string;
  commission: number;
  role: 'Principal' | 'Auxiliar' | 'Supervisor';
  hours?: number;
}

// Costo del servicio
export interface ServiceCostDetail {
  id: string;
  description: string;
  amount: number;
  quantity: number;
  unitPrice: number;
  notes?: string;
  category_id: string;
  subcategory?: string;
  date?: string;
  isExisting?: boolean;
}

// Configuración de tipo de servicio para validación dinámica
export interface ServiceTypeConfig {
  id: string;
  name: string;
  description?: string;
  basePrice?: number;
  isActive: boolean;
  vehicleInfoOptional: boolean;
  purchaseOrderRequired: boolean;
  originRequired: boolean;
  destinationRequired: boolean;
  craneRequired: boolean;
  operatorRequired: boolean;
  vehicleBrandRequired: boolean;
  vehicleModelRequired: boolean;
  licensePlateRequired: boolean;
}

// Estado del formulario de servicio
export interface ServiceFormData {
  // Paso 1: Información básica
  folio: string;
  folioAuto: boolean;
  requestDate: string;
  serviceDate: string;
  clientId: string;
  clientContactName?: string;
  purchaseOrder?: string;
  quoteNumber?: string;
  serviceType: string;
  priority: ServicePriority;
  
  // Paso 1: Datos opcionales del servicio
  trackStartTime: boolean;
  trackEndTime: boolean;
  trackDistance: boolean;
  startTime?: string;
  endTime?: string;
  
  // Paso 2: Vehículo y ubicación
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePlates: string;
  vehicleType: VehicleType;
  vehicleCondition: VehicleCondition;
  vehicleKeys: boolean;
  vehicleNotes?: string;
  
  originAddress: string;
  originCity?: string;
  originReferences?: string;
  
  destinationAddress: string;
  destinationCity?: string;
  destinationReferences?: string;
  
  distanceKm?: number;
  
  // Paso 3: Recursos
  craneId?: string;
  operators: ServiceOperator[];
  costs: ServiceCostDetail[];
  
  // Paso 4: Financiero
  serviceValue: number;
  hasExcess: boolean;
  clientCoveredAmount?: number;
  excessAmount?: number;
  
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  
  status: ServiceStatus;
  observations?: string;
  internalNotes?: string;
}

// Datos por defecto del formulario
export const getDefaultServiceFormData = (): ServiceFormData => ({
  folio: '',
  folioAuto: true,
  requestDate: new Date().toISOString().split('T')[0],
  serviceDate: new Date().toISOString().split('T')[0],
  clientId: '',
  clientContactName: '',
  serviceType: '',
  priority: 'normal',
  
  // Datos opcionales
  trackStartTime: false,
  trackEndTime: false,
  trackDistance: false,
  startTime: '',
  endTime: '',
  
  vehicleBrand: '',
  vehicleModel: '',
  vehiclePlates: '',
  vehicleType: 'sedan',
  vehicleCondition: 'runs',
  vehicleKeys: true,
  
  originAddress: '',
  destinationAddress: '',
  
  craneId: '',
  operators: [],
  costs: [],
  
  serviceValue: 0,
  hasExcess: false,
  taxRate: 19,
  subtotal: 0,
  taxAmount: 0,
  total: 0,
  
  status: 'draft',
});

// Configuración por defecto de tipos de servicio para validación
// Ahora se usa dinámicamente desde catalog_items, este es solo un fallback
export const getDefaultServiceTypeConfig = (): Partial<ServiceTypeConfig> => ({
  vehicleInfoOptional: false,
  purchaseOrderRequired: false,
  originRequired: true,
  destinationRequired: true,
  craneRequired: true,
  operatorRequired: true,
  vehicleBrandRequired: true,
  vehicleModelRequired: true,
  licensePlateRequired: true,
});

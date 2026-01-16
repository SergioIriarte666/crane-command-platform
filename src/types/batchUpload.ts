// Types for CSV/Excel batch upload and XML parsing

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value: unknown;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  validRows: MappedServiceData[];
  totalRows: number;
  validCount: number;
  errorCount: number;
  warningCount: number;
}

export interface UploadProgress {
  total: number;
  processed: number;
  percentage: number;
  currentBatch: number;
  totalBatches: number;
  stage: 'parsing' | 'validating' | 'mapping' | 'uploading';
}

export interface UploadResult {
  success: boolean;
  processed: number;
  errors: number;
  message: string;
  failedRows?: number[];
  errorDetails?: ValidationError[];
  insertedFolios?: string[];
}

export interface MappedServiceData {
  folio: string;
  requestDate: string;
  serviceDate: string;
  clientId: string;
  clientName?: string;
  vehicleBrand: string;
  vehicleModel: string;
  licensePlate: string;
  origin: string;
  destination: string;
  serviceTypeId: string;
  value: number;
  craneId: string;
  operatorId: string;
  operatorCommission: number;
  observations?: string;
}

export interface MappingResult {
  success: boolean;
  data?: MappedServiceData;
  errors: string[];
  warnings?: string[];
}

export interface HeaderMappingResult {
  valid: boolean;
  missing: string[];
  extra: string[];
}

export interface ReferenceData {
  clients: Array<{ id: string; name: string; code: string | null; tax_id: string | null }>;
  cranes: Array<{ id: string; unit_number: string; plates: string | null }>;
  operators: Array<{ id: string; full_name: string; employee_number: string }>;
  serviceTypes: Array<{ id: string; name: string; code: string }>;
  existingFolios: string[];
}

// Header mapping from Spanish to English field names
export const HEADER_MAP: Record<string, string> = {
  // Main headers
  'Folio': 'folio',
  'Fecha Solicitud': 'requestDate',
  'Fecha Servicio': 'serviceDate',
  'Cliente RUT': 'clientRut',
  'Cliente Nombre': 'clientName',
  'Cliente Departamento': 'clientDepartment',
  'Vehículo Marca': 'vehicleBrand',
  'Vehículo Modelo': 'vehicleModel',
  'Patente': 'licensePlate',
  'Origen': 'origin',
  'Destino': 'destination',
  'Tipo Servicio': 'serviceType',
  'Valor': 'value',
  'Grúa Patente': 'craneLicensePlate',
  'Operador RUT': 'operatorRut',
  'Comisión Operador': 'operatorCommission',
  'Observaciones': 'observations',
  
  // Variations (uppercase, lowercase, etc.)
  'FOLIO': 'folio',
  'folio': 'folio',
  'FECHA SOLICITUD': 'requestDate',
  'RUT Cliente': 'clientRut',
  'Nombre Cliente': 'clientName',
  'Departamento': 'clientDepartment',
  'Marca Vehículo': 'vehicleBrand',
  'Modelo Vehículo': 'vehicleModel',
  'Placa': 'licensePlate',
  'Origin': 'origin',
  'Destination': 'destination',
  'Servicio': 'serviceType',
  'Precio': 'value',
  'Patente Grúa': 'craneLicensePlate',
  'RUT Operador': 'operatorRut',
  'Notes': 'observations',
  'Notas': 'observations',
  'Comentarios': 'observations',
};

export const REQUIRED_FIELDS = [
  'folio', 'requestDate', 'serviceDate', 'clientRut', 'clientName', 
  'vehicleBrand', 'vehicleModel', 'licensePlate', 'origin', 'destination',
  'serviceType', 'value', 'craneLicensePlate', 'operatorRut', 'operatorCommission'
];

export const TEMPLATE_HEADERS = [
  'Folio', 'Fecha Solicitud', 'Fecha Servicio', 'Cliente RUT', 'Cliente Nombre',
  'Cliente Departamento', 'Vehículo Marca', 'Vehículo Modelo', 'Patente',
  'Origen', 'Destino', 'Tipo Servicio', 'Valor', 'Grúa Patente',
  'Operador RUT', 'Comisión Operador', 'Observaciones'
];

export const SAMPLE_DATA = [
  ['SRV-001', '2024-01-15', '2024-01-16', '76123456-7', 'Transportes Santiago Ltda.', 
   'Administración', 'Mercedes-Benz', 'Actros', 'ABCD-12', 'Santiago Centro', 
   'Las Condes', 'Grúa Pesada', '150000', 'GR-001', '12345678-9', '15000', 'Ejemplo'],
  ['SRV-002', '2024-01-17', '2024-01-18', '96987654-3', 'Empresa Logística Norte S.A.', 
   'Operaciones', 'Volvo', 'FH', 'MNOP-34', 'Valparaíso', 'Santiago', 
   'Grúa Mediana', '85000', 'GR-002', '98765432-1', '8500', 'Cuidado especial']
];

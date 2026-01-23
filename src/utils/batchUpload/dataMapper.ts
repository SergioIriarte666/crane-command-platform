import { supabase } from '@/integrations/supabase/client';
import { 
  MappedServiceData, 
  MappingResult, 
  ReferenceData, 
  ValidationError,
  ValidationResult 
} from '@/types/batchUpload';
import { HeaderMapper } from './headerMapper';

export class DataMapper {
  private headerMapper: HeaderMapper;
  private referenceData: ReferenceData | null = null;
  private tenantId: string | null = null;

  constructor() {
    this.headerMapper = new HeaderMapper();
  }

  async initialize(tenantId: string): Promise<void> {
    this.tenantId = tenantId;
    
    // Load all reference data in parallel
    const [clientsRes, cranesRes, operatorsRes, serviceTypesRes, servicesRes] = await Promise.all([
      supabase.from('clients').select('id, name, code, tax_id').eq('tenant_id', tenantId),
      supabase.from('cranes').select('id, unit_number, plates').eq('tenant_id', tenantId),
      supabase.from('operators').select('id, full_name, employee_number').eq('tenant_id', tenantId),
      supabase.from('catalog_items').select('id, name, code').eq('tenant_id', tenantId).eq('catalog_type', 'service_type'),
      supabase.from('services').select('folio').eq('tenant_id', tenantId),
    ]);

    this.referenceData = {
      clients: clientsRes.data || [],
      cranes: cranesRes.data || [],
      operators: operatorsRes.data || [],
      serviceTypes: serviceTypesRes.data || [],
      existingFolios: (servicesRes.data || []).map(s => s.folio),
    };
  }

  mapHeaders(headers: string[]): string[] {
    return this.headerMapper.mapHeaders(headers);
  }

  validateHeaders(headers: string[]) {
    return this.headerMapper.validateHeaders(headers);
  }

  async mapRowData(row: Record<string, unknown>): Promise<MappingResult> {
    if (!this.referenceData) {
      return { success: false, errors: ['DataMapper no inicializado'], warnings: [] };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Find client by RUT or name
    const clientRut = String(row.clientRut || '').replace(/\./g, '').trim();
    const clientName = String(row.clientName || '').trim();
    
    let client = this.referenceData.clients.find(
      c => c.tax_id?.replace(/\./g, '') === clientRut || 
           c.name.toLowerCase() === clientName.toLowerCase()
    );
    
    if (!client && clientName) {
      // Try partial match
      client = this.referenceData.clients.find(
        c => c.name.toLowerCase().includes(clientName.toLowerCase())
      );
    }
    
    if (!client) {
      errors.push(`Cliente no encontrado: ${clientName || clientRut}`);
    }

    // Find crane by plates or unit number
    const cranePlate = String(row.craneLicensePlate || '').trim().toUpperCase();
    const crane = this.referenceData.cranes.find(
      c => c.plates?.toUpperCase() === cranePlate || 
           c.unit_number.toUpperCase() === cranePlate
    );
    
    if (!crane) {
      errors.push(`Grúa no encontrada: ${cranePlate}`);
    }

    // Find operator by RUT or employee number
    const operatorRut = String(row.operatorRut || '').replace(/\./g, '').trim();
    let operator = this.referenceData.operators.find(
      o => o.employee_number === operatorRut
    );
    
    if (!operator) {
      // Try matching by name if available
      const operatorName = String(row.operatorName || '').trim();
      if (operatorName) {
        operator = this.referenceData.operators.find(
          o => o.full_name.toLowerCase().includes(operatorName.toLowerCase())
        );
      }
    }
    
    if (!operator) {
      errors.push(`Operador no encontrado: ${operatorRut}`);
    }

    // Find service type
    const serviceTypeName = String(row.serviceType || '').trim();
    let serviceType = this.referenceData.serviceTypes.find(
      s => s.name.toLowerCase() === serviceTypeName.toLowerCase() ||
           s.code.toLowerCase() === serviceTypeName.toLowerCase()
    );
    
    if (!serviceType && serviceTypeName) {
      // Try partial match
      serviceType = this.referenceData.serviceTypes.find(
        s => s.name.toLowerCase().includes(serviceTypeName.toLowerCase())
      );
    }

    if (!serviceType && this.referenceData.serviceTypes.length > 0) {
      warnings.push(`Tipo de servicio "${serviceTypeName}" no encontrado, se usará el primero disponible`);
      serviceType = this.referenceData.serviceTypes[0];
    }

    if (errors.length > 0) {
      return { success: false, errors, warnings };
    }

    const data: MappedServiceData = {
      folio: String(row.folio || '').trim(),
      requestDate: this.parseDate(row.requestDate),
      serviceDate: this.parseDate(row.serviceDate),
      clientId: client!.id,
      clientName: client!.name,
      vehicleBrand: String(row.vehicleBrand || '').trim(),
      vehicleModel: String(row.vehicleModel || '').trim(),
      licensePlate: String(row.licensePlate || '').trim().toUpperCase(),
      origin: String(row.origin || '').trim(),
      destination: String(row.destination || '').trim(),
      serviceTypeId: serviceType?.id || '',
      value: this.parseNumber(row.value),
      craneId: crane!.id,
      operatorId: operator!.id,
      operatorCommission: this.parseNumber(row.operatorCommission),
      observations: String(row.observations || '').trim() || undefined,
    };

    return { success: true, data, errors: [], warnings };
  }

  async validateAndMapData(
    csvData: Record<string, unknown>[],
    onProgress?: (progress: { percentage: number }) => void
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const validRows: MappedServiceData[] = [];
    let warningCount = 0;

    // Validate headers
    if (csvData.length > 0) {
      const headers = Object.keys(csvData[0]);
      const headerValidation = this.validateHeaders(headers);
      
      if (!headerValidation.valid) {
        headerValidation.missing.forEach(missing => {
          errors.push({
            row: -1,
            field: 'headers',
            message: `Columna requerida faltante: ${missing}`,
            value: missing,
            severity: 'error'
          });
        });
      }
    }

    // Process each row
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      
      if (onProgress) {
        onProgress({ percentage: Math.round(((i + 1) / csvData.length) * 100) });
      }

      // Map headers
      const mappedRow: Record<string, unknown> = {};
      const originalHeaders = Object.keys(row);
      const mappedHeaders = this.mapHeaders(originalHeaders);
      
      originalHeaders.forEach((key, index) => {
        mappedRow[mappedHeaders[index]] = row[key];
      });

      // Check duplicate folios
      const folio = String(mappedRow.folio || '').trim();
      if (folio && this.referenceData?.existingFolios.includes(folio)) {
        errors.push({
          row: i,
          field: 'folio',
          message: `Folio duplicado: ${folio}`,
          value: folio,
          severity: 'error'
        });
        continue;
      }

      // Also check for duplicates within the file
      const existingInBatch = validRows.find(r => r.folio === folio);
      if (existingInBatch) {
        errors.push({
          row: i,
          field: 'folio',
          message: `Folio duplicado en archivo: ${folio}`,
          value: folio,
          severity: 'error'
        });
        continue;
      }

      // Map data to IDs
      const mappingResult = await this.mapRowData(mappedRow);
      
      if (!mappingResult.success) {
        mappingResult.errors.forEach(error => {
          errors.push({ 
            row: i, 
            field: 'mapping', 
            message: error, 
            value: mappedRow, 
            severity: 'error' 
          });
        });
      } else if (mappingResult.data) {
        validRows.push(mappingResult.data);
      }

      if (mappingResult.warnings) {
        mappingResult.warnings.forEach(warning => {
          errors.push({ 
            row: i, 
            field: 'warning', 
            message: warning, 
            value: mappedRow, 
            severity: 'warning' 
          });
          warningCount++;
        });
      }
    }

    const errorCount = errors.filter(e => e.severity === 'error').length;
    
    return {
      isValid: errorCount === 0,
      errors,
      validRows,
      totalRows: csvData.length,
      validCount: validRows.length,
      errorCount,
      warningCount
    };
  }

  private parseDate(value: unknown): string {
    if (!value) return new Date().toISOString().split('T')[0];
    
    const str = String(value);
    
    // Try ISO format
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      return str.split('T')[0];
    }
    
    // Try DD/MM/YYYY format
    const parts = str.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Try to parse as Date
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return new Date().toISOString().split('T')[0];
  }

  private parseNumber(value: unknown): number {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    
    const str = String(value).replace(/[^\d.-]/g, '');
    return parseFloat(str) || 0;
  }
}

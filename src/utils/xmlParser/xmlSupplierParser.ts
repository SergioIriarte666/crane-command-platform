// src/utils/xmlParser/xmlSupplierParser.ts

export interface XMLSupplierData {
  name: string;
  rut: string;
  email?: string;
  phone?: string;
  address?: string;
  contact_name?: string;
  category?: string;
  notes?: string;
  is_active: boolean;
}

export interface XMLSupplierParseResult {
  success: boolean;
  data: XMLSupplierData[];
  errors: string[];
  warnings: string[];
  totalRows: number;
  validRows: number;
}

export class XMLSupplierParser {
  private parser: DOMParser;

  constructor() {
    this.parser = new DOMParser();
  }

  public async parseXMLFile(file: File): Promise<XMLSupplierParseResult> {
    try {
      const text = await this.readFileAsText(file);
      return this.parseXMLString(text);
    } catch (error) {
      return {
        success: false,
        data: [],
        errors: [`Error leyendo archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`],
        warnings: [],
        totalRows: 0,
        validRows: 0
      };
    }
  }

  public parseXMLString(xmlString: string): XMLSupplierParseResult {
    try {
      const doc = this.parser.parseFromString(xmlString, 'text/xml');
      
      const parseError = doc.querySelector('parsererror');
      if (parseError) {
        return {
          success: false,
          data: [],
          errors: ['El archivo XML no es válido'],
          warnings: [],
          totalRows: 0,
          validRows: 0
        };
      }

      const suppliers = this.extractSuppliersFromDTE(doc);
      const validation = this.validateData(suppliers);

      return {
        success: validation.errors.length === 0,
        data: suppliers,
        errors: validation.errors,
        warnings: validation.warnings,
        totalRows: suppliers.length,
        validRows: suppliers.filter(s => this.isValidItem(s)).length
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        errors: [`Error procesando XML: ${error instanceof Error ? error.message : 'Error desconocido'}`],
        warnings: [],
        totalRows: 0,
        validRows: 0
      };
    }
  }

  private extractSuppliersFromDTE(doc: Document): XMLSupplierData[] {
    const suppliers: XMLSupplierData[] = [];
    const seenRuts = new Set<string>();
    
    // Buscar en estructura DTE
    const dteElements = doc.querySelectorAll('DTE');
    
    dteElements.forEach(dte => {
      const supplier = this.extractSupplierFromDTE(dte);
      if (supplier && !seenRuts.has(supplier.rut)) {
        seenRuts.add(supplier.rut);
        suppliers.push(supplier);
      }
    });

    // Si no hay DTEs, buscar estructura genérica
    if (suppliers.length === 0) {
      const proveedores = doc.querySelectorAll('proveedor, supplier, emisor');
      proveedores.forEach(prov => {
        const supplier = this.extractFromGenericElement(prov);
        if (supplier && !seenRuts.has(supplier.rut)) {
          seenRuts.add(supplier.rut);
          suppliers.push(supplier);
        }
      });
    }

    return suppliers;
  }

  private extractSupplierFromDTE(dteElement: Element): XMLSupplierData | null {
    const getNestedValue = (path: string): string => {
      const parts = path.split('/');
      let current: Element | null = dteElement;
      for (const part of parts) {
        if (!current) return '';
        const child: Element | null = current.querySelector(part);
        if (!child) return '';
        current = child;
      }
      return current?.textContent?.trim() || '';
    };

    const rut = getNestedValue('Documento/Encabezado/Emisor/RUTEmisor');
    const name = getNestedValue('Documento/Encabezado/Emisor/RznSoc');
    const giro = getNestedValue('Documento/Encabezado/Emisor/GiroEmis');
    const direccion = getNestedValue('Documento/Encabezado/Emisor/DirOrigen');
    const telefono = getNestedValue('Documento/Encabezado/Emisor/Telefono');
    const email = getNestedValue('Documento/Encabezado/Emisor/CorreoEmisor');

    if (!rut || !name) return null;

    return {
      name: name,
      rut: this.formatRUT(rut),
      email: email || '',
      phone: telefono || '',
      address: direccion || '',
      contact_name: '',
      category: this.categorizeByBusiness(giro || name),
      notes: giro ? `Giro comercial: ${giro}` : '',
      is_active: true
    };
  }

  private extractFromGenericElement(element: Element): XMLSupplierData | null {
    const rut = element.querySelector('rut')?.textContent?.trim() || 
                element.querySelector('RUT')?.textContent?.trim() || '';
    const name = element.querySelector('nombre')?.textContent?.trim() || 
                 element.querySelector('name')?.textContent?.trim() ||
                 element.querySelector('razon_social')?.textContent?.trim() || '';

    if (!rut || !name) return null;

    return {
      name,
      rut: this.formatRUT(rut),
      email: element.querySelector('email')?.textContent?.trim() || '',
      phone: element.querySelector('telefono')?.textContent?.trim() || 
             element.querySelector('phone')?.textContent?.trim() || '',
      address: element.querySelector('direccion')?.textContent?.trim() || 
               element.querySelector('address')?.textContent?.trim() || '',
      contact_name: element.querySelector('contacto')?.textContent?.trim() || '',
      category: 'otros',
      notes: '',
      is_active: true
    };
  }

  private formatRUT(rut: string): string {
    const cleaned = rut.replace(/[^\dkK]/g, '');
    if (cleaned.length < 8) return rut;
    
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1).toUpperCase();
    
    return body.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
  }

  public validateRUT(rut: string): boolean {
    const cleaned = rut.replace(/[^\dkK]/g, '');
    if (cleaned.length < 8) return false;
    
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1).toUpperCase();
    
    let sum = 0;
    let multiplier = 2;
    
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    
    const calculatedDV = 11 - (sum % 11);
    const expectedDV = calculatedDV === 11 ? '0' : calculatedDV === 10 ? 'K' : calculatedDV.toString();
    
    return dv === expectedDV;
  }

  private categorizeByBusiness(businessDescription: string): string {
    const description = businessDescription.toLowerCase();
    
    if (description.includes('combustible') || description.includes('gasolina') || description.includes('bencina')) {
      return 'combustible';
    }
    if (description.includes('mantención') || description.includes('taller') || description.includes('mecánico')) {
      return 'mantenimiento';
    }
    if (description.includes('seguro') || description.includes('póliza')) {
      return 'seguros';
    }
    if (description.includes('peaje') || description.includes('autopista')) {
      return 'peajes';
    }
    if (description.includes('repuesto') || description.includes('autopart')) {
      return 'repuestos';
    }
    
    return 'otros';
  }

  private validateData(data: XMLSupplierData[]): { errors: string[], warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    data.forEach((item, index) => {
      if (!item.name) errors.push(`Registro ${index + 1}: Nombre es requerido`);
      if (!item.rut) errors.push(`Registro ${index + 1}: RUT es requerido`);
      if (item.rut && !this.validateRUT(item.rut)) {
        warnings.push(`Registro ${index + 1}: RUT ${item.rut} podría ser inválido`);
      }
      if (!item.email && !item.phone) {
        warnings.push(`Registro ${index + 1}: Sin datos de contacto`);
      }
    });

    return { errors, warnings };
  }

  private isValidItem(item: XMLSupplierData): boolean {
    return !!(item.name && item.rut);
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Error leyendo archivo'));
      reader.readAsText(file);
    });
  }
}

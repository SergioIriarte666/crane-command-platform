// src/utils/xmlParser/xmlCostParser.ts

export interface XMLCostData {
  fecha: Date | string;
  descripcion: string;
  monto: number;
  categoria?: string;
  subcategoria?: string;
  proveedor?: string;
  rut?: string;
  telefono?: string;
  notas?: string;
  numeroFactura?: string;
}

export interface XMLParseResult {
  success: boolean;
  data: XMLCostData[];
  errors: string[];
  warnings: string[];
  totalRows: number;
  validRows: number;
}

interface XMLStructure {
  name: string;
  rootElement: string;
  itemElement: string;
  fields: XMLFieldMapping[];
}

interface XMLFieldMapping {
  source: string;
  target: keyof XMLCostData;
  type: 'string' | 'number' | 'date';
  required?: boolean;
}

export class XMLCostParser {
  private parser: DOMParser;

  constructor() {
    this.parser = new DOMParser();
  }

  public async parseXMLFile(file: File): Promise<XMLParseResult> {
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

  public parseXMLString(xmlString: string): XMLParseResult {
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

      const structure = this.detectXMLStructure(doc);
      const data = this.extractDataFromXML(doc, structure);
      const validation = this.validateData(data);

      return {
        success: validation.errors.length === 0,
        data: data,
        errors: validation.errors,
        warnings: validation.warnings,
        totalRows: data.length,
        validRows: data.filter(item => this.isValidItem(item)).length
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

  private detectXMLStructure(doc: Document): XMLStructure {
    // Detectar DTE chileno
    if (doc.querySelector('DTE')) {
      return this.getDTEStructure();
    }
    
    // Detectar estructura de gastos genérica
    if (doc.querySelector('gastos')) {
      return this.getGenericExpenseStructure();
    }
    
    // Detectar facturas genéricas
    if (doc.querySelector('facturas')) {
      return this.getGenericInvoiceStructure();
    }
    
    // Detección automática
    return this.detectAutomaticStructure(doc);
  }

  private getDTEStructure(): XMLStructure {
    return {
      name: 'DTE',
      rootElement: 'DTE',
      itemElement: 'Documento',
      fields: [
        { source: 'Encabezado/IdDoc/FchEmis', target: 'fecha', type: 'date', required: true },
        { source: 'Encabezado/Totales/MntTotal', target: 'monto', type: 'number', required: true },
        { source: 'Encabezado/Emisor/RznSoc', target: 'proveedor', type: 'string' },
        { source: 'Encabezado/Emisor/RUTEmisor', target: 'rut', type: 'string' },
        { source: 'Encabezado/IdDoc/Folio', target: 'numeroFactura', type: 'string' },
      ]
    };
  }

  private getGenericExpenseStructure(): XMLStructure {
    return {
      name: 'Gastos',
      rootElement: 'gastos',
      itemElement: 'gasto',
      fields: [
        { source: 'fecha', target: 'fecha', type: 'date', required: true },
        { source: 'monto', target: 'monto', type: 'number', required: true },
        { source: 'descripcion', target: 'descripcion', type: 'string', required: true },
        { source: 'proveedor', target: 'proveedor', type: 'string' },
        { source: 'categoria', target: 'categoria', type: 'string' },
      ]
    };
  }

  private getGenericInvoiceStructure(): XMLStructure {
    return {
      name: 'Facturas',
      rootElement: 'facturas',
      itemElement: 'factura',
      fields: [
        { source: 'fecha', target: 'fecha', type: 'date', required: true },
        { source: 'total', target: 'monto', type: 'number', required: true },
        { source: 'concepto', target: 'descripcion', type: 'string', required: true },
        { source: 'emisor', target: 'proveedor', type: 'string' },
        { source: 'numero', target: 'numeroFactura', type: 'string' },
      ]
    };
  }

  private detectAutomaticStructure(doc: Document): XMLStructure {
    // Buscar elementos que parezcan items
    const possibleItems = ['item', 'row', 'record', 'entry', 'registro', 'linea'];
    
    for (const itemName of possibleItems) {
      const items = doc.querySelectorAll(itemName);
      if (items.length > 0) {
        return {
          name: 'Auto',
          rootElement: doc.documentElement.tagName,
          itemElement: itemName,
          fields: this.detectFieldsFromElement(items[0])
        };
      }
    }

    // Fallback: usar hijos directos del root
    const root = doc.documentElement;
    const firstChild = root.firstElementChild;
    
    if (firstChild) {
      return {
        name: 'Auto',
        rootElement: root.tagName,
        itemElement: firstChild.tagName,
        fields: this.detectFieldsFromElement(firstChild)
      };
    }

    return this.getGenericExpenseStructure();
  }

  private detectFieldsFromElement(element: Element): XMLFieldMapping[] {
    const fields: XMLFieldMapping[] = [];
    const datePatterns = ['fecha', 'date', 'fch', 'fec'];
    const amountPatterns = ['monto', 'amount', 'total', 'valor', 'importe'];
    const descPatterns = ['descripcion', 'desc', 'concepto', 'detalle'];

    Array.from(element.children).forEach(child => {
      const tagName = child.tagName.toLowerCase();
      
      if (datePatterns.some(p => tagName.includes(p))) {
        fields.push({ source: child.tagName, target: 'fecha', type: 'date', required: true });
      } else if (amountPatterns.some(p => tagName.includes(p))) {
        fields.push({ source: child.tagName, target: 'monto', type: 'number', required: true });
      } else if (descPatterns.some(p => tagName.includes(p))) {
        fields.push({ source: child.tagName, target: 'descripcion', type: 'string', required: true });
      }
    });

    return fields;
  }

  private extractDataFromXML(doc: Document, structure: XMLStructure): XMLCostData[] {
    const items: XMLCostData[] = [];
    const elements = doc.querySelectorAll(structure.itemElement);

    elements.forEach((element) => {
      const item: Partial<XMLCostData> = {};

      structure.fields.forEach(field => {
        const value = this.getNestedValue(element, field.source);
        if (value) {
          (item as Record<string, unknown>)[field.target] = this.transformValue(value, field.type);
        }
      });

      // Añadir descripción si no existe
      if (!item.descripcion && item.proveedor) {
        item.descripcion = `Factura de ${item.proveedor}`;
      }

      // Auto-categorizar por proveedor
      if (!item.categoria && item.proveedor) {
        item.categoria = this.categorizeBySupplier(item.proveedor);
      }

      if (item.fecha && item.monto && item.descripcion) {
        items.push(item as XMLCostData);
      }
    });

    return items;
  }

  private categorizeBySupplier(supplier: string): string {
    const name = supplier.toLowerCase();
    
    if (name.includes('combustible') || name.includes('copec') || name.includes('shell') || name.includes('petrobras')) {
      return 'combustible';
    }
    if (name.includes('mantención') || name.includes('taller') || name.includes('repuesto') || name.includes('automotriz')) {
      return 'mantenimiento';
    }
    if (name.includes('seguro') || name.includes('póliza')) {
      return 'seguros';
    }
    if (name.includes('peaje') || name.includes('autopista') || name.includes('tag')) {
      return 'peajes';
    }
    
    return 'otros';
  }

  private validateData(data: XMLCostData[]): { errors: string[], warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    data.forEach((item, index) => {
      if (!item.fecha) errors.push(`Registro ${index + 1}: Fecha es requerida`);
      if (!item.monto || item.monto <= 0) errors.push(`Registro ${index + 1}: Monto debe ser mayor a 0`);
      if (!item.descripcion) errors.push(`Registro ${index + 1}: Descripción es requerida`);
      if (!item.proveedor) warnings.push(`Registro ${index + 1}: Proveedor no especificado`);
    });

    return { errors, warnings };
  }

  private isValidItem(item: XMLCostData): boolean {
    return !!(item.fecha && item.monto && item.monto > 0 && item.descripcion);
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Error leyendo archivo'));
      reader.readAsText(file);
    });
  }

  private getNestedValue(element: Element, path: string): string {
    const parts = path.split('/');
    let current: Element | null = element;
    for (const part of parts) {
      if (!current) return '';
      const child: Element | null = current.querySelector(part);
      if (!child) return '';
      current = child;
    }
    return current?.textContent?.trim() || '';
  }

  private transformValue(value: string, type: 'string' | 'number' | 'date'): string | number | Date {
    switch (type) {
      case 'number':
        return parseFloat(value.replace(/[^\d.-]/g, '')) || 0;
      case 'date':
        return new Date(value);
      case 'string':
      default:
        return value;
    }
  }
}

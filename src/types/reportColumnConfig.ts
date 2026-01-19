// src/types/reportColumnConfig.ts

export interface ReportColumnConfig {
  visible: boolean;
  width: number;      // Porcentaje del ancho (3-25%)
  label: string;
}

export interface ReportColumnsConfig {
  columns: {
    fecha: ReportColumnConfig;
    folio: ReportColumnConfig;
    cliente: ReportColumnConfig;
    asegurado: ReportColumnConfig;
    cotizacion: ReportColumnConfig;
    oc: ReportColumnConfig;
    factura: ReportColumnConfig;
    tipoServicio: ReportColumnConfig;
    patente: ReportColumnConfig;
    origen: ReportColumnConfig;
    destino: ReportColumnConfig;
    estado: ReportColumnConfig;
    valor: ReportColumnConfig;
  };
}

export type ColumnKey = keyof ReportColumnsConfig['columns'];

export const defaultReportColumnConfig: ReportColumnsConfig = {
  columns: {
    fecha: { visible: true, width: 6, label: 'Fecha' },
    folio: { visible: true, width: 6, label: 'Folio' },
    cliente: { visible: true, width: 11, label: 'Cliente' },
    asegurado: { visible: true, width: 11, label: 'Asegurado' },
    cotizacion: { visible: true, width: 6, label: 'Cotización' },
    oc: { visible: true, width: 5, label: 'OC' },
    factura: { visible: true, width: 4, label: 'Factura' },
    tipoServicio: { visible: true, width: 7, label: 'Tipo Servicio' },
    patente: { visible: true, width: 7, label: 'Patente' },
    origen: { visible: true, width: 12, label: 'Origen' },
    destino: { visible: true, width: 12, label: 'Destino' },
    estado: { visible: true, width: 6, label: 'Estado' },
    valor: { visible: true, width: 7, label: 'Valor' }
  }
};

export const columnOrder: ColumnKey[] = [
  'fecha', 'folio', 'cliente', 'asegurado', 'cotizacion', 'oc', 'factura',
  'tipoServicio', 'patente', 'origen', 'destino', 'estado', 'valor'
];

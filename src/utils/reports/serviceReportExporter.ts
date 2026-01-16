// src/utils/reports/serviceReportExporter.ts

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format as formatDate } from 'date-fns';
import { es } from 'date-fns/locale';
import { createExportFileName, addCompanyHeader, truncate, CompanyInfo } from './reportUtils';
import { defaultReportColumnConfig, ColumnKey, columnOrder, ReportColumnsConfig } from '@/types/reportColumnConfig';
import { getServiceStatusConfig } from '@/utils/statusHelpers';

interface ServiceForExport {
  id: string;
  folio: string;
  service_date: string;
  start_time?: string | null;
  end_time?: string | null;
  status: string;
  origin_address?: string | null;
  destination_address?: string | null;
  license_plate?: string | null;
  quote_number?: string | null;
  purchase_order?: string | null;
  invoice_folio?: string | null;
  insured_name?: string | null;
  total_price?: number | null;
  client?: { id: string; name: string; tax_id?: string | null } | null;
  service_type?: { id: string; name: string } | null;
}

interface ExportServiceReportArgs {
  format: 'pdf' | 'excel';
  services: ServiceForExport[];
  company: CompanyInfo;
  appliedFilters: {
    dateRange: { from: string; to: string };
    client: string;
  };
  logoUrl?: string;
  customFileName?: string;
  reportColumnConfig?: ReportColumnsConfig;
}

// Obtener valor de columna
const getColumnValue = (service: ServiceForExport, key: ColumnKey): string => {
  switch (key) {
    case 'fecha':
      return formatDate(new Date(service.service_date + 'T00:00:00'), 'dd/MM/yy');
    case 'folio':
      return service.folio;
    case 'cliente':
      return truncate(service.client?.name || '-', 14);
    case 'asegurado':
      return truncate(service.insured_name || '-', 14);
    case 'cotizacion':
      return truncate(service.quote_number || '-', 8);
    case 'oc':
      return truncate(service.purchase_order || '-', 6);
    case 'factura':
      return truncate(service.invoice_folio || '-', 5);
    case 'tipoServicio':
      return truncate(service.service_type?.name || '-', 8);
    case 'patente':
      return service.license_plate || 'N/A';
    case 'origen':
      return truncate(service.origin_address || 'N/A', 10);
    case 'destino':
      return truncate(service.destination_address || 'N/A', 10);
    case 'estado':
      return getServiceStatusConfig(service.status).label;
    case 'valor':
      return `$${(service.total_price || 0).toLocaleString('es-CL')}`;
    default:
      return '-';
  }
};

export const exportServiceReport = async ({ 
  format, 
  services, 
  company, 
  appliedFilters, 
  logoUrl, 
  customFileName,
  reportColumnConfig 
}: ExportServiceReportArgs) => {
  const exportFileName = customFileName || createExportFileName(
    'informe-servicios', 
    appliedFilters.dateRange.from, 
    appliedFilters.dateRange.to
  );
  
  const config = reportColumnConfig || defaultReportColumnConfig;
  const visibleColumns = columnOrder.filter(key => config.columns[key].visible);
  
  // Ordenar servicios por fecha
  const sortedServices = [...services].sort((a, b) => {
    return new Date(a.service_date).getTime() - new Date(b.service_date).getTime();
  });
  
  const totalValue = sortedServices.reduce((acc, service) => {
    return acc + (service.total_price || 0);
  }, 0);

  if (format === 'pdf') {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    let startY = await addCompanyHeader(doc, company, 15, logoUrl);

    // Título
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Informe de Servicios', 14, startY);
    doc.setFont(undefined, 'normal');
    startY += 10;
    
    // Filtros aplicados
    const filterLabels = [
      ['Período', `${formatDate(new Date(appliedFilters.dateRange.from), 'P', { locale: es })} - ${formatDate(new Date(appliedFilters.dateRange.to), 'P', { locale: es })}`],
      ['Cliente', appliedFilters.client || 'Todos']
    ];
    autoTable(doc, { body: filterLabels, startY, theme: 'plain', styles: { fontSize: 9 } });
    let lastY = (doc as any).lastAutoTable.finalY;

    // Resumen
    const summaryData = [
      ['Total Servicios', sortedServices.length.toString()],
      ['Valor Total', `$${totalValue.toLocaleString('es-CL')}`]
    ];
    autoTable(doc, { head: [['Resumen', '']], body: summaryData, startY: lastY + 5, theme: 'grid' });
    lastY = (doc as any).lastAutoTable.finalY;

    // Headers dinámicos
    const headers = visibleColumns.map(key => config.columns[key].label);
    
    // Body dinámico
    const body = sortedServices.map(service => 
      visibleColumns.map(key => getColumnValue(service, key))
    );

    // Calcular anchos proporcionales
    const totalWidth = visibleColumns.reduce((sum, key) => sum + config.columns[key].width, 0);
    const availableWidth = pageWidth - 28;
    
    const columnStyles: Record<number, { cellWidth: number }> = {};
    visibleColumns.forEach((key, index) => {
      const widthPercent = config.columns[key].width / totalWidth;
      columnStyles[index] = { cellWidth: availableWidth * widthPercent };
    });

    autoTable(doc, {
      head: [headers],
      body,
      startY: lastY + 10,
      headStyles: { fillColor: [41, 128, 185], fontSize: 7 },
      styles: { fontSize: 6, cellPadding: 1 },
      tableWidth: availableWidth,
      columnStyles
    });
    
    doc.save(`${exportFileName}.pdf`);

  } else if (format === 'excel') {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Detalle de Servicios
    const services_data = sortedServices.map(s => ({
      'Fecha Servicio': formatDate(new Date(s.service_date), 'yyyy-MM-dd'),
      'Hora Inicio': s.start_time || '-',
      'Hora Término': s.end_time || '-',
      'Folio': s.folio,
      'Cliente': s.client?.name || '-',
      'RUT Cliente': s.client?.tax_id || '-',
      'Asegurado': s.insured_name || '-',
      'Cotización': s.quote_number || '-',
      'Orden de Compra': s.purchase_order || '-',
      'Factura': s.invoice_folio || '-',
      'Tipo de Servicio': s.service_type?.name || '-',
      'Patente Vehículo': s.license_plate || 'N/A',
      'Origen': s.origin_address || 'N/A',
      'Destino': s.destination_address || 'N/A',
      'Estado': getServiceStatusConfig(s.status).label,
      'Valor': s.total_price || 0,
    }));
    const services_ws = XLSX.utils.json_to_sheet(services_data);
    XLSX.utils.book_append_sheet(wb, services_ws, 'Detalle de Servicios');

    // Hoja 2: Resumen
    const summary_ws_data = [
      [company.name],
      ['Informe de Servicios'], [],
      ['Filtros Aplicados'],
      ['Período', `${appliedFilters.dateRange.from} a ${appliedFilters.dateRange.to}`],
      ['Cliente', appliedFilters.client || 'Todos'], [],
      ['Resumen'],
      ['Métrica', 'Valor'],
      ['Total Servicios', sortedServices.length],
      ['Valor Total', totalValue],
    ];
    const summary_ws = XLSX.utils.aoa_to_sheet(summary_ws_data);
    XLSX.utils.book_append_sheet(wb, summary_ws, 'Resumen');

    XLSX.writeFile(wb, `${exportFileName}.xlsx`);
  }
};

// Export para otros tipos de reportes
export const exportGenericReport = async ({
  format,
  data,
  columns,
  company,
  title,
  fileName,
  logoUrl
}: {
  format: 'pdf' | 'excel';
  data: Record<string, any>[];
  columns: { key: string; label: string; width?: number }[];
  company: CompanyInfo;
  title: string;
  fileName: string;
  logoUrl?: string;
}) => {
  if (format === 'pdf') {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    let startY = await addCompanyHeader(doc, company, 15, logoUrl);

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(title, 14, startY);
    doc.setFont(undefined, 'normal');
    startY += 10;

    const headers = columns.map(col => col.label);
    const body = data.map(row => columns.map(col => String(row[col.key] ?? '-')));

    autoTable(doc, {
      head: [headers],
      body,
      startY,
      headStyles: { fillColor: [41, 128, 185], fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2 },
    });

    doc.save(`${fileName}.pdf`);
  } else {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }
};

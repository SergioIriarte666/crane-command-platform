import * as XLSX from 'xlsx';
import { TEMPLATE_HEADERS, SAMPLE_DATA } from '@/types/batchUpload';

export class TemplateGenerator {
  static downloadCSVTemplate(): void {
    const csvContent = TEMPLATE_HEADERS.join(',') + '\n';
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plantilla_servicios_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  static downloadExcelTemplate(): void {
    const wb = XLSX.utils.book_new();
    const wsData = [TEMPLATE_HEADERS, ...SAMPLE_DATA];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths
    ws['!cols'] = [
      { wch: 12 }, // Folio
      { wch: 15 }, // Fecha Solicitud
      { wch: 15 }, // Fecha Servicio
      { wch: 12 }, // Cliente RUT
      { wch: 30 }, // Cliente Nombre
      { wch: 18 }, // Cliente Departamento
      { wch: 15 }, // Vehículo Marca
      { wch: 15 }, // Vehículo Modelo
      { wch: 10 }, // Patente
      { wch: 20 }, // Origen
      { wch: 20 }, // Destino
      { wch: 15 }, // Tipo Servicio
      { wch: 12 }, // Valor
      { wch: 12 }, // Grúa Patente
      { wch: 12 }, // Operador RUT
      { wch: 15 }, // Comisión Operador
      { wch: 35 }, // Observaciones
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Servicios');
    XLSX.writeFile(wb, `plantilla_servicios_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
}

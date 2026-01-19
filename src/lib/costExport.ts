import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { CostWithRelations, COST_STATUS_CONFIG, COST_CATEGORY_CONFIG } from '@/types/costs';
import { ServiceCostLedgerRow } from '@/hooks/useServiceCostsLedger';
import { addCompanyHeader, addPageNumbers, safeDateFormat, safeCurrencyFormat } from '@/lib/pdfUtils';
import { toast } from 'sonner';

export function exportCostsToCSV(costs: CostWithRelations[]): boolean {
  try {
    if (costs.length === 0) {
      return false;
    }

    const headers = [
      'Código',
      'Descripción',
      'Categoría',
      'Cantidad',
      'Valor Unitario',
      'Subtotal',
      'Descuento',
      'Tasa IVA',
      'IVA',
      'Total',
      'Estado',
      'Fecha Costo',
      'Servicio',
      'Grúa',
      'Operador',
      'Proveedor',
      'Notas',
      'Fecha Creación',
    ];

    const rows = costs.map((cost) => [
      cost.code,
      `"${cost.description.replace(/"/g, '""')}"`,
      COST_CATEGORY_CONFIG[cost.category].label,
      cost.quantity,
      cost.unit_value,
      cost.subtotal,
      cost.discount,
      `${cost.tax_rate}%`,
      cost.tax_amount,
      cost.total,
      COST_STATUS_CONFIG[cost.status].label,
      safeDateFormat(cost.cost_date, 'yyyy-MM-dd'),
      cost.service?.folio || '',
      cost.crane?.unit_number || '',
      cost.operator?.full_name || '',
      cost.supplier?.name || '',
      cost.notes ? `"${cost.notes.replace(/"/g, '""')}"` : '',
      safeDateFormat(cost.created_at, 'yyyy-MM-dd HH:mm'),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `costos_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error('Error exporting costs to CSV:', error);
    toast.error('Error al exportar a CSV');
    return false;
  }
}

export function exportServiceCostsToCSV(costs: ServiceCostLedgerRow[], categoriesMap: Record<string, string>): boolean {
  try {
    if (costs.length === 0) {
      return false;
    }

    const headers = [
      'Fecha',
      'Descripción',
      'Categoría',
      'Subcategoría',
      'Monto',
      'Servicio Asociado',
      'Cliente',
      'Notas'
    ];

    const rows = costs.map((cost) => [
      safeDateFormat(cost.cost_date, 'yyyy-MM-dd'),
      `"${cost.description.replace(/"/g, '""')}"`,
      cost.category_id ? (categoriesMap[cost.category_id] || '—') : '—',
      cost.subcategory || '—',
      cost.amount,
      cost.service ? `Servicio ${cost.service.folio}` : '—',
      cost.service?.client?.name || '—',
      cost.notes ? `"${cost.notes.replace(/"/g, '""')}"` : '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `costos_servicios_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error('Error exporting service costs to CSV:', error);
    toast.error('Error al exportar a CSV');
    return false;
  }
}

export function exportServiceCostsToExcel(costs: ServiceCostLedgerRow[], categoriesMap: Record<string, string>): boolean {
  try {
    if (costs.length === 0) {
      return false;
    }

    const data = costs.map((cost) => ({
      'Fecha': safeDateFormat(cost.cost_date, 'yyyy-MM-dd'),
      'Descripción': cost.description,
      'Categoría': cost.category_id ? (categoriesMap[cost.category_id] || '—') : '—',
      'Subcategoría': cost.subcategory || '—',
      'Monto': Number(cost.amount),
      'Servicio Asociado': cost.service ? `Servicio ${cost.service.folio}` : '—',
      'Cliente': cost.service?.client?.name || '—',
      'Notas': cost.notes || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Costos de Servicios");
    XLSX.writeFile(wb, `costos_servicios_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`);
    return true;
  } catch (error) {
    console.error('Error exporting service costs to Excel:', error);
    toast.error('Error al exportar a Excel');
    return false;
  }
}

export function exportServiceCostsToPDF(costs: ServiceCostLedgerRow[], categoriesMap: Record<string, string>): boolean {
  try {
    if (costs.length === 0) {
      return false;
    }

    const doc = new jsPDF();

    const tableColumn = [
      'Fecha',
      'Descripción',
      'Categoría',
      'Subcategoría',
      'Monto',
      'Servicio'
    ];

    const tableRows = costs.map((cost) => [
      safeDateFormat(cost.cost_date, 'yyyy-MM-dd'),
      cost.description,
      cost.category_id ? (categoriesMap[cost.category_id] || '—') : '—',
      cost.subcategory || '—',
      safeCurrencyFormat(cost.amount),
      cost.service ? `${cost.service.folio}` : '—',
    ]);

    const startY = addCompanyHeader(doc, 'Reporte de Costos de Servicios');

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: startY,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { top: 20 },
      didDrawPage: (data) => {
        // Ensure header is redrawn on new pages if needed (handled by autoTable usually, but custom header is once)
        // Actually addCompanyHeader draws on current page.
        // For multi-page, we might want the header on first page only or simplified on others.
        // Current implementation draws header once on the first page passed to it?
        // Wait, `addCompanyHeader` draws on `doc`. `doc` is the PDF.
        // autoTable handles page breaks.
      }
    });

    addPageNumbers(doc);

    doc.save(`costos_servicios_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
    return true;
  } catch (error) {
    console.error('Error exporting service costs to PDF:', error);
    toast.error('Error al generar el PDF');
    return false;
  }
}


export function calculateCostsSummary(costs: CostWithRelations[]) {
  return {
    totalRecords: costs.length,
    totalAmount: costs.reduce((sum, c) => sum + (Number(c.total) || 0), 0),
    byCategory: costs.reduce((acc, c) => {
      if (!acc[c.category]) acc[c.category] = { count: 0, total: 0 };
      acc[c.category].count += 1;
      acc[c.category].total += Number(c.total) || 0;
      return acc;
    }, {} as Record<string, { count: number; total: number }>),
    byStatus: costs.reduce((acc, c) => {
      if (!acc[c.status]) acc[c.status] = { count: 0, total: 0 };
      acc[c.status].count += 1;
      acc[c.status].total += Number(c.total) || 0;
      return acc;
    }, {} as Record<string, { count: number; total: number }>),
  };
}

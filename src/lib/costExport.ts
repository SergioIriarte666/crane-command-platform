import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { CostWithRelations, COST_STATUS_CONFIG, COST_CATEGORY_CONFIG } from '@/types/costs';
import { ServiceCostLedgerRow } from '@/hooks/useServiceCostsLedger';
import { addCompanyHeader, addPageNumbers, safeDateFormat, safeCurrencyFormat } from '@/lib/pdfUtils';
import { toast } from 'sonner';

export function exportCostsToExcel(costs: CostWithRelations[]): boolean {
  try {
    if (costs.length === 0) {
      return false;
    }

    const data = costs.map((cost) => ({
      'Código': cost.code,
      'Descripción': cost.description,
      'Categoría': COST_CATEGORY_CONFIG[cost.category]?.label || cost.category,
      'Cantidad': cost.quantity,
      'Valor Unitario': Number(cost.unit_value),
      'Subtotal': Number(cost.subtotal),
      'Descuento': Number(cost.discount),
      'Tasa IVA': `${cost.tax_rate}%`,
      'IVA': Number(cost.tax_amount),
      'Total': Number(cost.total),
      'Estado': COST_STATUS_CONFIG[cost.status]?.label || cost.status,
      'Fecha Costo': safeDateFormat(cost.cost_date, 'yyyy-MM-dd'),
      'Servicio': cost.service?.folio || '',
      'Grúa': cost.crane?.unit_number || '',
      'Operador': cost.operator?.full_name || '',
      'Proveedor': cost.supplier?.name || '',
      'Notas': cost.notes || '',
      'Fecha Creación': safeDateFormat(cost.created_at, 'yyyy-MM-dd HH:mm'),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Costos Operativos");
    XLSX.writeFile(wb, `costos_operativos_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`);
    return true;
  } catch (error) {
    console.error('Error exporting costs to Excel:', error);
    toast.error('Error al exportar a Excel');
    return false;
  }
}

export async function exportCostsToPDF(costs: CostWithRelations[]): Promise<boolean> {
  try {
    if (costs.length === 0) {
      return false;
    }

    const doc = new jsPDF('l'); // Landscape for more columns

    const tableColumn = [
      'Fecha',
      'Código',
      'Descripción',
      'Categoría',
      'Total',
      'Estado',
      'Servicio/Grúa'
    ];

    const tableRows = costs.map((cost) => [
      safeDateFormat(cost.cost_date, 'yyyy-MM-dd'),
      cost.code,
      cost.description,
      COST_CATEGORY_CONFIG[cost.category]?.label || cost.category,
      safeCurrencyFormat(cost.total),
      COST_STATUS_CONFIG[cost.status]?.label || cost.status,
      [cost.service?.folio, cost.crane?.unit_number].filter(Boolean).join(' / ') || '-'
    ]);

    const startY = await addCompanyHeader(doc, 'Reporte de Costos Operativos');

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: startY,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { top: 20 },
    });

    addPageNumbers(doc);

    doc.save(`costos_operativos_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
    return true;
  } catch (error) {
    console.error('Error exporting costs to PDF:', error);
    toast.error('Error al generar el PDF');
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

export async function exportServiceCostsToPDF(costs: ServiceCostLedgerRow[], categoriesMap: Record<string, string>): Promise<boolean> {
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

    const startY = await addCompanyHeader(doc, 'Reporte de Costos de Servicios');

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

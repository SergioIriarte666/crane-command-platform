import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { INVOICE_STATUS_CONFIG } from '@/types/finance';
import { InvoiceWithRelations } from '@/hooks/useInvoices';
import { differenceInDays } from 'date-fns';
import { addCompanyHeader, addPageNumbers, safeDateFormat, safeCurrencyFormat } from '@/lib/pdfUtils';
import { toast } from 'sonner';

export function exportInvoicesToExcel(invoices: InvoiceWithRelations[]): boolean {
  try {
    if (invoices.length === 0) return false;

    const data = invoices.map((inv) => {
      const daysToMaturity = differenceInDays(new Date(inv.due_date), new Date());
      return {
        'Fecha Generación': safeDateFormat(inv.created_at, 'dd/MM/yyyy'),
        'Nro. Fiscal': inv.fiscal_folio || '—',
        'Cliente': inv.client?.name || '—',
        'Fecha Emisión': safeDateFormat(inv.issue_date, 'dd/MM/yyyy'),
        'Fecha Vencimiento': safeDateFormat(inv.due_date, 'dd/MM/yyyy'),
        'Días a Vencimiento': daysToMaturity,
        'Total': inv.total,
        'Estado': INVOICE_STATUS_CONFIG[inv.status as keyof typeof INVOICE_STATUS_CONFIG]?.label || inv.status,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Facturas');
    XLSX.writeFile(workbook, `facturas_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`);
    return true;
  } catch (error) {
    console.error('Error exporting invoices to Excel:', error);
    toast.error('Error al exportar a Excel');
    return false;
  }
}

export function exportInvoicesToPDF(invoices: InvoiceWithRelations[]): boolean {
  try {
    if (invoices.length === 0) return false;

    const doc = new jsPDF();
    
    const startY = addCompanyHeader(doc, 'Reporte de Facturas');

    const headers = [[
      'Fecha Gen.',
      'Nro. Fiscal',
      'Cliente',
      'Emisión',
      'Vencimiento',
      'Días',
      'Total',
      'Estado'
    ]];

    const data = invoices.map((inv) => {
      const daysToMaturity = differenceInDays(new Date(inv.due_date), new Date());
      return [
        safeDateFormat(inv.created_at, 'dd/MM/yy'),
        inv.fiscal_folio || '—',
        inv.client?.name || '—',
        safeDateFormat(inv.issue_date, 'dd/MM/yy'),
        safeDateFormat(inv.due_date, 'dd/MM/yy'),
        daysToMaturity,
        safeCurrencyFormat(inv.total),
        INVOICE_STATUS_CONFIG[inv.status as keyof typeof INVOICE_STATUS_CONFIG]?.label || inv.status
      ];
    });

    autoTable(doc, {
      head: headers,
      body: data,
      startY: startY,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    addPageNumbers(doc);

    doc.save(`facturas_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
    return true;
  } catch (error) {
    console.error('Error exporting invoices to PDF:', error);
    toast.error('Error al generar el PDF');
    return false;
  }
}

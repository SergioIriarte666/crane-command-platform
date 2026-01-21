import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { INVOICE_STATUS_CONFIG } from '@/types/finance';
import { InvoiceWithRelations } from '@/hooks/useInvoices';
import { differenceInDays } from 'date-fns';
import { addCompanyHeader, addInvoiceHeader, addPageNumbers, safeDateFormat, safeCurrencyFormat, CompanyInfo, FALLBACK_COMPANY_INFO } from '@/lib/pdfUtils';
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

export async function exportInvoicesToPDF(invoices: InvoiceWithRelations[], companyInfo: CompanyInfo = FALLBACK_COMPANY_INFO): Promise<boolean> {
  try {
    if (invoices.length === 0) return false;

    const doc = new jsPDF();
    
    const startY = await addCompanyHeader(doc, 'Reporte de Facturas', companyInfo);

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

    addPageNumbers(doc, companyInfo);

    doc.save(`facturas_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
    return true;
  } catch (error) {
    console.error('Error exporting invoices to PDF:', error);
    toast.error('Error al generar el PDF');
    return false;
  }
}

export async function exportInvoiceDetailToPDF(
  invoice: InvoiceWithRelations,
  services: any[],
  companyInfo: CompanyInfo = FALLBACK_COMPANY_INFO
): Promise<boolean> {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // 1. HEADER & LOGO (Left side)
    // Use new invoice-specific header (Logo & Company on LEFT)
    const headerEndY = await addInvoiceHeader(doc, companyInfo);

    // 2. INVOICE INFO BOX (Right aligned)
    const boxWidth = 70;
    const boxHeight = 35;
    const boxX = pageWidth - boxWidth - 14; // 14mm margin
    const boxY = 15;
    
    // Background for box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(252, 252, 252);
    doc.rect(boxX, boxY, boxWidth, boxHeight, 'FD');
    
    // Box Content
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`FACTURA N° ${invoice.folio}`, boxX + (boxWidth / 2), boxY + 10, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    if (invoice.fiscal_folio) {
      doc.text(`Folio Fiscal: ${invoice.fiscal_folio}`, boxX + (boxWidth / 2), boxY + 18, { align: 'center' });
    }
    
    // Status Badge
    const statusLabel = INVOICE_STATUS_CONFIG[invoice.status as keyof typeof INVOICE_STATUS_CONFIG]?.label || invoice.status;
    
    // Draw status badge background
    const badgeWidth = 30;
    const badgeHeight = 6;
    const badgeX = boxX + (boxWidth - badgeWidth) / 2;
    const badgeY = boxY + 23;
    
    doc.setFillColor(240, 240, 240);
    if (invoice.status === 'paid') doc.setFillColor(220, 252, 231); // Green-ish
    if (invoice.status === 'pending') doc.setFillColor(254, 249, 195); // Yellow-ish
    if (invoice.status === 'overdue') doc.setFillColor(254, 226, 226); // Red-ish
    
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1, 1, 'F');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    doc.text(statusLabel.toUpperCase(), boxX + (boxWidth / 2), badgeY + 4.2, { align: 'center' });

    // Determine start Y for the next section (max of header or box + margin)
    // Ensure we have enough space below the header info
    const separatorY = Math.max(headerEndY, 60);

    // 3. SEPARATOR LINE
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.line(14, separatorY, pageWidth - 14, separatorY);

    // 4. CLIENT & DETAILS SECTIONS (Two Columns)
    const col1X = 14;
    const col2X = pageWidth / 2 + 10;
    const sectionY = separatorY + 8;
    const lineHeight = 6;

    // -- Column 1: Client --
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN DEL CLIENTE', col1X, sectionY);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    
    doc.text('Razón Social:', col1X, sectionY + 8);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.client?.name || '—', col1X + 25, sectionY + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.text('RUT/ID:', col1X, sectionY + 8 + lineHeight);
    doc.text(invoice.client?.tax_id || '—', col1X + 25, sectionY + 8 + lineHeight);
    
    doc.text('Código:', col1X, sectionY + 8 + lineHeight * 2);
    doc.text(invoice.client?.code || '—', col1X + 25, sectionY + 8 + lineHeight * 2);

    // -- Column 2: Invoice Details --
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLES DE LA FACTURA', col2X, sectionY);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    
    doc.text('Fecha Emisión:', col2X, sectionY + 8);
    doc.text(safeDateFormat(invoice.issue_date), col2X + 35, sectionY + 8);
    
    doc.text('Fecha Vencimiento:', col2X, sectionY + 8 + lineHeight);
    doc.text(safeDateFormat(invoice.due_date), col2X + 35, sectionY + 8 + lineHeight);

    // Payment Date
    const paymentDate = (invoice as any).payment_date;
    if (paymentDate) {
      doc.text('Fecha Pago:', col2X, sectionY + 8 + lineHeight * 2);
      doc.setTextColor(39, 174, 96); // Green
      doc.setFont('helvetica', 'bold');
      doc.text(safeDateFormat(paymentDate), col2X + 35, sectionY + 8 + lineHeight * 2);
      doc.setTextColor(50, 50, 50); // Reset
      doc.setFont('helvetica', 'normal');
    }

    if (invoice.billing_closure) {
      const yPos = paymentDate ? sectionY + 8 + lineHeight * 3 : sectionY + 8 + lineHeight * 2;
      doc.text('Cierre Origen:', col2X, yPos);
      doc.text(invoice.billing_closure.folio, col2X + 35, yPos);
    }

    // 5. SERVICES TABLE
    const tableStartY = sectionY + 35;
    
    const tableHeaders = [[
      'FECHA',
      'FOLIO',
      'DESCRIPCIÓN / VEHÍCULO',
      'TOTAL'
    ]];

    const tableData = services.map(srv => [
      safeDateFormat(srv.service_date),
      srv.service_folio || '—',
      `${srv.service_type || 'Servicio'}\n${srv.vehicle_info || srv.vehicle_patent || ''}`,
      safeCurrencyFormat(srv.total || srv.total_amount || 0)
    ]);

    autoTable(doc, {
      head: tableHeaders,
      body: tableData,
      startY: tableStartY,
      theme: 'plain', // Cleaner look
      headStyles: { 
        fillColor: [248, 249, 250], 
        textColor: [80, 80, 80],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left',
        cellPadding: 3
      },
      styles: { 
        fontSize: 8,
        cellPadding: 4,
        valign: 'middle',
        lineColor: [230, 230, 230],
        lineWidth: { bottom: 0.1 }
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Fecha
        1: { cellWidth: 25 }, // Folio
        2: { cellWidth: 'auto' }, // Desc
        3: { halign: 'right', fontStyle: 'bold', cellWidth: 30 } // Total
      },
      didDrawPage: (data) => {
        // Optional: Header on new pages if needed
      }
    });

    // 6. TOTALS SECTION
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const totalsWidth = 70;
    const totalsX = pageWidth - totalsWidth - 14;
    
    // Calculations
    const total = Number(invoice.total || 0);
    const subtotal = total / 1.19;
    const iva = total - subtotal;
    const balanceDue = Number(invoice.balance_due || 0);

    // Right align helper
    const drawTotalRow = (label: string, value: string, y: number, isBold = false, color: [number, number, number] = [0, 0, 0]) => {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(isBold ? 10 : 9);
      doc.setTextColor(color[0], color[1], color[2]);
      
      doc.text(label, totalsX, y);
      doc.text(value, pageWidth - 14, y, { align: 'right' });
    };

    drawTotalRow('Subtotal Neto:', safeCurrencyFormat(subtotal), finalY);
    drawTotalRow('IVA (19%):', safeCurrencyFormat(iva), finalY + 6);
    
    // Total Line
    doc.setDrawColor(200, 200, 200);
    doc.line(totalsX, finalY + 10, pageWidth - 14, finalY + 10);
    
    drawTotalRow('TOTAL:', safeCurrencyFormat(total), finalY + 16, true);
    
    if (balanceDue > 0) {
      drawTotalRow('Saldo Pendiente:', safeCurrencyFormat(balanceDue), finalY + 24, true, [220, 38, 38]);
    }

    // 7. FOOTER
    addPageNumbers(doc, companyInfo);

    doc.save(`factura_${invoice.folio}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating invoice detail PDF:', error);
    toast.error('Error al generar el PDF de la factura');
    return false;
  }
}

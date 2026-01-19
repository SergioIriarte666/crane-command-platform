import jsPDF from 'jspdf';
import { format, isValid } from 'date-fns';

export const COMPANY_INFO = {
  name: 'Crane Command Platform',
  address: 'Dirección de la Empresa, 123',
  city: 'Santiago, Chile',
  phone: '+56 9 1234 5678',
  email: 'contacto@cranecommand.cl',
  website: 'www.cranecommand.cl',
};

/**
 * Safely formats a date string or object
 */
export function safeDateFormat(date: string | Date | null | undefined, formatStr: string = 'dd/MM/yyyy'): string {
  if (!date) return '—';
  const d = new Date(date);
  return isValid(d) ? format(d, formatStr) : '—';
}

/**
 * Safely formats a currency amount
 */
export function safeCurrencyFormat(amount: number | string | null | undefined): string {
  const num = Number(amount);
  if (isNaN(num)) return '$0';
  return `$${num.toLocaleString('es-CL')}`;
}

/**
 * Adds a standardized header with company logo and details to a jsPDF document.
 * @param doc The jsPDF instance
 * @param title The title of the report
 */
export function addCompanyHeader(doc: jsPDF, title: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor = [41, 128, 185] as [number, number, number]; // Blue #2980b9
  const secondaryColor = [52, 73, 94] as [number, number, number]; // Dark Blue/Grey #34495e

  // 1. Draw Logo (Vectorial Fallback)
  // Simple stylized "Crane" icon representation
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  
  // Crane base
  doc.rect(14, 15, 12, 12, 'F');
  
  // Crane arm (diagonal)
  doc.setLineWidth(2);
  doc.line(20, 15, 30, 8);
  
  // Crane hook line
  doc.line(30, 8, 30, 12);
  
  // Hook
  doc.circle(30, 13, 1, 'S');

  // 2. Company Info (Right aligned)
  doc.setFontSize(14);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_INFO.name, pageWidth - 14, 15, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(COMPANY_INFO.address, pageWidth - 14, 20, { align: 'right' });
  doc.text(COMPANY_INFO.city, pageWidth - 14, 24, { align: 'right' });
  doc.text(`${COMPANY_INFO.phone} | ${COMPANY_INFO.email}`, pageWidth - 14, 28, { align: 'right' });

  // 3. Report Title (Left aligned, below logo)
  doc.setFontSize(18);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 40);

  // 4. Generation Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 46);

  // 5. Divider Line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, 50, pageWidth - 14, 50);

  // Return the Y position where content should start
  return 55;
}

/**
 * Adds footer with page numbers
 * @param doc jsPDF instance
 */
export function addPageNumbers(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount} - ${COMPANY_INFO.name}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
}

import jsPDF from 'jspdf';
import { format, isValid } from 'date-fns';

export interface CompanyInfo {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  tax_id?: string | null;
  primary_color?: string | null;
}

export const FALLBACK_COMPANY_INFO: CompanyInfo = {
  name: 'Crane Command Platform',
  address: 'Dirección no configurada',
  phone: '',
  email: '',
};

/**
 * Maps a Tenant object from the database to CompanyInfo for PDFs
 */
export function mapTenantToCompanyInfo(tenant: any): CompanyInfo {
  if (!tenant) return FALLBACK_COMPANY_INFO;
  return {
    name: tenant.name,
    address: tenant.address,
    phone: tenant.phone,
    email: tenant.email,
    logo_url: tenant.logo_url,
    tax_id: tenant.tax_id,
    primary_color: tenant.primary_color,
  };
}


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
 * Loads an image from a URL and returns a Promise that resolves to the image element
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Draws the fallback vector logo
 */
function drawFallbackLogo(doc: jsPDF, color: [number, number, number]) {
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setFillColor(color[0], color[1], color[2]);
  
  // Crane base
  doc.rect(14, 15, 12, 12, 'F');
  
  // Crane arm (diagonal)
  doc.setLineWidth(2);
  doc.line(20, 15, 30, 8);
  
  // Crane hook line
  doc.line(30, 8, 30, 12);
  
  // Hook
  doc.circle(30, 13, 1, 'S');
}

/**
 * Adds a standardized header with company logo and details to a jsPDF document.
 * @param doc The jsPDF instance
 * @param title The title of the report
 * @param companyInfo Optional company configuration
 */
export async function addCompanyHeader(doc: jsPDF, title: string, companyInfo: CompanyInfo = FALLBACK_COMPANY_INFO) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Parse primary color from hex if available, otherwise use default blue
  let primaryColor = [41, 128, 185] as [number, number, number]; // Default Blue #2980b9
  if (companyInfo.primary_color && /^#[0-9A-F]{6}$/i.test(companyInfo.primary_color)) {
    const hex = companyInfo.primary_color;
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    primaryColor = [r, g, b];
  }

  const secondaryColor = [52, 73, 94] as [number, number, number]; // Dark Blue/Grey #34495e

  // 1. Draw Logo
  if (companyInfo.logo_url) {
    try {
      const img = await loadImage(companyInfo.logo_url);
      // Maintain aspect ratio, max width 25, max height 25
      const maxW = 25;
      const maxH = 25;
      let w = img.width;
      let h = img.height;
      
      const ratio = Math.min(maxW / w, maxH / h);
      w = w * ratio;
      h = h * ratio;
      
      doc.addImage(img, 'PNG', 14, 15, w, h);
    } catch (error) {
      console.warn('Failed to load company logo, using fallback', error);
      drawFallbackLogo(doc, primaryColor);
    }
  } else {
    drawFallbackLogo(doc, primaryColor);
  }

  // 2. Company Info (Right aligned)
  doc.setFontSize(14);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(companyInfo.name, pageWidth - 14, 15, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  
  let yPos = 20;
  if (companyInfo.address) {
    doc.text(companyInfo.address, pageWidth - 14, yPos, { align: 'right' });
    yPos += 4;
  }
  
  if (companyInfo.tax_id) {
    doc.text(`RUT/Tax ID: ${companyInfo.tax_id}`, pageWidth - 14, yPos, { align: 'right' });
    yPos += 4;
  }
  
  const contactParts = [];
  if (companyInfo.phone) contactParts.push(companyInfo.phone);
  if (companyInfo.email) contactParts.push(companyInfo.email);
  
  if (contactParts.length > 0) {
    doc.text(contactParts.join(' | '), pageWidth - 14, yPos, { align: 'right' });
  }

  // 3. Report Title (Left aligned, below logo area)
  doc.setFontSize(18);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]); // Use primary color for title
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 45);

  // 4. Generation Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 51);

  // 5. Divider Line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, 55, pageWidth - 14, 55);

  // Return the Y position where content should start
  return 60;
}

/**
 * Adds a header specifically for Invoices (Logo & Company Info on LEFT)
 * Leaving the right side free for the Invoice Details Box
 */
export async function addInvoiceHeader(doc: jsPDF, companyInfo: CompanyInfo = FALLBACK_COMPANY_INFO) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Parse primary color
  let primaryColor = [41, 128, 185] as [number, number, number];
  if (companyInfo.primary_color && /^#[0-9A-F]{6}$/i.test(companyInfo.primary_color)) {
    const hex = companyInfo.primary_color;
    const r = parseInt(hex.substring(1, 3), 16);
    const g = parseInt(hex.substring(3, 5), 16);
    const b = parseInt(hex.substring(5, 7), 16);
    primaryColor = [r, g, b];
  }

  const secondaryColor = [52, 73, 94] as [number, number, number];

  // 1. Draw Logo (Top Left)
  const logoY = 15;
  const logoX = 14;
  
  if (companyInfo.logo_url) {
    try {
      const img = await loadImage(companyInfo.logo_url);
      const maxW = 25;
      const maxH = 25;
      let w = img.width;
      let h = img.height;
      const ratio = Math.min(maxW / w, maxH / h);
      w = w * ratio;
      h = h * ratio;
      doc.addImage(img, 'PNG', logoX, logoY, w, h);
    } catch (error) {
      drawFallbackLogo(doc, primaryColor);
    }
  } else {
    drawFallbackLogo(doc, primaryColor);
  }

  // 2. Company Info (Left aligned, below logo or next to it?)
  // Let's put it below the logo area to be safe and clean
  let textY = logoY + 30; 

  doc.setFontSize(12);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(companyInfo.name, logoX, textY);
  textY += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  
  if (companyInfo.address) {
    doc.text(companyInfo.address, logoX, textY);
    textY += 4;
  }
  
  if (companyInfo.tax_id) {
    doc.text(`RUT: ${companyInfo.tax_id}`, logoX, textY);
    textY += 4;
  }
  
  const contactParts = [];
  if (companyInfo.phone) contactParts.push(companyInfo.phone);
  if (companyInfo.email) contactParts.push(companyInfo.email);
  
  if (contactParts.length > 0) {
    doc.text(contactParts.join(' | '), logoX, textY);
    textY += 4;
  }

  // Return the Y position where content should start (max of this or the box on the right)
  return textY + 10;
}

/**
 * Adds footer with page numbers
 * @param doc jsPDF instance
 * @param companyInfo Optional company configuration
 */
export function addPageNumbers(doc: jsPDF, companyInfo: CompanyInfo = FALLBACK_COMPANY_INFO) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount} - ${companyInfo.name}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
}

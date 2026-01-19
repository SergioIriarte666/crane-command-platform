// src/utils/reports/reportUtils.ts

import type { Tables } from '@/integrations/supabase/types';

type Tenant = Tables<'tenants'>;

export interface CompanyInfo {
  name: string;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logo?: string | null;
}

export const createExportFileName = (prefix: string, dateFrom: string, dateTo: string): string => {
  return `${prefix}-${dateFrom}-a-${dateTo}`;
};

export const tenantToCompanyInfo = (tenant: Tenant | null | undefined): CompanyInfo => {
  if (!tenant) {
    return {
      name: 'Mi Empresa',
      taxId: null,
      address: null,
      phone: null,
      email: null,
      logo: null
    };
  }
  
  return {
    name: tenant.name,
    taxId: tenant.tax_id,
    address: tenant.address,
    phone: tenant.phone,
    email: tenant.email,
    logo: tenant.logo_url
  };
};

export const addCompanyHeader = async (
  doc: any, 
  company: CompanyInfo, 
  startY: number, 
  logoUrl?: string
): Promise<number> => {
  const pageWidth = doc.internal.pageSize.width;
  let yPosition = startY;

  // Logo de la empresa (desde DB o fallback)
  try {
    const finalLogoUrl = logoUrl || company.logo;
    
    if (finalLogoUrl) {
      console.log('📄 [REPORT-HEADER] Usando logo:', finalLogoUrl);
      
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = finalLogoUrl;
      
      await new Promise((resolve) => {
        img.onload = () => {
          const logoWidth = 35;
          const logoHeight = (img.height * logoWidth) / img.width;
          doc.addImage(img, 'PNG', pageWidth - 14 - logoWidth, yPosition, logoWidth, logoHeight);
          resolve(true);
        };
        img.onerror = () => {
          console.warn("Error loading logo for PDF, continuing without logo");
          resolve(true); // Continue without logo
        };
      });
    }
  } catch (e) {
    console.warn("Could not add logo to PDF, using text fallback.", e);
  }
  
  // Información de la empresa
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(company.name || 'Mi Empresa', 14, yPosition + 7);
  doc.setFont(undefined, 'normal');

  doc.setFontSize(9);
  doc.setTextColor(100);
  
  if (company.taxId) {
    doc.text(`RUT: ${company.taxId}`, 14, yPosition + 14);
  }
  
  let nextLineY = yPosition + (company.taxId ? 19 : 14);
  
  if (company.address) {
    doc.text(company.address, 14, nextLineY);
    nextLineY += 5;
  }
  
  if (company.phone || company.email) {
    const contactInfo = [];
    if (company.phone) contactInfo.push(`Tel: ${company.phone}`);
    if (company.email) contactInfo.push(`Email: ${company.email}`);
    doc.text(contactInfo.join(' | '), 14, nextLineY);
    nextLineY += 5;
  }
  
  // Reset text color
  doc.setTextColor(0);
  
  return nextLineY + 10;
};

export const truncate = (str: string, maxLength: number): string => {
  if (!str) return '-';
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
};

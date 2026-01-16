import { describe, it, expect, vi } from 'vitest';
import { addCompanyHeader, addPageNumbers, safeDateFormat, safeCurrencyFormat, COMPANY_INFO } from './pdfUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Mock jspdf if necessary, but running with real jspdf in jsdom is better to catch runtime errors
// However, jsPDF might not work fully in jsdom without canvas support.
// We'll try to use it and see.

describe('PDF Generation Utils', () => {
  it('should create a PDF and add company header without errors', () => {
    const doc = new jsPDF();
    const startY = addCompanyHeader(doc, 'Test Report');
    
    expect(startY).toBeGreaterThan(0);
    expect(startY).toBe(55); // Based on implementation
  });

  it('should add page numbers', () => {
    const doc = new jsPDF();
    // Add some pages
    doc.addPage();
    doc.addPage();
    
    expect(doc.getNumberOfPages()).toBe(3);
    
    // Should not throw
    expect(() => addPageNumbers(doc)).not.toThrow();
  });

  it('should contain company info', () => {
    expect(COMPANY_INFO.name).toBeDefined();
    expect(COMPANY_INFO.address).toBeDefined();
  });

  it('should work with autoTable', () => {
    const doc = new jsPDF();
    
    expect(() => {
      autoTable(doc, {
        head: [['Col1', 'Col2']],
        body: [['Data1', 'Data2']],
        startY: 60
      });
    }).not.toThrow();
  });

  it('should safely format dates', () => {
    expect(safeDateFormat(null)).toBe('—');
    expect(safeDateFormat(undefined)).toBe('—');
    // Use local time construction to avoid timezone shifts in tests
    const date = new Date(2023, 0, 1); // Jan 1, 2023 Local Time
    expect(safeDateFormat(date)).toBe('01/01/2023');
    
    // For string input, we must be careful. 
    // If we pass '2023-01-01T00:00:00', it is local.
    expect(safeDateFormat('2023-01-01T00:00:00')).toBe('01/01/2023');
    
    // Invalid date
    expect(safeDateFormat('invalid-date')).toBe('—');
  });

  it('should safely format currency', () => {
    expect(safeCurrencyFormat(1000)).toBe('$1.000');
    expect(safeCurrencyFormat(0)).toBe('$0');
    expect(safeCurrencyFormat(null)).toBe('$0');
    expect(safeCurrencyFormat(undefined)).toBe('$0');
    expect(safeCurrencyFormat('1000')).toBe('$1.000');
    expect(safeCurrencyFormat('invalid')).toBe('$0');
  });
});

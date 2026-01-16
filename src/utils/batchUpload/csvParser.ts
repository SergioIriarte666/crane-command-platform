import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { UploadProgress } from '@/types/batchUpload';

export class CSVParser {
  async parseFile(
    file: File, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Record<string, unknown>[]> {
    if (onProgress) {
      onProgress({ 
        total: 100, 
        processed: 0, 
        percentage: 0, 
        currentBatch: 1, 
        totalBatches: 1, 
        stage: 'parsing' 
      });
    }

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      return this.parseExcelFile(file, onProgress);
    } else {
      return this.parseCSVFile(file, onProgress);
    }
  }

  private parseCSVFile(
    file: File, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Record<string, unknown>[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
        complete: (results) => {
          if (onProgress) {
            onProgress({ 
              total: 100, 
              processed: 100, 
              percentage: 100, 
              currentBatch: 1, 
              totalBatches: 1, 
              stage: 'parsing' 
            });
          }
          
          if (results.errors.length > 0) {
            const criticalErrors = results.errors.filter(e => e.type === 'Delimiter');
            if (criticalErrors.length > 0) {
              reject(new Error(`Error parsing CSV: ${criticalErrors[0].message}`));
              return;
            }
          }
          
          resolve(results.data as Record<string, unknown>[]);
        },
        error: (error) => reject(new Error(`Error reading CSV: ${error.message}`))
      });
    });
  }

  private parseExcelFile(
    file: File, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Record<string, unknown>[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1, 
            defval: '', 
            raw: false, 
            dateNF: 'yyyy-mm-dd'
          }) as unknown[][];
          
          if (jsonData.length < 2) {
            resolve([]);
            return;
          }

          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1);

          const processedData = rows
            .filter(row => (row as unknown[]).some(cell => cell !== ''))
            .map((row) => {
              const rowObject: Record<string, unknown> = {};
              headers.forEach((header, index) => {
                let value = (row as unknown[])[index];
                
                // Handle date conversion
                if (typeof value === 'string' && value.includes('/')) {
                  const date = new Date(value);
                  if (!isNaN(date.getTime())) {
                    value = date.toISOString().split('T')[0];
                  }
                }
                
                rowObject[header.trim()] = value || '';
              });
              return rowObject;
            });

          if (onProgress) {
            onProgress({ 
              total: 100, 
              processed: 100, 
              percentage: 100, 
              currentBatch: 1, 
              totalBatches: 1, 
              stage: 'parsing' 
            });
          }

          resolve(processedData);
        } catch (error) {
          reject(new Error(`Error processing Excel: ${error instanceof Error ? error.message : 'Unknown'}`));
        }
      };
      
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsArrayBuffer(file);
    });
  }
}

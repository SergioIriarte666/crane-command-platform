import { HEADER_MAP, REQUIRED_FIELDS, HeaderMappingResult } from '@/types/batchUpload';

export class HeaderMapper {
  mapHeaders(headers: string[]): string[] {
    return headers.map(header => {
      const trimmed = header.trim();
      const mapped = HEADER_MAP[trimmed];
      
      if (mapped) return mapped;
      
      // Fallback: convert to camelCase
      return trimmed.toLowerCase().replace(/\s+/g, '');
    });
  }

  validateHeaders(headers: string[]): HeaderMappingResult {
    const mappedHeaders = this.mapHeaders(headers);
    const missing = REQUIRED_FIELDS.filter(req => !mappedHeaders.includes(req));
    const extra = mappedHeaders.filter(h => !REQUIRED_FIELDS.includes(h) && h !== 'observations' && h !== 'clientDepartment');

    return { 
      valid: missing.length === 0, 
      missing, 
      extra 
    };
  }
}

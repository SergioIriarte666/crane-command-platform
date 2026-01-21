import { useState, useMemo, useCallback } from 'react';
import type { AdvancedFilters, VipService } from '@/types/vipPipeline';

export function useAdvancedFilters() {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<AdvancedFilters>({});

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(v => v !== undefined && v !== '');
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(v => v !== undefined && v !== '').length;
  }, [filters]);

  const applyAdvancedFilters = useCallback((
    services: VipService[],
    basicFilters: { searchTerm: string; statusFilter: string }
  ): VipService[] => {
    let filtered = services;

    // Basic search filter
    if (basicFilters.searchTerm) {
      const term = basicFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.folio.toLowerCase().includes(term) ||
        s.type?.toLowerCase().includes(term) ||
        s.quote_number?.toLowerCase().includes(term) ||
        s.purchase_order_number?.toLowerCase().includes(term) ||
        s.vehicle_plates?.toLowerCase().includes(term) ||
        s.vehicle_brand?.toLowerCase().includes(term) ||
        s.vehicle_model?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (basicFilters.statusFilter && basicFilters.statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === basicFilters.statusFilter);
    }

    // Advanced filters
    if (filters.serviceTypeId) {
      filtered = filtered.filter(s => s.type === filters.serviceTypeId);
    }

    if (filters.licensePlate) {
      const plate = filters.licensePlate.toLowerCase();
      filtered = filtered.filter(s => 
        s.vehicle_plates?.toLowerCase().includes(plate)
      );
    }

    if (filters.quoteNumber) {
      const quote = filters.quoteNumber.toLowerCase();
      filtered = filtered.filter(s => 
        s.quote_number?.toLowerCase().includes(quote)
      );
    }

    if (filters.purchaseOrderNumber) {
      const po = filters.purchaseOrderNumber.toLowerCase();
      filtered = filtered.filter(s => 
        s.purchase_order_number?.toLowerCase().includes(po)
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(s => {
        const serviceDate = s.service_date || s.scheduled_date;
        return serviceDate && serviceDate >= filters.dateFrom!;
      });
    }

    if (filters.dateTo) {
      filtered = filtered.filter(s => {
        const serviceDate = s.service_date || s.scheduled_date;
        return serviceDate && serviceDate <= filters.dateTo!;
      });
    }

    return filtered;
  }, [filters]);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const updateFilters = useCallback((newFilters: Partial<AdvancedFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    isOpen,
    setIsOpen,
    filters,
    hasActiveFilters,
    activeFilterCount,
    applyAdvancedFilters,
    clearFilters,
    updateFilters,
  };
}

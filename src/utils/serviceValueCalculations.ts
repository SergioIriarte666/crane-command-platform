import { Service } from '@/types/services';

/**
 * Calculate base service value (subtotal without custody)
 */
export function getBaseServiceValue(service: Service): number {
  return service.subtotal || 0;
}

/**
 * Calculate custody total amount from surcharges if applicable
 */
export function getCustodyTotalAmount(service: Service): number {
  // Custody info may be stored in surcharges JSON
  if (!service.surcharges) return 0;
  const surcharges = service.surcharges as { custody_days?: number; custody_daily_rate?: number };
  if (!surcharges.custody_days || !surcharges.custody_daily_rate) return 0;
  return surcharges.custody_days * surcharges.custody_daily_rate;
}

/**
 * Get complete service value (base + custody)
 */
export function getCompleteServiceValue(service: Service): number {
  return getBaseServiceValue(service) + getCustodyTotalAmount(service);
}

/**
 * Get service value for closure/billing calculations
 */
export function getServiceValueForClosure(service: Service): number {
  return service.total || getCompleteServiceValue(service);
}

/**
 * Detect if this is a custody service (has custody surcharge)
 */
export function isCustodyService(service: Service): boolean {
  if (!service.surcharges) return false;
  const surcharges = service.surcharges as { custody_days?: number };
  return (surcharges.custody_days || 0) > 0;
}

/**
 * Detect if this is equipment rental (arriendo)
 */
export function isEquipmentRentalService(service: Service): boolean {
  return service.type === 'maniobra' || (service.notes?.toLowerCase().includes('arriendo') ?? false);
}

/**
 * Format duration from minutes to human readable string
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

/**
 * Calculate profit margin
 */
export function calculateMargin(
  subtotal: number,
  totalCommissions: number,
  totalCosts: number
): { netMargin: number; marginPercentage: number } {
  const netMargin = subtotal - totalCommissions - totalCosts;
  const marginPercentage = subtotal > 0 ? (netMargin / subtotal) * 100 : 0;
  return { netMargin, marginPercentage };
}

/**
 * Get custody info from service surcharges
 */
export function getCustodyInfo(service: Service): { days: number; dailyRate: number; total: number } | null {
  if (!service.surcharges) return null;
  const surcharges = service.surcharges as { custody_days?: number; custody_daily_rate?: number };
  if (!surcharges.custody_days) return null;
  const days = surcharges.custody_days;
  const dailyRate = surcharges.custody_daily_rate || 0;
  return {
    days,
    dailyRate,
    total: days * dailyRate,
  };
}

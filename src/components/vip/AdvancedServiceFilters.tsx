import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, ChevronUp, Filter, X, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { AdvancedFilters } from '@/types/vipPipeline';

interface AdvancedServiceFiltersProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filters: AdvancedFilters;
  onFilterChange: (filters: Partial<AdvancedFilters>) => void;
  onClear: () => void;
  activeFilterCount: number;
}

export function AdvancedServiceFilters({
  isOpen,
  onOpenChange,
  filters,
  onFilterChange,
  onClear,
  activeFilterCount,
}: AdvancedServiceFiltersProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          Filtros Avanzados
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {activeFilterCount}
            </Badge>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-4">
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Filtros Avanzados</CardTitle>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={onClear} className="h-7 text-xs">
                  <X className="w-3 h-3 mr-1" />
                  Limpiar Filtros
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* License Plate */}
              <div className="space-y-2">
                <Label className="text-xs">Patente</Label>
                <Input
                  placeholder="ABC-123"
                  value={filters.licensePlate || ''}
                  onChange={(e) => onFilterChange({ licensePlate: e.target.value || undefined })}
                  className="h-8 text-sm"
                />
              </div>

              {/* Quote Number */}
              <div className="space-y-2">
                <Label className="text-xs">N° Cotización</Label>
                <Input
                  placeholder="COT-001"
                  value={filters.quoteNumber || ''}
                  onChange={(e) => onFilterChange({ quoteNumber: e.target.value || undefined })}
                  className="h-8 text-sm"
                />
              </div>

              {/* Purchase Order */}
              <div className="space-y-2">
                <Label className="text-xs">N° Orden de Compra</Label>
                <Input
                  placeholder="OC-001"
                  value={filters.purchaseOrderNumber || ''}
                  onChange={(e) => onFilterChange({ purchaseOrderNumber: e.target.value || undefined })}
                  className="h-8 text-sm"
                />
              </div>

              {/* Numero Fiscal */}
              <div className="space-y-2">
                <Label className="text-xs">N° Fiscal</Label>
                <Input
                  placeholder="12345"
                  value={filters.numeroFiscal || ''}
                  onChange={(e) => onFilterChange({ numeroFiscal: e.target.value || undefined })}
                  className="h-8 text-sm"
                />
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <Label className="text-xs">Desde</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        'w-full h-8 justify-start text-left font-normal',
                        !filters.dateFrom && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {filters.dateFrom 
                        ? format(new Date(filters.dateFrom), 'dd/MM/yy', { locale: es })
                        : 'Fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                      onSelect={(date) => 
                        onFilterChange({ dateFrom: date?.toISOString().split('T')[0] })
                      }
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <Label className="text-xs">Hasta</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        'w-full h-8 justify-start text-left font-normal',
                        !filters.dateTo && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {filters.dateTo 
                        ? format(new Date(filters.dateTo), 'dd/MM/yy', { locale: es })
                        : 'Fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo ? new Date(filters.dateTo) : undefined}
                      onSelect={(date) => 
                        onFilterChange({ dateTo: date?.toISOString().split('T')[0] })
                      }
                      locale={es}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}

import { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CalendarRange,
  Loader2,
  FileSearch
} from 'lucide-react';
import { formatCurrency } from '@/types/finance';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  folio: string;
  scheduled_date?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_plates?: string;
  total?: number;
  subtotal?: number;
  client?: { id: string; name: string } | null;
  status?: string;
}

interface ProcessedServiceInfo {
  serviceId: string;
  serviceFolio: string;
  purchaseOrder: string | null;
  clientName: string;
  closureFolio: string;
  invoiceFolio: string | null;
}

interface EnhancedServicesSelectorProps {
  services: Service[];
  pendingServices: Service[];
  loading: boolean;
  clientId: string;
  selectedServiceIds: string[];
  onServiceToggle: (serviceId: string, checked: boolean) => void;
  onCompleteService: (serviceId: string) => Promise<void>;
  onCompleteMultipleServices: (serviceIds: string[]) => Promise<void>;
  totalCompleted: number;
  usedServiceIds: Set<string>;
  isGlobalSearch: boolean;
  onAutoFillDates: (dateFrom: Date, dateTo: Date) => void;
  processedServices: ProcessedServiceInfo[];
  searchingProcessed: boolean;
  onSearchProcessed: (term: string) => void;
  onClearProcessed: () => void;
}

const EnhancedServicesSelector = ({
  services,
  pendingServices,
  loading,
  clientId,
  selectedServiceIds,
  onServiceToggle,
  onCompleteService,
  onCompleteMultipleServices,
  usedServiceIds,
  isGlobalSearch,
  onAutoFillDates,
  processedServices,
  searchingProcessed,
  onSearchProcessed,
  onClearProcessed,
}: EnhancedServicesSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([]);

  // Filtrar servicios por cliente y búsqueda
  const filteredServices = useMemo(() => {
    let result = services.filter(s => !usedServiceIds.has(s.id));
    
    if (clientId) {
      result = result.filter(s => s.client?.id === clientId);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.folio?.toLowerCase().includes(term) ||
        s.vehicle_plates?.toLowerCase().includes(term) ||
        s.client?.name?.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [services, clientId, searchTerm, usedServiceIds]);

  // Filtrar servicios pendientes
  const filteredPendingServices = useMemo(() => {
    let result = pendingServices;
    
    if (clientId) {
      result = result.filter(s => s.client?.id === clientId);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.folio?.toLowerCase().includes(term) ||
        s.vehicle_plates?.toLowerCase().includes(term) ||
        s.client?.name?.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [pendingServices, clientId, searchTerm]);

  // Manejar búsqueda con debounce para servicios procesados
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    if (value.length >= 3) {
      const timeout = setTimeout(() => {
        onSearchProcessed(value);
      }, 500);
      return () => clearTimeout(timeout);
    } else {
      onClearProcessed();
    }
  }, [onSearchProcessed, onClearProcessed]);

  // Completar servicio individual
  const handleCompleteService = async (serviceId: string) => {
    setCompletingIds(prev => new Set(prev).add(serviceId));
    try {
      await onCompleteService(serviceId);
    } finally {
      setCompletingIds(prev => {
        const next = new Set(prev);
        next.delete(serviceId);
        return next;
      });
    }
  };

  // Completar servicios múltiples
  const handleCompleteMultiple = async () => {
    if (selectedPendingIds.length === 0) return;
    
    setCompletingIds(prev => new Set([...prev, ...selectedPendingIds]));
    try {
      await onCompleteMultipleServices(selectedPendingIds);
      setSelectedPendingIds([]);
    } finally {
      setCompletingIds(new Set());
    }
  };

  // Toggle selección de servicio pendiente
  const togglePendingSelection = (serviceId: string) => {
    setSelectedPendingIds(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Seleccionar todos los servicios disponibles
  const selectAllAvailable = () => {
    const allIds = filteredServices.map(s => s.id);
    allIds.forEach(id => {
      if (!selectedServiceIds.includes(id)) {
        onServiceToggle(id, true);
      }
    });
  };

  // Deseleccionar todos
  const deselectAll = () => {
    selectedServiceIds.forEach(id => onServiceToggle(id, false));
  };

  // Auto-rellenar fechas desde servicios seleccionados
  const handleAutoFillDates = () => {
    const selectedServices = services.filter(s => selectedServiceIds.includes(s.id));
    if (selectedServices.length === 0) return;

    const dates = selectedServices
      .map(s => s.scheduled_date)
      .filter(Boolean)
      .map(d => new Date(d!))
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length > 0) {
      onAutoFillDates(dates[0], dates[dates.length - 1]);
    }
  };

  const allAvailableSelected = filteredServices.length > 0 && 
    filteredServices.every(s => selectedServiceIds.includes(s.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
        <span className="ml-2 text-muted-foreground">Cargando servicios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por folio, patente, OC o cliente..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Info de búsqueda global */}
      {isGlobalSearch && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Mostrando servicios de los últimos 90 días. Selecciona un período para filtrar.
          </AlertDescription>
        </Alert>
      )}

      {/* Servicios Pendientes */}
      {filteredPendingServices.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Servicios Pendientes ({filteredPendingServices.length})
            </h4>
            {selectedPendingIds.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleCompleteMultiple}
                disabled={completingIds.size > 0}
                className="text-xs"
              >
                {completingIds.size > 0 ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                )}
                Completar {selectedPendingIds.length}
              </Button>
            )}
          </div>
          <ScrollArea className="h-32 border rounded-md p-2 bg-amber-50/50 dark:bg-amber-950/20">
            <div className="space-y-1">
              {filteredPendingServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selectedPendingIds.includes(service.id)}
                    onCheckedChange={() => togglePendingSelection(service.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-mono">{service.folio}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {service.client?.name}
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCompleteService(service.id)}
                    disabled={completingIds.has(service.id)}
                    className="h-6 text-xs"
                  >
                    {completingIds.has(service.id) ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      'Completar'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Servicios Disponibles */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Servicios Disponibles ({filteredServices.length})
          </h4>
          <div className="flex gap-2">
            {selectedServiceIds.length > 0 && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAutoFillDates}
                  className="text-xs gap-1"
                >
                  <CalendarRange className="h-3 w-3" />
                  Auto-rellenar fechas
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={deselectAll}
                  className="text-xs"
                >
                  Deseleccionar
                </Button>
              </>
            )}
            {!allAvailableSelected && filteredServices.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={selectAllAvailable}
                className="text-xs"
              >
                Seleccionar todos
              </Button>
            )}
          </div>
        </div>
        
        {filteredServices.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileSearch className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay servicios disponibles</p>
          </div>
        ) : (
          <ScrollArea className="h-64 border rounded-md p-2">
            <div className="space-y-1">
              {filteredServices.map((service) => {
                const isSelected = selectedServiceIds.includes(service.id);
                return (
                  <div
                    key={service.id}
                    onClick={() => onServiceToggle(service.id, !isSelected)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors",
                      isSelected 
                        ? "bg-violet-100 dark:bg-violet-950/40 border border-violet-300 dark:border-violet-700" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onServiceToggle(service.id, !!checked)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-medium">{service.folio}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {service.scheduled_date ? format(new Date(service.scheduled_date), 'dd/MM/yyyy', { locale: es }) : '-'} • 
                        {service.vehicle_brand} {service.vehicle_model} {service.vehicle_plates && `(${service.vehicle_plates})`}
                      </p>
                      {service.client && (
                        <p className="text-xs text-muted-foreground">{service.client.name}</p>
                      )}
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap">
                      {formatCurrency(service.total || 0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Servicios ya procesados */}
      {(searchingProcessed || processedServices.length > 0) && searchTerm.length >= 3 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            Servicios ya procesados
          </h4>
          {searchingProcessed ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Buscando...
            </div>
          ) : (
            <div className="space-y-1 border rounded-md p-2 bg-muted/30">
              {processedServices.map((ps) => (
                <div key={ps.serviceId} className="text-xs p-2 bg-background rounded">
                  <span className="font-mono">{ps.serviceFolio}</span>
                  <span className="text-muted-foreground"> • {ps.clientName}</span>
                  <span className="text-muted-foreground"> → Cierre {ps.closureFolio}</span>
                  {ps.invoiceFolio && (
                    <span className="text-green-600"> → Factura {ps.invoiceFolio}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedServicesSelector;

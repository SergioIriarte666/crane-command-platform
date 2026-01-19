import { History, Car, Building, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useVehicleHistory } from '@/hooks/useVehicleHistory';
import { useClientHistory } from '@/hooks/useClientHistory';
import { SERVICE_STATUS_CONFIG, SERVICE_TYPES } from '@/types/services';
import { formatCLP } from '@/types/clients';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface VehicleHistoryProps {
  currentServiceId: string;
  vehiclePlates: string | null;
  clientId: string | null;
  clientName?: string;
}

export function VehicleHistory({ currentServiceId, vehiclePlates, clientId, clientName }: VehicleHistoryProps) {
  const { data: vehicleServices = [], isLoading: loadingVehicle, error: errorVehicle } = useVehicleHistory(vehiclePlates, currentServiceId);
  const { data: clientServices = [], isLoading: loadingClient, error: errorClient } = useClientHistory(clientId, currentServiceId);

  const isLoading = loadingVehicle || loadingClient;
  const hasError = errorVehicle || errorClient;
  const hasVehicleHistory = vehiclePlates && vehicleServices.length > 0;
  const hasClientHistory = clientId && clientServices.length > 0;

  // Helper to get best available date
  const getServiceDate = (service: any) => {
    const dateStr = service.service_date || service.scheduled_date || service.created_at;
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd MMM yyyy', { locale: es });
    } catch {
      return '-';
    }
  };

  // Helper to get route display
  const getRouteDisplay = (service: any) => {
    const origin = service.origin_address;
    const destination = service.destination_address;
    if (!origin && !destination) return '-';
    return `${origin || '?'} → ${destination || '?'}`;
  };

  const renderHistoryTable = (services: any[], showPlates: boolean = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Folio</TableHead>
          <TableHead>Fecha</TableHead>
          {showPlates && <TableHead>Placas</TableHead>}
          <TableHead>Tipo</TableHead>
          <TableHead>Ruta</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          <TableHead>Estado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.map((service) => {
          const statusConfig = SERVICE_STATUS_CONFIG[service.status as keyof typeof SERVICE_STATUS_CONFIG];
          const typeConfig = SERVICE_TYPES[service.type as keyof typeof SERVICE_TYPES] || { label: service.type, icon: '🔧' };
          
          return (
            <TableRow key={service.id}>
              <TableCell className="font-mono font-medium">{service.folio}</TableCell>
              <TableCell>{getServiceDate(service)}</TableCell>
              {showPlates && (
                <TableCell className="font-mono text-sm">{service.vehicle_plates || '-'}</TableCell>
              )}
              <TableCell>
                <span>{typeConfig.icon} {typeConfig.label}</span>
              </TableCell>
              <TableCell className="text-sm max-w-[200px] truncate" title={getRouteDisplay(service)}>
                {getRouteDisplay(service)}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCLP(service.subtotal || 0)}
              </TableCell>
              <TableCell>
                {statusConfig && (
                  <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0`}>
                    {statusConfig.label}
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p>Cargando historial...</p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (hasError) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-destructive">
          <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Error al cargar el historial</p>
          <p className="text-sm text-muted-foreground mt-1">
            {(errorVehicle as Error)?.message || (errorClient as Error)?.message || 'Error desconocido'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!hasVehicleHistory && !hasClientHistory) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No hay historial disponible</p>
          <p className="text-sm">
            {!vehiclePlates && !clientId 
              ? 'No se especificaron placas ni cliente'
              : 'No se encontraron servicios anteriores'}
          </p>
        </CardContent>
      </Card>
    );
  }

  // If only one type of history is available, show it directly
  if (hasVehicleHistory && !hasClientHistory) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="w-4 h-4" />
            Historial del Vehículo ({vehiclePlates})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {vehicleServices.length} servicio(s) anteriores
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {renderHistoryTable(vehicleServices)}
        </CardContent>
      </Card>
    );
  }

  if (hasClientHistory && !hasVehicleHistory) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="w-4 h-4" />
            Historial del Cliente ({clientName || 'Cliente'})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {clientServices.length} servicio(s) anteriores
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {renderHistoryTable(clientServices, true)}
        </CardContent>
      </Card>
    );
  }

  // Both histories available - show tabs
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="w-4 h-4" />
          Historial de Servicios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="vehicle" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="vehicle" className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              Vehículo ({vehicleServices.length})
            </TabsTrigger>
            <TabsTrigger value="client" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Cliente ({clientServices.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="vehicle" className="mt-0">
            <p className="text-sm text-muted-foreground mb-2">
              Servicios anteriores para placas: <strong>{vehiclePlates}</strong>
            </p>
            {renderHistoryTable(vehicleServices)}
          </TabsContent>
          
          <TabsContent value="client" className="mt-0">
            <p className="text-sm text-muted-foreground mb-2">
              Servicios anteriores para: <strong>{clientName || 'Cliente'}</strong>
            </p>
            {renderHistoryTable(clientServices, true)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

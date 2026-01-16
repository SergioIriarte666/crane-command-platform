import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Copy,
  FileText,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Car,
  Calendar,
  Clock,
  Navigation,
  Truck,
  DollarSign,
  FileCheck,
  Timer,
  Route,
  Shield,
} from 'lucide-react';
import { Service, SERVICE_STATUS_CONFIG, SERVICE_TYPES, VEHICLE_CONDITIONS } from '@/types/services';
import { useEnhancedServiceDetails } from '@/hooks/useEnhancedServiceDetails';
import { ServiceCostsSection } from './ServiceCostsSection';
import { VehicleHistory } from './VehicleHistory';
import { formatCLP } from '@/types/clients';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { isCustodyService, getCustodyInfo } from '@/utils/serviceValueCalculations';
import { toast } from 'sonner';

import { Loader2 } from 'lucide-react';

interface ServiceDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
  serviceId?: string | null;
  onDuplicate?: (service: Service) => void;
}

interface DetailItemProps {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  className?: string;
}

function DetailItem({ icon: Icon, label, value, className = '' }: DetailItemProps) {
  if (value === null || value === undefined || value === '' || value === '-') {
    return null;
  }
  return (
    <div className={`flex items-start gap-2 ${className}`}>
      {Icon && <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-sm">{value}</p>
      </div>
    </div>
  );
}

interface DetailSectionProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function DetailSection({ title, icon: Icon, children }: DetailSectionProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">{title}</h3>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function ServiceDetailsModal({ 
  isOpen, 
  onOpenChange, 
  service: initialService,
  serviceId,
  onDuplicate 
}: ServiceDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('general');
  const resolvedId = serviceId || initialService?.id || null;
  const { data: details, isLoading, isError } = useEnhancedServiceDetails(resolvedId);

  const service = initialService || details?.service;

  const handleDownloadPDF = () => {
    // TODO: Implement PDF generation
    toast.info('Función de PDF en desarrollo');
  };

  const handleDuplicate = () => {
    if (service && onDuplicate) {
      onDuplicate(service);
      onOpenChange(false);
    }
  };

  if (!isOpen) return null;

  if (isLoading && !service) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </DialogContent>
      </Dialog>
    );
  }

  if (!service) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground">
            {isError ? 'Hubo un error al cargar el servicio.' : 'No se encontró la información del servicio.'}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const statusConfig = SERVICE_STATUS_CONFIG[service.status as keyof typeof SERVICE_STATUS_CONFIG];
  const typeConfig = SERVICE_TYPES[service.type as keyof typeof SERVICE_TYPES] || { label: service.type, icon: '🔧' };
  const client = details?.client;
  const crane = details?.crane;

  // Helper to detect UUID in vehicle fields
  const isUUID = (str: string | null) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(str);
  const vehicleBrand = isUUID(service.vehicle_brand) ? null : service.vehicle_brand;
  const vehicleModel = isUUID(service.vehicle_model) ? null : service.vehicle_model;

  // Get custody info from surcharges
  const custodyInfo = getCustodyInfo(service);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        {/* Fixed Header */}
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl font-mono">{service.folio}</DialogTitle>
              {statusConfig && (
                <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0`}>
                  {statusConfig.label}
                </Badge>
              )}
              <Badge variant="outline">
                {typeConfig.icon} {typeConfig.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {onDuplicate && (
                <Button variant="outline" size="sm" onClick={handleDuplicate}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicar
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <FileText className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 border-b shrink-0">
            <TabsList className="h-10 w-full justify-start bg-transparent p-0">
              <TabsTrigger value="general" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Información General
              </TabsTrigger>
              <TabsTrigger value="details" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Detalles del Servicio
              </TabsTrigger>
              <TabsTrigger value="costs" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Costos y Gastos
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Historial Vehículo
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <>
                {/* Tab 1: Información General */}
                <TabsContent value="general" className="p-6 space-y-4 mt-0">
                  {/* Client Section */}
                  <DetailSection title="Cliente" icon={Building}>
                    {client ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <DetailItem icon={Building} label="Nombre" value={client.name} />
                        <DetailItem icon={Building} label="Razón Social" value={client.trade_name} />
                        <DetailItem icon={FileCheck} label="RUT" value={client.tax_id} />
                        <DetailItem icon={Phone} label="Teléfono" value={client.phone} />
                        <DetailItem icon={Mail} label="Email" value={client.email} />
                        <DetailItem icon={MapPin} label="Dirección" value={client.address} />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay cliente asignado</p>
                    )}
                  </DetailSection>

                  {/* Vehicle Section */}
                  <DetailSection title="Vehículo" icon={Car}>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <DetailItem icon={Car} label="Marca" value={vehicleBrand} />
                      <DetailItem icon={Car} label="Modelo" value={vehicleModel} />
                      <DetailItem icon={Car} label="Placas" value={service.vehicle_plates} />
                      <DetailItem icon={Car} label="Color" value={service.vehicle_color} />
                      <DetailItem icon={Car} label="Año" value={service.vehicle_year} />
                      {service.vehicle_condition && (
                        <DetailItem 
                          icon={Shield} 
                          label="Condición" 
                          value={VEHICLE_CONDITIONS[service.vehicle_condition as keyof typeof VEHICLE_CONDITIONS]?.label || service.vehicle_condition} 
                        />
                      )}
                    </div>
                  </DetailSection>
                </TabsContent>

                {/* Tab 2: Detalles del Servicio */}
                <TabsContent value="details" className="p-6 space-y-4 mt-0">
                  {/* Service Info */}
                  <DetailSection title="Información del Servicio" icon={FileCheck}>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <DetailItem icon={FileCheck} label="Tipo" value={`${typeConfig.icon} ${typeConfig.label}`} />
                      <DetailItem icon={FileCheck} label="Orden de Compra" value={service.po_number} />
                      <DetailItem icon={FileCheck} label="Cotización" value={service.quote_number} />
                    </div>
                  </DetailSection>

                  {/* Dates & Times */}
                  <DetailSection title="Fechas y Horarios" icon={Calendar}>
                    {(service.request_date || service.service_date || service.scheduled_date || service.scheduled_time || service.dispatch_time || service.arrival_time || service.completion_time) ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <DetailItem 
                          icon={Calendar} 
                          label="Fecha Solicitud" 
                          value={service.request_date ? format(new Date(service.request_date), 'dd MMM yyyy', { locale: es }) : null} 
                        />
                        <DetailItem 
                          icon={Calendar} 
                          label="Fecha Servicio" 
                          value={service.service_date ? format(new Date(service.service_date), 'dd MMM yyyy', { locale: es }) : null} 
                        />
                        <DetailItem 
                          icon={Calendar} 
                          label="Fecha Programada" 
                          value={service.scheduled_date ? format(new Date(service.scheduled_date), 'dd MMM yyyy', { locale: es }) : null} 
                        />
                        <DetailItem 
                          icon={Clock} 
                          label="Hora Programada" 
                          value={service.scheduled_time ? String(service.scheduled_time).substring(0, 5) : null} 
                        />
                        <DetailItem 
                          icon={Timer} 
                          label="Hora Despacho" 
                          value={service.dispatch_time ? format(new Date(service.dispatch_time), 'HH:mm', { locale: es }) : null} 
                        />
                        <DetailItem 
                          icon={Timer} 
                          label="Hora Llegada" 
                          value={service.arrival_time ? format(new Date(service.arrival_time), 'HH:mm', { locale: es }) : null} 
                        />
                        <DetailItem 
                          icon={Timer} 
                          label="Hora Término" 
                          value={service.completion_time ? format(new Date(service.completion_time), 'HH:mm', { locale: es }) : null} 
                        />
                        <DetailItem 
                          icon={Route} 
                          label="Distancia" 
                          value={service.distance_km ? `${service.distance_km} km` : null} 
                        />
                        <DetailItem 
                          icon={Route} 
                          label="KM Cobrados" 
                          value={service.km_charged ? `${service.km_charged} km` : null} 
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay fechas ni horarios registrados</p>
                    )}
                  </DetailSection>

                  {/* Locations */}
                  <DetailSection title="Ubicaciones" icon={Navigation}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <DetailItem icon={MapPin} label="Origen" value={service.origin_address} />
                        {(service.origin_city || service.origin_state) && (
                          <p className="text-xs text-muted-foreground ml-6">
                            {[service.origin_city, service.origin_state].filter(Boolean).join(', ')}
                          </p>
                        )}
                        {service.origin_references && (
                          <p className="text-xs text-muted-foreground ml-6 mt-1">
                            Ref: {service.origin_references}
                          </p>
                        )}
                      </div>
                      <div>
                        <DetailItem icon={MapPin} label="Destino" value={service.destination_address} />
                        {(service.destination_city || service.destination_state) && (
                          <p className="text-xs text-muted-foreground ml-6">
                            {[service.destination_city, service.destination_state].filter(Boolean).join(', ')}
                          </p>
                        )}
                        {service.destination_references && (
                          <p className="text-xs text-muted-foreground ml-6 mt-1">
                            Ref: {service.destination_references}
                          </p>
                        )}
                      </div>
                    </div>
                  </DetailSection>

                  {/* Custody (if applicable) */}
                  {custodyInfo && (
                    <DetailSection title="Custodia" icon={Shield}>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <DetailItem 
                          icon={Calendar} 
                          label="Días de Custodia" 
                          value={custodyInfo.days} 
                        />
                        <DetailItem 
                          icon={DollarSign} 
                          label="Tarifa Diaria" 
                          value={formatCLP(custodyInfo.dailyRate)} 
                        />
                        <DetailItem 
                          icon={DollarSign} 
                          label="Total Custodia" 
                          value={formatCLP(custodyInfo.total)} 
                        />
                      </div>
                    </DetailSection>
                  )}

                  {/* Assigned Resources */}
                  <DetailSection title="Recursos Asignados" icon={Truck}>
                    {(crane || (details?.operators && details.operators.length > 0)) ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {crane && (
                          <DetailItem icon={Truck} label="Grúa" value={`${crane.unit_number} - ${crane.brand || ''} ${crane.model || ''}`} />
                        )}
                        {details?.operators && details.operators.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Operadores</p>
                            {details.operators.map((op) => (
                              <div key={op.id} className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium text-sm">{op.operator?.full_name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {op.role === 'primary' ? 'Principal' : op.role === 'assistant' ? 'Auxiliar' : op.role}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay recursos asignados</p>
                    )}
                  </DetailSection>

                  {/* Financial Summary */}
                  <DetailSection title="Resumen Financiero" icon={DollarSign}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <DetailItem 
                        icon={DollarSign} 
                        label="Subtotal" 
                        value={formatCLP(service.subtotal || 0)} 
                      />
                      <DetailItem 
                        icon={DollarSign} 
                        label="Descuentos" 
                        value={service.discounts ? 'Aplicados' : null} 
                      />
                      <DetailItem 
                        icon={DollarSign} 
                        label="IVA" 
                        value={formatCLP(service.tax_amount || 0)} 
                      />
                      <DetailItem 
                        icon={DollarSign} 
                        label="Total" 
                        value={formatCLP(service.total || 0)} 
                      />
                    </div>
                  </DetailSection>

                  {/* Notes */}
                  {service.notes && (
                    <DetailSection title="Observaciones" icon={FileText}>
                      <p className="text-sm whitespace-pre-wrap">{service.notes}</p>
                    </DetailSection>
                  )}
                </TabsContent>

                {/* Tab 3: Costos y Gastos */}
                <TabsContent value="costs" className="p-6 mt-0">
                  <ServiceCostsSection
                    costs={details?.costs || []}
                    operators={details?.operators || []}
                    totals={details?.totals || {
                      subtotal: service.subtotal || 0,
                      tax: service.tax_amount || 0,
                      total: service.total || 0,
                      totalCommissions: 0,
                      totalCosts: 0,
                      netMargin: service.subtotal || 0,
                      marginPercentage: 100,
                    }}
                  />
                </TabsContent>

                {/* Tab 4: Historial Vehículo */}
                <TabsContent value="history" className="p-6 mt-0">
                  <VehicleHistory
                    currentServiceId={service.id}
                    vehiclePlates={service.vehicle_plates}
                    clientId={service.client_id}
                    clientName={client?.name}
                  />
                </TabsContent>
              </>
            )}
          </ScrollArea>
        </Tabs>

        {/* Fixed Footer */}
        <div className="px-6 py-3 border-t shrink-0 bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Creado: {service.created_at ? format(new Date(service.created_at), "dd MMM yyyy 'a las' HH:mm", { locale: es }) : '-'}
            </div>
            <div>
              Actualizado: {service.updated_at ? format(new Date(service.updated_at), "dd MMM yyyy 'a las' HH:mm", { locale: es }) : '-'}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

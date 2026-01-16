import { useState } from 'react';
import { Plus, ClipboardList, Search, Pencil, Trash2, Eye, Check, Copy, Download, ArrowRight, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useServices } from '@/hooks/useServices';
import { ServicePipeline } from '@/components/services/ServicePipeline';
import { EnhancedServiceForm } from '@/components/services/EnhancedServiceForm';
import { ServiceDetailsModal } from '@/components/services/ServiceDetailsModal';
import { EnhancedCSVUploadServices } from '@/components/services/EnhancedCSVUploadServices';
import { toast } from '@/hooks/use-toast';
import { 
  SERVICE_STATUS_CONFIG, 
  SERVICE_TYPES, 
  STATUS_ORDER,
  getNextStatuses,
  Service,
} from '@/types/services';
import { formatCLP } from '@/types/clients';
import type { ServiceStatus, ServiceType } from '@/types/services';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ServicesPageProps {
  defaultView?: 'list' | 'pipeline';
}

export default function ServicesPage({ defaultView = 'list' }: ServicesPageProps) {
  const { services, servicesByStatus, metrics, isLoading, deleteService, updateStatus } = useServices();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'pipeline'>(defaultView);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // State for details modal
  const [viewingService, setViewingService] = useState<Service | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // State for duplicating service
  const [duplicatingService, setDuplicatingService] = useState<Service | null>(null);
  
  // State for selection
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  
  // State for batch actions
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  const [batchStatusTarget, setBatchStatusTarget] = useState<ServiceStatus | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  
  // State for CSV upload
  const [isCSVUploadOpen, setIsCSVUploadOpen] = useState(false);

  const toggleSelectAll = () => {
    if (selectedServices.size === filteredServices.length) {
      setSelectedServices(new Set());
    } else {
      setSelectedServices(new Set(filteredServices.map(s => s.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelection = new Set(selectedServices);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedServices(newSelection);
  };

  const clearSelection = () => {
    setSelectedServices(new Set());
  };

  // Batch delete handler
  const handleBatchDelete = async () => {
    setIsBatchProcessing(true);
    try {
      const promises = Array.from(selectedServices).map(id => 
        deleteService.mutateAsync(id)
      );
      await Promise.all(promises);
      toast({
        title: "Servicios eliminados",
        description: `Se eliminaron ${selectedServices.size} servicios correctamente.`,
      });
      clearSelection();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron eliminar algunos servicios.",
        variant: "destructive",
      });
    } finally {
      setIsBatchProcessing(false);
      setIsBatchDeleteOpen(false);
    }
  };

  // Batch status change handler
  const handleBatchStatusChange = async () => {
    if (!batchStatusTarget) return;
    
    setIsBatchProcessing(true);
    try {
      const promises = Array.from(selectedServices).map(id => 
        updateStatus.mutateAsync({ id, status: batchStatusTarget })
      );
      await Promise.all(promises);
      toast({
        title: "Estados actualizados",
        description: `Se actualizaron ${selectedServices.size} servicios a "${SERVICE_STATUS_CONFIG[batchStatusTarget].label}".`,
      });
      clearSelection();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron actualizar algunos servicios.",
        variant: "destructive",
      });
    } finally {
      setIsBatchProcessing(false);
      setBatchStatusTarget(null);
    }
  };

  // Export selected services to CSV
  const handleExportSelected = () => {
    const selectedList = services.filter(s => selectedServices.has(s.id));
    
    const headers = [
      'Folio',
      'Fecha',
      'Cliente',
      'Vehículo',
      'Placas',
      'Origen',
      'Destino',
      'Grúa',
      'Operador',
      'Subtotal',
      'IVA',
      'Total',
      'Estado',
      'Tipo'
    ];

    const rows = selectedList.map(service => {
      const client = service.client as any;
      const crane = service.crane as any;
      const operator = service.operator as any;
      const isUUID = (str: string | null) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(str);
      const brand = isUUID(service.vehicle_brand) ? '' : (service.vehicle_brand || '');
      const model = isUUID(service.vehicle_model) ? '' : (service.vehicle_model || '');
      
      return [
        service.folio,
        service.service_date || service.scheduled_date || '',
        client?.name || '',
        `${brand} ${model}`.trim(),
        service.vehicle_plates || '',
        service.origin_city || service.origin_address || '',
        service.destination_city || service.destination_address || '',
        crane?.unit_number || '',
        operator?.full_name || '',
        service.subtotal || 0,
        service.tax_amount || 0,
        service.total || 0,
        SERVICE_STATUS_CONFIG[service.status as ServiceStatus]?.label || service.status,
        SERVICE_TYPES[service.type as ServiceType]?.label || service.type || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `servicios_exportados_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    toast({
      title: "Exportación completada",
      description: `Se exportaron ${selectedServices.size} servicios a CSV.`,
    });
  };

  const handleOpenNew = () => {
    setEditingService(null);
    setDuplicatingService(null);
    setIsFormOpen(true);
  };

  const handleViewDetails = (service: Service) => {
    setViewingService(service);
    setIsDetailsOpen(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setDuplicatingService(null);
    setIsFormOpen(true);
  };

  const handleDuplicate = (service: Service) => {
    setDuplicatingService(service);
    setEditingService(null);
    setIsFormOpen(true);
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.folio.toLowerCase().includes(search.toLowerCase()) ||
      service.vehicle_plates?.toLowerCase().includes(search.toLowerCase()) ||
      (service.client as any)?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || service.status === statusFilter;
    const matchesType = typeFilter === 'all' || service.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleDelete = async () => {
    if (deleteId) {
      await deleteService.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: ServiceStatus) => {
    await updateStatus.mutateAsync({ id, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Servicios</h1>
          <p className="text-muted-foreground">
            {services.length} servicios registrados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCSVUploadOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Carga Masiva
          </Button>
          <Button onClick={handleOpenNew}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Servicio
          </Button>
        </div>
      </div>
      
      {/* CSV Upload Modal */}
      <EnhancedCSVUploadServices
        isOpen={isCSVUploadOpen}
        onClose={() => setIsCSVUploadOpen(false)}
        onSuccess={(count) => {
          toast({ title: "Carga completada", description: `${count} servicios cargados exitosamente` });
        }}
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {STATUS_ORDER.slice(0, 5).map((status) => {
          const config = SERVICE_STATUS_CONFIG[status];
          const count = servicesByStatus[status]?.length || 0;
          const total = servicesByStatus[status]?.reduce((sum, s) => sum + (s.total || 0), 0) || 0;
          
          return (
            <Card key={status} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(status)}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
                <p className="text-2xl font-bold mt-1">{count}</p>
                <p className="text-xs text-muted-foreground">{formatCLP(total)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs for views */}
      <Tabs value={view} onValueChange={(v) => setView(v as 'list' | 'pipeline')}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <TabsList>
            <TabsTrigger value="list">📋 Lista</TabsTrigger>
            <TabsTrigger value="pipeline">📊 Pipeline</TabsTrigger>
          </TabsList>
          
          {/* Filters */}
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por folio, placas o cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(SERVICE_STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(SERVICE_TYPES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.icon} {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Batch Actions Bar */}
        {selectedServices.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-semibold">
                {selectedServices.size} seleccionado{selectedServices.size > 1 ? 's' : ''}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="h-7 px-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3 mr-1" />
                Limpiar
              </Button>
            </div>
            
            <div className="h-5 w-px bg-border" />
            
            {/* Change Status Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Cambiar Estado
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {Object.entries(SERVICE_STATUS_CONFIG).map(([key, config]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setBatchStatusTarget(key as ServiceStatus)}
                  >
                    <div
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: config.color }}
                    />
                    {config.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Export Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={handleExportSelected}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            
            {/* Delete Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={() => setIsBatchDeleteOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </div>
        )}

        {/* List View */}
        <TabsContent value="list" className="mt-4">
          {filteredServices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No hay servicios</h3>
                <p className="text-muted-foreground text-center max-w-sm mt-1">
                  {search || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'No se encontraron servicios con los filtros aplicados.'
                    : 'Comienza creando tu primer servicio.'}
                </p>
                {!search && statusFilter === 'all' && typeFilter === 'all' && (
                  <Button className="mt-4" onClick={handleOpenNew}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Servicio
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={selectedServices.size === filteredServices.length && filteredServices.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Folio</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vehículo</TableHead>
                    <TableHead>Origen/Destino</TableHead>
                    <TableHead>Grúa</TableHead>
                    <TableHead>Operador</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[140px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.map((service) => {
                    const statusConfig = SERVICE_STATUS_CONFIG[service.status as ServiceStatus];
                    const nextStatuses = getNextStatuses(service.status as ServiceStatus);
                    const client = service.client as any;
                    const crane = service.crane as any;
                    const operator = service.operator as any;

                    // Format vehicle brand/model, detecting UUIDs
                    const isUUID = (str: string | null) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(str);
                    const brand = isUUID(service.vehicle_brand) ? null : service.vehicle_brand;
                    const model = isUUID(service.vehicle_model) ? null : service.vehicle_model;
                    const vehicleText = [brand, model].filter(Boolean).join(' ');

                    return (
                      <TableRow key={service.id}>
                        {/* Checkbox */}
                        <TableCell>
                          <Checkbox
                            checked={selectedServices.has(service.id)}
                            onCheckedChange={() => toggleSelect(service.id)}
                          />
                        </TableCell>
                        
                        {/* Folio - Clickable green link */}
                        <TableCell>
                          <button
                            onClick={() => handleViewDetails(service)}
                            className="text-green-600 hover:text-green-700 hover:underline font-medium font-mono"
                          >
                            {service.folio}
                          </button>
                        </TableCell>
                        
                        {/* Fecha */}
                        <TableCell className="text-sm">
                          {service.service_date 
                            ? format(new Date(service.service_date), 'dd/MM/yyyy', { locale: es })
                            : service.scheduled_date
                              ? format(new Date(service.scheduled_date), 'dd/MM/yyyy', { locale: es })
                              : '-'}
                        </TableCell>
                        
                        {/* Cliente - Name + Type + Tax ID */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="font-medium text-sm">{client?.name || 'Sin cliente'}</p>
                            {client && (
                              <p className="text-xs text-muted-foreground">
                                {client.type === 'corporate' ? 'Empresa' : 'Particular'}
                                {client.tax_id && ` • ${client.tax_id}`}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        
                        {/* Vehículo - Brand Model (Plates) */}
                        <TableCell>
                          <div className="text-sm">
                            {vehicleText && <p>{vehicleText}</p>}
                            {service.vehicle_plates && (
                              <p className="font-mono text-muted-foreground text-xs">
                                ({service.vehicle_plates})
                              </p>
                            )}
                            {!vehicleText && !service.vehicle_plates && '-'}
                          </div>
                        </TableCell>
                        
                        {/* Origen/Destino */}
                        <TableCell>
                          <div className="text-sm max-w-[180px]">
                            <span className="truncate block">
                              {service.origin_city || service.origin_address || 'N/A'}
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span className="truncate block">
                              {service.destination_city || service.destination_address || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        
                        {/* Grúa */}
                        <TableCell className="text-sm">
                          {crane?.unit_number || '-'}
                        </TableCell>
                        
                        {/* Operador */}
                        <TableCell className="text-sm">
                          {operator?.full_name || '-'}
                        </TableCell>
                        
                        {/* Valor */}
                        <TableCell className="text-right font-medium">
                          {formatCLP(service.subtotal || 0)}
                        </TableCell>
                        
                        {/* Estado */}
                        <TableCell>
                          <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0`}>
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        
                        {/* Acciones - Visible icon buttons */}
                        <TableCell>
                          <TooltipProvider delayDuration={300}>
                            <div className="flex items-center gap-0.5">
                              {/* Advance status button - only show if there are valid transitions */}
                              {nextStatuses.length > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={() => handleStatusChange(service.id, nextStatuses[0])}
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Mover a {SERVICE_STATUS_CONFIG[nextStatuses[0]].label}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              
                              {/* View details */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleViewDetails(service)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ver detalle</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              {/* Edit */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() => handleEdit(service)}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              {/* Delete */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setDeleteId(service.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Eliminar</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Pipeline View */}
        <TabsContent value="pipeline" className="mt-4">
          <ServicePipeline
            servicesByStatus={servicesByStatus as any}
            onStatusChange={async (id, newStatus) => {
              await updateStatus.mutateAsync({ id, status: newStatus });
            }}
            onDelete={setDeleteId}
          />
        </TabsContent>
      </Tabs>

      {/* Delete Single Service Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el servicio y todo su historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Delete Dialog */}
      <AlertDialog open={isBatchDeleteOpen} onOpenChange={setIsBatchDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {selectedServices.size} servicios?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán los {selectedServices.size} servicios seleccionados y todo su historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBatchProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              disabled={isBatchProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBatchProcessing ? 'Eliminando...' : `Eliminar ${selectedServices.size} servicios`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Status Change Dialog */}
      <AlertDialog open={!!batchStatusTarget} onOpenChange={() => setBatchStatusTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar estado de {selectedServices.size} servicios?</AlertDialogTitle>
            <AlertDialogDescription>
              Se actualizará el estado de los {selectedServices.size} servicios seleccionados a "{batchStatusTarget ? SERVICE_STATUS_CONFIG[batchStatusTarget].label : ''}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBatchProcessing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchStatusChange}
              disabled={isBatchProcessing}
            >
              {isBatchProcessing ? 'Actualizando...' : 'Confirmar cambio'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enhanced Service Form Modal */}
      {/* Service Details Modal */}
      <ServiceDetailsModal
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        service={viewingService}
      />

      {/* Enhanced Service Form Modal */}
      <EnhancedServiceForm
        isOpen={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setDuplicatingService(null);
            setEditingService(null);
          }
        }}
        editingService={editingService}
        duplicatingService={duplicatingService}
      />
    </div>
  );
}

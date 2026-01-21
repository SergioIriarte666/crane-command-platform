import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, ChevronDown, ChevronRight, Zap, Eye, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCLP } from '@/types/clients';
import { VIP_PIPELINE_STATUSES, getStatusConfig } from '@/types/vipPipeline';
import { AdvancedServiceFilters } from './AdvancedServiceFilters';
import { BatchUpdateModal } from './BatchUpdateModal';
import { QuickStatusSelect } from './QuickStatusSelect';
import { FloatingActionBar } from './FloatingActionBar';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import { useUpdateServiceStatus } from '@/hooks/useClientServices';
import type { VipService, ServiceGroup, BatchUpdateData } from '@/types/vipPipeline';
import { toast } from 'sonner';

interface PipelineListViewProps {
  services: VipService[];
  loading: boolean;
  clientId: string;
  clientName: string;
  onBatchUpdate: (data: BatchUpdateData) => Promise<void>;
}

// Mapa de transiciones de estado lógicas
const NEXT_STATUS_MAP: Record<string, string> = {
  'quoted': 'purchase_order_pending',
  'purchase_order_pending': 'with_purchase_order',
  'with_purchase_order': 'pending',
  'pending': 'in_progress',
  'in_progress': 'completed',
  'completed': 'invoiced',
  'failed': 'pending',
  'invoiced': 'invoiced', // Estado final
};

export function PipelineListView({ services, loading, clientId, clientName, onBatchUpdate }: PipelineListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(VIP_PIPELINE_STATUSES.map(s => s.id)));
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchModalGroupServices, setBatchModalGroupServices] = useState<VipService[] | null>(null);
  
  const { isOpen, setIsOpen, filters, activeFilterCount, applyAdvancedFilters, clearFilters, updateFilters } = useAdvancedFilters();
  const updateStatus = useUpdateServiceStatus();

  // Filter services
  const filteredServices = useMemo(() => {
    return applyAdvancedFilters(services, { searchTerm, statusFilter: 'all' });
  }, [services, searchTerm, applyAdvancedFilters]);

  // Group by status
  const groupedServices: ServiceGroup[] = useMemo(() => {
    return VIP_PIPELINE_STATUSES.map(status => {
      const statusServices = filteredServices.filter(s => s.status === status.id);
      const totalValue = statusServices.reduce((sum, s) => sum + (s.total || 0), 0);
      return {
        ...status,
        status: status.id,
        services: statusServices,
        totalValue,
        averageDays: 0,
      };
    }).filter(g => g.services.length > 0);
  }, [filteredServices]);

  const toggleGroup = (statusId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(statusId)) next.delete(statusId);
      else next.add(statusId);
      return next;
    });
  };

  const toggleServiceSelection = (serviceId: string) => {
    setSelectedServices(prev => {
      const next = new Set(prev);
      if (next.has(serviceId)) next.delete(serviceId);
      else next.add(serviceId);
      return next;
    });
  };

  const toggleGroupSelection = (groupServices: VipService[], checked: boolean) => {
    setSelectedServices(prev => {
      const next = new Set(prev);
      groupServices.forEach(s => {
        if (checked) next.add(s.id);
        else next.delete(s.id);
      });
      return next;
    });
  };

  const clearSelection = () => setSelectedServices(new Set());

  // Cambio de estado individual
  const handleQuickStatusChange = async (serviceId: string, newStatus: string) => {
    await updateStatus.mutateAsync({ serviceId, status: newStatus });
  };

  // Cambio masivo de estado para selección
  const handleBulkStatusChange = async (newStatus: string) => {
    const ids = Array.from(selectedServices);
    let successCount = 0;
    
    for (const serviceId of ids) {
      try {
        await updateStatus.mutateAsync({ serviceId, status: newStatus });
        successCount++;
      } catch (error) {
        console.error(`Error updating ${serviceId}:`, error);
      }
    }
    
    toast.success(`${successCount} servicio(s) actualizados a "${getStatusConfig(newStatus).title}"`);
    clearSelection();
  };

  // Avanzar todos los servicios de un grupo al siguiente estado
  const handleAdvanceGroup = async (group: ServiceGroup) => {
    const nextStatus = NEXT_STATUS_MAP[group.status];
    if (nextStatus === group.status) {
      toast.info('Este grupo ya está en el estado final');
      return;
    }

    const ids = group.services.map(s => s.id);
    let successCount = 0;
    
    for (const serviceId of ids) {
      try {
        await updateStatus.mutateAsync({ serviceId, status: nextStatus });
        successCount++;
      } catch (error) {
        console.error(`Error advancing ${serviceId}:`, error);
      }
    }
    
    toast.success(`${successCount} servicios avanzados a "${getStatusConfig(nextStatus).title}"`);
  };

  // Abrir modal de lotes para un grupo específico
  const handleBatchGroupUpdate = (group: ServiceGroup) => {
    setBatchModalGroupServices(group.services);
    setBatchModalOpen(true);
  };

  // Abrir modal de lotes para selección actual
  const handleOpenBatchModal = () => {
    setBatchModalGroupServices(null);
    setBatchModalOpen(true);
  };

  const selectedServicesList = useMemo(() => 
    batchModalGroupServices || services.filter(s => selectedServices.has(s.id)), 
    [services, selectedServices, batchModalGroupServices]
  );

  const handleBatchModalClose = (open: boolean) => {
    setBatchModalOpen(open);
    if (!open) {
      setBatchModalGroupServices(null);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por folio, patente, cotización..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <AdvancedServiceFilters
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          filters={filters}
          onFilterChange={updateFilters}
          onClear={clearFilters}
          activeFilterCount={activeFilterCount}
        />
      </div>

      {/* Pipeline Groups */}
      <div className="space-y-3">
        {groupedServices.map(group => {
          const isExpanded = expandedGroups.has(group.status);
          const allSelected = group.services.every(s => selectedServices.has(s.id));
          const nextStatus = NEXT_STATUS_MAP[group.status];
          const canAdvance = nextStatus !== group.status;

          return (
            <Collapsible key={group.status} open={isExpanded} onOpenChange={() => toggleGroup(group.status)}>
              <Card className="overflow-hidden">
                <CollapsibleTrigger asChild>
                  <CardContent className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <Badge className={`${group.bgColor} ${group.textColor} border-0`}>
                          {group.title}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {group.services.length} servicio{group.services.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{formatCLP(group.totalValue)}</span>
                        
                        {/* Quick action buttons */}
                        {canAdvance && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2 gap-1 text-xs"
                            onClick={(e) => { e.stopPropagation(); handleAdvanceGroup(group); }}
                            title={`Avanzar a ${getStatusConfig(nextStatus).title}`}
                          >
                            <ArrowRight className="w-3 h-3" />
                            Avanzar
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 px-2"
                          onClick={(e) => { e.stopPropagation(); handleBatchGroupUpdate(group); }}
                          title="Asignar números en lote"
                        >
                          <Zap className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="border-t">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-10">
                            <Checkbox
                              checked={allSelected && group.services.length > 0}
                              onCheckedChange={(checked) => toggleGroupSelection(group.services, !!checked)}
                            />
                          </TableHead>
                          <TableHead className="w-24">Folio</TableHead>
                          <TableHead className="w-20">Fecha</TableHead>
                          <TableHead>Vehículo</TableHead>
                          <TableHead className="w-32">Estado</TableHead>
                          <TableHead>COT</TableHead>
                          <TableHead>O.C.</TableHead>
                          <TableHead className="text-right w-28">Total</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.services.map(service => (
                          <TableRow key={service.id} className="group">
                            <TableCell>
                              <Checkbox
                                checked={selectedServices.has(service.id)}
                                onCheckedChange={() => toggleServiceSelection(service.id)}
                              />
                            </TableCell>
                            <TableCell className="font-mono font-medium text-xs">{service.folio}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {service.service_date 
                                ? format(new Date(service.service_date), 'dd/MM/yy', { locale: es })
                                : '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              <div className="truncate max-w-[200px]">
                                {[service.vehicle_brand, service.vehicle_model].filter(Boolean).join(' ') || '-'}
                                {service.vehicle_plates && (
                                  <span className="text-muted-foreground ml-1 text-xs">({service.vehicle_plates})</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <QuickStatusSelect
                                currentStatus={service.status}
                                onStatusChange={(newStatus) => handleQuickStatusChange(service.id, newStatus)}
                                disabled={updateStatus.isPending}
                              />
                            </TableCell>
                            <TableCell>
                              {service.quote_number ? (
                                <Badge variant="outline" className="text-xs font-mono">{service.quote_number}</Badge>
                              ) : <span className="text-muted-foreground text-xs">-</span>}
                            </TableCell>
                            <TableCell>
                              {service.purchase_order_number ? (
                                <Badge variant="outline" className="text-xs font-mono">{service.purchase_order_number}</Badge>
                              ) : <span className="text-muted-foreground text-xs">-</span>}
                            </TableCell>
                            <TableCell className="text-right font-medium text-sm">{formatCLP(service.total || 0)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" asChild className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link to={`/servicios/${service.id}`}>
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
        
        {groupedServices.length === 0 && !loading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No se encontraron servicios
            </CardContent>
          </Card>
        )}
      </div>

      {/* Floating Action Bar */}
      <FloatingActionBar
        selectedCount={selectedServices.size}
        onStatusChange={handleBulkStatusChange}
        onOpenBatchModal={handleOpenBatchModal}
        onClearSelection={clearSelection}
      />

      {/* Batch Update Modal */}
      <BatchUpdateModal
        open={batchModalOpen}
        onOpenChange={handleBatchModalClose}
        selectedServices={selectedServicesList}
        onBatchUpdate={onBatchUpdate}
        clientName={clientName}
      />
    </div>
  );
}

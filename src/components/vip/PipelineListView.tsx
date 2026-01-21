import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Search, ChevronDown, ChevronRight, Zap, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCLP } from '@/types/clients';
import { VIP_PIPELINE_STATUSES, getStatusConfig } from '@/types/vipPipeline';
import { AdvancedServiceFilters } from './AdvancedServiceFilters';
import { BatchUpdateModal } from './BatchUpdateModal';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import type { VipService, ServiceGroup, BatchUpdateData } from '@/types/vipPipeline';

interface PipelineListViewProps {
  services: VipService[];
  loading: boolean;
  clientId: string;
  clientName: string;
  onBatchUpdate: (data: BatchUpdateData) => Promise<void>;
}

export function PipelineListView({ services, loading, clientId, clientName, onBatchUpdate }: PipelineListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(VIP_PIPELINE_STATUSES.map(s => s.id)));
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  
  const { isOpen, setIsOpen, filters, hasActiveFilters, activeFilterCount, applyAdvancedFilters, clearFilters, updateFilters } = useAdvancedFilters();

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

  const selectedServicesList = useMemo(() => 
    services.filter(s => selectedServices.has(s.id)), 
    [services, selectedServices]
  );

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
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
        <div className="flex gap-2">
          <AdvancedServiceFilters
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            filters={filters}
            onFilterChange={updateFilters}
            onClear={clearFilters}
            activeFilterCount={activeFilterCount}
          />
          {selectedServices.size > 0 && (
            <Button onClick={() => setBatchModalOpen(true)} className="gap-2">
              <Zap className="w-4 h-4" />
              Actualizar ({selectedServices.size})
            </Button>
          )}
        </div>
      </div>

      {/* Pipeline Groups */}
      <div className="space-y-3">
        {groupedServices.map(group => {
          const isExpanded = expandedGroups.has(group.status);
          const allSelected = group.services.every(s => selectedServices.has(s.id));
          const someSelected = group.services.some(s => selectedServices.has(s.id));

          return (
            <Collapsible key={group.status} open={isExpanded} onOpenChange={() => toggleGroup(group.status)}>
              <CollapsibleTrigger asChild>
                <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        <Badge className={`${group.bgColor} ${group.textColor} border-0`}>
                          {group.title}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {group.services.length} servicios
                        </span>
                      </div>
                      <span className="font-semibold">{formatCLP(group.totalValue)}</span>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-2">
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={(checked) => toggleGroupSelection(group.services, !!checked)}
                          />
                        </TableHead>
                        <TableHead>Folio</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Vehículo</TableHead>
                        <TableHead>Cotización</TableHead>
                        <TableHead>O.C.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.services.map(service => (
                        <TableRow key={service.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedServices.has(service.id)}
                              onCheckedChange={() => toggleServiceSelection(service.id)}
                            />
                          </TableCell>
                          <TableCell className="font-mono font-medium">{service.folio}</TableCell>
                          <TableCell className="text-sm">
                            {service.service_date 
                              ? format(new Date(service.service_date), 'dd/MM/yy', { locale: es })
                              : '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {[service.vehicle_brand, service.vehicle_model].filter(Boolean).join(' ') || '-'}
                            {service.vehicle_plates && <span className="text-muted-foreground ml-1">({service.vehicle_plates})</span>}
                          </TableCell>
                          <TableCell>
                            {service.quote_number ? (
                              <Badge variant="outline" className="text-xs">{service.quote_number}</Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {service.purchase_order_number ? (
                              <Badge variant="outline" className="text-xs">{service.purchase_order_number}</Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCLP(service.total || 0)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                              <Link to={`/servicios/${service.id}`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </CollapsibleContent>
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

      {/* Batch Update Modal */}
      <BatchUpdateModal
        open={batchModalOpen}
        onOpenChange={setBatchModalOpen}
        selectedServices={selectedServicesList}
        onBatchUpdate={onBatchUpdate}
        clientName={clientName}
      />
    </div>
  );
}

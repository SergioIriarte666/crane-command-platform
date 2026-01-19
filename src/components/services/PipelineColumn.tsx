import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PipelineCard } from './PipelineCard';
import { SERVICE_STATUS_CONFIG } from '@/types/services';
import { formatCLP } from '@/types/clients';
import type { ServiceStatus } from '@/types/services';

interface PipelineColumnProps {
  status: ServiceStatus;
  services: Array<{
    id: string;
    folio: string;
    priority: string;
    type: string;
    scheduled_date: string | null;
    vehicle_brand: string | null;
    vehicle_model: string | null;
    vehicle_plates: string | null;
    subtotal: number | null;
    total: number | null;
    client?: { id: string; name: string; code: string | null } | null;
    crane?: { id: string; unit_number: string; type: string } | null;
    operator?: { id: string; full_name: string; employee_number: string } | null;
  }>;
  onDelete: (id: string) => void;
}

export function PipelineColumn({ status, services, onDelete }: PipelineColumnProps) {
  const config = SERVICE_STATUS_CONFIG[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });
  
  const totalValue = services.reduce((sum, s) => sum + (s.total || 0), 0);

  return (
    <Card 
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 flex flex-col transition-all ${
        isOver ? 'ring-2 ring-primary shadow-lg bg-accent/50' : ''
      }`}
    >
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: config.color }} 
            />
            <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs font-medium">
            {services.length}
          </Badge>
        </div>
        {totalValue > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Total: {formatCLP(totalValue)}
          </p>
        )}
      </CardHeader>
      
      <ScrollArea className="flex-1">
        <CardContent className="pt-0">
          <SortableContext 
            items={services.map(s => s.id)} 
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 min-h-[100px]">
              {services.length === 0 ? (
                <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  isOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'
                }`}>
                  <p className="text-xs text-muted-foreground">
                    {isOver ? 'Soltar aquí' : 'Sin servicios'}
                  </p>
                </div>
              ) : (
                services.map((service) => (
                  <PipelineCard
                    key={service.id}
                    id={service.id}
                    service={service}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}

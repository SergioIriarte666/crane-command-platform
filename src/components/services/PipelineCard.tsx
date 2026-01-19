import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom';
import { GripVertical, Calendar, Truck, User, MoreVertical, Pencil, Eye, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { SERVICE_TYPES, SERVICE_PRIORITIES } from '@/types/services';
import { formatCLP } from '@/types/clients';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ServiceType, ServicePriority } from '@/types/services';

interface PipelineCardProps {
  id: string;
  service: {
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
  };
  onDelete: (id: string) => void;
}

export function PipelineCard({ id, service, onDelete }: PipelineCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeConfig = SERVICE_TYPES[service.type as ServiceType] || { label: service.type || 'N/A', icon: '🔧' };
  const priorityConfig = SERVICE_PRIORITIES[service.priority as ServicePriority];

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`group cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
        isDragging ? 'shadow-lg ring-2 ring-primary/20' : ''
      }`}
    >
      <CardContent className="p-3">
        {/* Header with grip and actions */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div 
              {...attributes} 
              {...listeners}
              className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="font-mono text-sm font-medium">{service.folio}</span>
          </div>
          <div className="flex items-center gap-1">
            {service.priority === 'urgent' && (
              <Badge className={`${priorityConfig.bgColor} ${priorityConfig.color} border-0 text-xs px-1`}>
                🔥
              </Badge>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/servicios/${service.id}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalle
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/servicios/${service.id}/editar`}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(service.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Type badge */}
        <div className="mb-2">
          <Badge variant="outline" className="text-xs">
            {typeConfig.icon} {typeConfig.label}
          </Badge>
        </div>

        {/* Client */}
        <p className="text-sm font-medium truncate">
          {service.client?.name || 'Sin cliente'}
        </p>

        {/* Vehicle */}
        <p className="text-xs text-muted-foreground truncate">
          {(() => {
            const isUUID = (str: string | null) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(str);
            const brand = isUUID(service.vehicle_brand) ? null : service.vehicle_brand;
            const model = isUUID(service.vehicle_model) ? null : service.vehicle_model;
            return [brand, model].filter(Boolean).join(' ') || 'Sin vehículo';
          })()}
          {service.vehicle_plates && (
            <span className="font-mono ml-1">({service.vehicle_plates})</span>
          )}
        </p>

        {/* Assignment */}
        {(service.crane || service.operator) && (
          <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
            {service.crane && (
              <div className="flex items-center gap-1">
                <Truck className="w-3 h-3" />
                <span>{service.crane.unit_number}</span>
              </div>
            )}
            {service.operator && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span className="truncate max-w-[80px]">{service.operator.full_name}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {service.scheduled_date
              ? format(new Date(service.scheduled_date), 'dd MMM', { locale: es })
              : 'Sin fecha'}
          </div>
          <span className="text-sm font-semibold text-foreground">
            {formatCLP(service.subtotal || 0)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

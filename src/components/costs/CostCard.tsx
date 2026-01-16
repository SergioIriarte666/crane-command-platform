import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MoreHorizontal, Truck, User, Briefcase, Copy, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CostWithRelations, COST_STATUS_CONFIG } from '@/types/costs';

interface CostCardProps {
  cost: CostWithRelations;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function CostCard({
  cost,
  selected,
  onSelect,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}: CostCardProps) {
  const statusConfig = COST_STATUS_CONFIG[cost.status];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className={`relative transition-all ${selected ? 'ring-2 ring-violet-500' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Checkbox checked={selected} onCheckedChange={onSelect} />
            <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor}`}>
              {statusConfig.label}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onView}>
                Ver Detalle
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">
            {format(new Date(cost.cost_date + 'T12:00:00'), 'dd MMM yyyy', { locale: es })}
          </p>
          <p className="font-medium line-clamp-2">{cost.description}</p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-green-600">
            {formatCurrency(cost.total || 0)}
          </span>
          <Badge variant="outline" className="font-mono text-xs">
            {cost.code}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {cost.crane && (
            <span className="flex items-center gap-1">
              <Truck className="w-3 h-3" />
              {cost.crane.unit_number}
            </span>
          )}
          {cost.operator && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {cost.operator.full_name.split(' ')[0]}
            </span>
          )}
          {cost.service && (
            <span className="flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              {cost.service.folio}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

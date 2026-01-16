import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Truck, Users } from 'lucide-react';
import { formatCLP } from '@/types/clients';
import { SERVICE_STATUS_CONFIG, ServiceStatus } from '@/types/services';

interface FormSummaryPanelProps {
  folio: string;
  clientName?: string;
  serviceType?: string;
  value: number;
  totalCommissions: number;
  totalCosts: number;
  operatorCount: number;
  craneName?: string;
  origin?: string;
  destination?: string;
  status: string;
  isEditing?: boolean;
}

export function FormSummaryPanel({
  folio,
  clientName,
  serviceType,
  value,
  totalCommissions,
  totalCosts,
  operatorCount,
  craneName,
  origin,
  destination,
  status,
  isEditing
}: FormSummaryPanelProps) {
  const netMargin = value - totalCommissions - totalCosts;
  const marginPercentage = value > 0 ? (netMargin / value) * 100 : 0;

  const statusConfig = SERVICE_STATUS_CONFIG[status as ServiceStatus] || {
    label: 'Borrador',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700'
  };

  const getStatusBadge = () => (
    <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0`}>
      {statusConfig.label}
    </Badge>
  );

  const getMarginColor = () => {
    if (marginPercentage >= 30) return 'text-green-600 dark:text-green-400';
    if (marginPercentage >= 15) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getMarginBarColor = () => {
    if (marginPercentage >= 30) return 'bg-green-500';
    if (marginPercentage >= 15) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">
          {isEditing ? 'Editando Servicio' : 'Resumen del Servicio'}
        </h3>
        {getStatusBadge()}
      </div>

      <Separator className="bg-primary/20" />

      {/* Folio y Cliente */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Folio</span>
          <span className="font-mono font-medium">{folio || '---'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Cliente</span>
          <span className="font-medium truncate ml-2 max-w-[140px]">{clientName || '---'}</span>
        </div>
      </div>

      {/* Tipo de Servicio */}
      {serviceType && (
        <>
          <Separator className="bg-primary/20" />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tipo de Servicio</p>
            <p className="text-sm font-medium">{serviceType}</p>
          </div>
        </>
      )}

      {/* Ubicación */}
      {(origin || destination) && (
        <>
          <Separator className="bg-primary/20" />
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Ubicación</p>
            {origin && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-3 h-3 text-green-600 shrink-0 mt-0.5" />
                <span className="truncate">{origin}</span>
              </div>
            )}
            {destination && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-3 h-3 text-red-600 shrink-0 mt-0.5" />
                <span className="truncate">{destination}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Recursos */}
      {(craneName || operatorCount > 0) && (
        <>
          <Separator className="bg-primary/20" />
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Recursos</p>
            <div className="flex items-center gap-4">
              {craneName && (
                <div className="flex items-center gap-1 text-sm">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span>{craneName}</span>
                </div>
              )}
              {operatorCount > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <Users className="w-4 h-4 text-orange-600" />
                  <span>{operatorCount}</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Resumen Financiero */}
      <Separator className="bg-primary/20" />
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Resumen Financiero</p>
        
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor</span>
            <span className="font-medium">{formatCLP(value)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Comisiones</span>
            <span className="text-orange-600">-{formatCLP(totalCommissions)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Costos</span>
            <span className="text-red-600">-{formatCLP(totalCosts)}</span>
          </div>
          
          <Separator className="my-2 bg-primary/20" />
          
          <div className="flex justify-between">
            <span className="font-medium">Margen Neto</span>
            <span className={`font-bold ${netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCLP(netMargin)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Margen</span>
            <span className={`font-medium ${getMarginColor()}`}>
              {marginPercentage.toFixed(1)}%
            </span>
          </div>
          
          {/* Progress bar for margin */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-1">
            <div 
              className={`h-full transition-all ${getMarginBarColor()}`}
              style={{ width: `${Math.min(Math.max(marginPercentage, 0), 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColoredSectionCard } from '../ColoredSectionCard';
import { ServiceFormData } from '@/types/serviceForm';
import { SERVICE_PRIORITIES } from '@/types/services';
import { FileText, Calendar, User, Clock, RotateCw, Settings2 } from 'lucide-react';
import { CatalogItem } from '@/hooks/useCatalogs';

interface BasicInfoStepProps {
  formData: ServiceFormData;
  onChange: (data: Partial<ServiceFormData>) => void;
  clients: Array<{ id: string; name: string; code?: string | null }>;
  serviceTypes: CatalogItem[];
  nextFolio?: string;
  isFieldInvalid: (field: string) => boolean;
  getFieldError: (field: string) => { message: string } | undefined;
}

export function BasicInfoStep({
  formData,
  onChange,
  clients,
  serviceTypes,
  nextFolio,
  isFieldInvalid,
  getFieldError,
}: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      {/* Folio y Fechas */}
      <ColoredSectionCard title="Identificación" icon={<FileText className="w-4 h-4" />} color="violet">
        <div className="space-y-4">
          {/* Folio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="folio">Folio</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor="folioAuto" className="text-sm text-muted-foreground">
                  Auto-generar
                </Label>
                <Switch
                  id="folioAuto"
                  checked={formData.folioAuto}
                  onCheckedChange={(checked) => {
                    onChange({ 
                      folioAuto: checked,
                      folio: checked ? (nextFolio || '') : formData.folio 
                    });
                  }}
                />
              </div>
            </div>
            <Input
              id="folio"
              value={formData.folioAuto ? (nextFolio || 'Generando...') : formData.folio}
              onChange={(e) => onChange({ folio: e.target.value })}
              disabled={formData.folioAuto}
              placeholder="Ej: SRV-2026-0001"
              className={isFieldInvalid('folio') ? 'border-red-500' : ''}
            />
            {getFieldError('folio') && (
              <p className="text-xs text-red-500">{getFieldError('folio')?.message}</p>
            )}
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requestDate">
                <Calendar className="w-3 h-3 inline mr-1" />
                Fecha Solicitud *
              </Label>
              <Input
                id="requestDate"
                type="date"
                value={formData.requestDate}
                onChange={(e) => onChange({ requestDate: e.target.value })}
                className={isFieldInvalid('requestDate') ? 'border-red-500' : ''}
              />
              {getFieldError('requestDate') && (
                <p className="text-xs text-red-500">{getFieldError('requestDate')?.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceDate">
                <Calendar className="w-3 h-3 inline mr-1" />
                Fecha Servicio *
              </Label>
              <Input
                id="serviceDate"
                type="date"
                value={formData.serviceDate}
                onChange={(e) => onChange({ serviceDate: e.target.value })}
                className={isFieldInvalid('serviceDate') ? 'border-red-500' : ''}
              />
              {getFieldError('serviceDate') && (
                <p className="text-xs text-red-500">{getFieldError('serviceDate')?.message}</p>
              )}
            </div>
          </div>
        </div>
      </ColoredSectionCard>

      {/* Cliente */}
      <ColoredSectionCard title="Cliente" icon={<User className="w-4 h-4" />} color="blue">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select
              value={formData.clientId || 'none'}
              onValueChange={(v) => onChange({ clientId: v === 'none' ? '' : v })}
            >
              <SelectTrigger className={isFieldInvalid('clientId') ? 'border-red-500' : ''}>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Seleccionar cliente</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.code ? `${client.code} - ` : ''}{client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getFieldError('clientId') && (
              <p className="text-xs text-red-500">{getFieldError('clientId')?.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseOrder">Orden de Compra</Label>
              <Input
                id="purchaseOrder"
                value={formData.purchaseOrder || ''}
                onChange={(e) => onChange({ purchaseOrder: e.target.value })}
                placeholder="No. de O/C"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quoteNumber">No. Cotización</Label>
              <Input
                id="quoteNumber"
                value={formData.quoteNumber || ''}
                onChange={(e) => onChange({ quoteNumber: e.target.value })}
                placeholder="Referencia"
              />
            </div>
          </div>
        </div>
      </ColoredSectionCard>

      {/* Tipo y Prioridad */}
      <ColoredSectionCard title="Tipo de Servicio" icon={<FileText className="w-4 h-4" />} color="green">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select
              value={formData.serviceType}
              onValueChange={(v) => onChange({ serviceType: v as any })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.length > 0 ? (
                  serviceTypes.filter(t => t.is_active).map((type) => (
                    <SelectItem key={type.id} value={type.code}>
                      {type.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="local" disabled>
                    Sin tipos configurados
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Prioridad</Label>
            <Select
              value={formData.priority}
              onValueChange={(v) => onChange({ priority: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SERVICE_PRIORITIES).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </ColoredSectionCard>

      {/* Datos Opcionales del Servicio */}
      <ColoredSectionCard title="Datos Opcionales del Servicio" icon={<Settings2 className="w-4 h-4" />} color="gray">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Activa los campos que necesites registrar
          </p>
          
          <div className="border border-dashed border-border rounded-lg p-4 space-y-4">
            {/* Hora de Inicio */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="trackStartTime"
                  checked={formData.trackStartTime}
                  onCheckedChange={(checked) => onChange({ 
                    trackStartTime: !!checked,
                    startTime: checked ? formData.startTime : ''
                  })}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <label htmlFor="trackStartTime" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Hora de Inicio del Servicio
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Registra la hora exacta en que inicia el servicio
                  </p>
                </div>
              </div>
              {formData.trackStartTime && (
                <div className="ml-7">
                  <Input
                    type="time"
                    value={formData.startTime || ''}
                    onChange={(e) => onChange({ startTime: e.target.value })}
                    className="w-40"
                  />
                </div>
              )}
            </div>

            {/* Hora de Término */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="trackEndTime"
                  checked={formData.trackEndTime}
                  onCheckedChange={(checked) => onChange({ 
                    trackEndTime: !!checked,
                    endTime: checked ? formData.endTime : ''
                  })}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <label htmlFor="trackEndTime" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Hora de Término del Servicio
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Registra la hora exacta en que termina el servicio
                  </p>
                </div>
              </div>
              {formData.trackEndTime && (
                <div className="ml-7">
                  <Input
                    type="time"
                    value={formData.endTime || ''}
                    onChange={(e) => onChange({ endTime: e.target.value })}
                    className="w-40"
                  />
                </div>
              )}
            </div>

            {/* Kilómetros */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="trackDistance"
                  checked={formData.trackDistance}
                  onCheckedChange={(checked) => onChange({ 
                    trackDistance: !!checked,
                    distanceKm: checked ? formData.distanceKm : undefined
                  })}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <label htmlFor="trackDistance" className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <RotateCw className="w-4 h-4 text-muted-foreground" />
                    Kilómetros recorridos en servicio
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Registra los kilómetros recorridos durante el servicio
                  </p>
                </div>
              </div>
              {formData.trackDistance && (
                <div className="ml-7">
                  <Input
                    type="number"
                    value={formData.distanceKm || ''}
                    onChange={(e) => onChange({ distanceKm: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Ej: 25"
                    className="w-40"
                    min={0}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </ColoredSectionCard>
    </div>
  );
}

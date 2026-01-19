import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColoredSectionCard } from '../ColoredSectionCard';
import { ServiceFormData } from '@/types/serviceForm';
import { SERVICE_STATUS_CONFIG, ServiceStatus } from '@/types/services';
import { DollarSign, Calculator, FileText } from 'lucide-react';
import { formatCLP } from '@/types/clients';
import { useCatalogOptions } from '@/hooks/useCatalogs';

interface FinancialStepProps {
  formData: ServiceFormData;
  onChange: (data: Partial<ServiceFormData>) => void;
  isFieldInvalid: (field: string) => boolean;
  getFieldError: (field: string) => { message: string } | undefined;
}

export function FinancialStep({
  formData,
  onChange,
  isFieldInvalid,
  getFieldError,
}: FinancialStepProps) {
  const { data: statusOptions } = useCatalogOptions('service_status');

  // Calculate totals reactively - simplified to just serviceValue + tax
  useEffect(() => {
    const subtotal = formData.serviceValue;
    const taxAmount = (subtotal * formData.taxRate) / 100;
    const total = subtotal + taxAmount;
    
    if (subtotal !== formData.subtotal || taxAmount !== formData.taxAmount || total !== formData.total) {
      onChange({ subtotal, taxAmount, total });
    }
  }, [formData.serviceValue, formData.taxRate]);

  const totalCommissions = formData.operators.reduce((sum, op) => sum + (op.commission || 0), 0);
  const totalCosts = formData.costs.reduce((sum, cost) => sum + cost.amount, 0);
  // Calculate margin from subtotal (net), not total (with tax)
  const netMargin = formData.subtotal - totalCommissions - totalCosts;
  const marginPercentage = formData.subtotal > 0 ? (netMargin / formData.subtotal) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Valor del Servicio */}
      <ColoredSectionCard title="Valor del Servicio" icon={<DollarSign className="w-4 h-4" />} color="green">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Valor Base del Servicio *</Label>
            <Input
              type="number"
              min="0"
              value={formData.serviceValue || ''}
              onChange={(e) => onChange({ serviceValue: parseFloat(e.target.value) || 0 })}
              placeholder="0"
              className={isFieldInvalid('serviceValue') ? 'border-red-500' : ''}
            />
            {getFieldError('serviceValue') && (
              <p className="text-xs text-red-500">{getFieldError('serviceValue')?.message}</p>
            )}
          </div>

        </div>
      </ColoredSectionCard>

      {/* Exceso (para servicios de seguros) */}
      <ColoredSectionCard title="Exceso / Deducible" icon={<DollarSign className="w-4 h-4" />} color="orange">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Label htmlFor="hasExcess" className="flex-1 cursor-pointer">
              ¿El servicio tiene exceso/deducible?
            </Label>
            <Switch
              id="hasExcess"
              checked={formData.hasExcess}
              onCheckedChange={(checked) => onChange({ 
                hasExcess: checked,
                clientCoveredAmount: checked ? formData.clientCoveredAmount : undefined,
                excessAmount: checked ? formData.excessAmount : undefined,
              })}
            />
          </div>

          {formData.hasExcess && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monto Cubierto por Seguro</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.clientCoveredAmount || ''}
                  onChange={(e) => onChange({ clientCoveredAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className={isFieldInvalid('clientCoveredAmount') ? 'border-red-500' : ''}
                />
                {getFieldError('clientCoveredAmount') && (
                  <p className="text-xs text-red-500">{getFieldError('clientCoveredAmount')?.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Monto Exceso (paga cliente)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.excessAmount || ''}
                  onChange={(e) => onChange({ excessAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className={isFieldInvalid('excessAmount') ? 'border-red-500' : ''}
                />
                {getFieldError('excessAmount') && (
                  <p className="text-xs text-red-500">{getFieldError('excessAmount')?.message}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </ColoredSectionCard>

      {/* Resumen de Totales */}
      <ColoredSectionCard title="Resumen de Totales" icon={<Calculator className="w-4 h-4" />} color="violet">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCLP(formData.subtotal)}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">IVA</span>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.taxRate}
                onChange={(e) => onChange({ taxRate: parseFloat(e.target.value) || 0 })}
                className="w-16 h-7 text-xs"
              />
              <span className="text-muted-foreground">%</span>
            </div>
            <span>{formatCLP(formData.taxAmount)}</span>
          </div>

          <Separator />

          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-green-600">{formatCLP(formData.total)}</span>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">(-) Comisiones</span>
              <span className="text-orange-600">{formatCLP(totalCommissions)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">(-) Costos</span>
              <span className="text-red-600">{formatCLP(totalCosts)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Margen Neto</span>
              <span className={netMargin >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCLP(netMargin)} ({marginPercentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
      </ColoredSectionCard>

      {/* Estado y Observaciones */}
      <ColoredSectionCard title="Estado y Notas" icon={<FileText className="w-4 h-4" />} color="gray">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Estado del Servicio</Label>
            <Select
              value={formData.status}
              onValueChange={(v) => onChange({ status: v as ServiceStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions && statusOptions.length > 0 ? (
                  statusOptions.map((option) => (
                    <SelectItem key={option.id} value={option.code}>
                      {option.name}
                    </SelectItem>
                  ))
                ) : (
                  Object.entries(SERVICE_STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Observaciones (visible para cliente)</Label>
            <Textarea
              value={formData.observations || ''}
              onChange={(e) => onChange({ observations: e.target.value })}
              placeholder="Notas visibles en documentos..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Notas Internas</Label>
            <Textarea
              value={formData.internalNotes || ''}
              onChange={(e) => onChange({ internalNotes: e.target.value })}
              placeholder="Notas internas (no visibles para cliente)..."
              rows={2}
            />
          </div>
        </div>
      </ColoredSectionCard>
    </div>
  );
}

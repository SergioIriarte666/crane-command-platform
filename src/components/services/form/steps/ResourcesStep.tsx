import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColoredSectionCard } from '../ColoredSectionCard';
import { ServiceFormData, ServiceOperator } from '@/types/serviceForm';
import { Truck, Users, Plus, Trash2 } from 'lucide-react';
import { formatCLP } from '@/types/clients';
import { ServiceCostDetailsSection } from '../ServiceCostDetailsSection';

interface ResourcesStepProps {
  formData: ServiceFormData;
  onChange: (data: Partial<ServiceFormData>) => void;
  cranes: Array<{ id: string; unit_number: string; type: string }>;
  operators: Array<{ id: string; full_name: string; employee_number: string; commission_percentage?: number | null }>;
  isFieldInvalid: (field: string) => boolean;
  getFieldError: (field: string) => { message: string } | undefined;
  serviceId?: string;
}

const OPERATOR_ROLES = ['Principal', 'Auxiliar', 'Supervisor'] as const;

export function ResourcesStep({
  formData,
  onChange,
  cranes,
  operators,
  isFieldInvalid,
  getFieldError,
  serviceId,
}: ResourcesStepProps) {
  const addOperator = () => {
    const newOperator: ServiceOperator = {
      id: crypto.randomUUID(),
      operatorId: '',
      commission: 0,
      role: 'Principal',
    };
    onChange({ operators: [...formData.operators, newOperator] });
  };

  const updateOperator = (index: number, updates: Partial<ServiceOperator>) => {
    const updated = [...formData.operators];
    updated[index] = { ...updated[index], ...updates };
    
    // Auto-fill commission from operator config if selecting new operator
    if (updates.operatorId) {
      const selectedOp = operators.find(o => o.id === updates.operatorId);
      if (selectedOp?.commission_percentage && !updated[index].commission) {
        updated[index].commission = selectedOp.commission_percentage;
      }
      updated[index].operatorName = selectedOp?.full_name;
    }
    
    onChange({ operators: updated });
  };

  const removeOperator = (index: number) => {
    onChange({ operators: formData.operators.filter((_, i) => i !== index) });
  };

  const totalCommissions = formData.operators.reduce((sum, op) => sum + (op.commission || 0), 0);

  return (
    <div className="space-y-6">
      {/* Grúa */}
      <ColoredSectionCard title="Grúa Asignada" icon={<Truck className="w-4 h-4" />} color="blue">
        <div className="space-y-2">
          <Label>Seleccionar Grúa</Label>
          <Select
            value={formData.craneId || 'none'}
            onValueChange={(v) => onChange({ craneId: v === 'none' ? '' : v })}
          >
            <SelectTrigger className={isFieldInvalid('craneId') ? 'border-red-500' : ''}>
              <SelectValue placeholder="Seleccionar grúa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin grúa asignada</SelectItem>
              {cranes.map((crane) => (
                <SelectItem key={crane.id} value={crane.id}>
                  <span className="font-mono">{crane.unit_number}</span>
                  <span className="text-muted-foreground ml-2">({crane.type})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {getFieldError('craneId') && (
            <p className="text-xs text-red-500">{getFieldError('craneId')?.message}</p>
          )}
        </div>
      </ColoredSectionCard>

      {/* Operadores */}
      <ColoredSectionCard title="Operadores" icon={<Users className="w-4 h-4" />} color="orange">
        <div className="space-y-4">
          {formData.operators.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay operadores asignados
            </p>
          )}

          {formData.operators.map((op, index) => (
            <div 
              key={op.id} 
              className="flex items-start gap-3 p-3 border rounded-lg bg-background"
            >
              <div className="flex-1 grid grid-cols-4 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Operador</Label>
                  <Select
                    value={op.operatorId || 'none'}
                    onValueChange={(v) => updateOperator(index, { operatorId: v === 'none' ? '' : v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Seleccionar operador</SelectItem>
                      {operators.map((operator) => (
                        <SelectItem key={operator.id} value={operator.id}>
                          {operator.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs">Rol</Label>
                  <Select
                    value={op.role}
                    onValueChange={(v) => updateOperator(index, { role: v as typeof OPERATOR_ROLES[number] })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OPERATOR_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs">Comisión ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={op.commission}
                    onChange={(e) => updateOperator(index, { commission: parseFloat(e.target.value) || 0 })}
                    className="h-9"
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={() => removeOperator(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {getFieldError('operators') && (
            <p className="text-xs text-red-500">{getFieldError('operators')?.message}</p>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addOperator}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar Operador
            </Button>
            
            {formData.operators.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Total comisiones: <span className="font-medium text-orange-600">{formatCLP(totalCommissions)}</span>
              </p>
            )}
          </div>
        </div>
      </ColoredSectionCard>

      {/* Costos del Servicio - Using the new enhanced component */}
      <ServiceCostDetailsSection
        serviceId={serviceId}
        costDetails={formData.costs}
        onCostDetailsChange={(costs) => onChange({ costs })}
        disabled={false}
      />
    </div>
  );
}

import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, User, Briefcase, Building2 } from 'lucide-react';
import { CostFormData } from '@/types/costForm';

// Simplified catalog option type
interface CatalogOption {
  id: string;
  code: string;
  name: string;
}

interface CostAssociationsStepProps {
  formData: CostFormData;
  onChange: (field: keyof CostFormData, value: string | number | boolean) => void;
  cranes: { id: string; unit_number: string; brand?: string | null; model?: string | null }[];
  operators: { id: string; full_name: string; employee_number: string }[];
  services: { id: string; folio: string; crane_id?: string | null; operator_id?: string | null }[];
  suppliers: { id: string; name: string }[];
  costCenters: CatalogOption[];
}

export function CostAssociationsStep({
  formData,
  onChange,
  cranes,
  operators,
  services,
  suppliers,
  costCenters,
}: CostAssociationsStepProps) {
  // Auto-fill cuando se selecciona un servicio
  useEffect(() => {
    if (formData.service_id) {
      const selectedService = services.find(s => s.id === formData.service_id);
      if (selectedService) {
        // Auto-fill folio
        if (selectedService.folio && !formData.service_folio) {
          onChange('service_folio', selectedService.folio);
        }
        // Auto-fill grúa
        if (selectedService.crane_id && !formData.crane_id) {
          onChange('crane_id', selectedService.crane_id);
        }
        // Auto-fill operador
        if (selectedService.operator_id && !formData.operator_id) {
          onChange('operator_id', selectedService.operator_id);
        }
      }
    }
  }, [formData.service_id]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Asociaciones</h3>
        <p className="text-sm text-muted-foreground">
          Vincula el costo con grúas, operadores, servicios o centros de costo.
          Todos los campos son opcionales.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Servicio */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-violet-600" />
              <CardTitle className="text-sm font-medium">Servicio</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Al seleccionar un servicio, se auto-completará la grúa y operador asociados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={formData.service_id}
              onValueChange={(value) => onChange('service_id', value === 'none' ? '' : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un servicio (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin servicio</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {service.folio}
                      </Badge>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Grúa y Operador */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-sm font-medium">Grúa</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.crane_id}
                onValueChange={(value) => onChange('crane_id', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una grúa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin grúa</SelectItem>
                  {cranes.map((crane) => (
                    <SelectItem key={crane.id} value={crane.id}>
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{crane.unit_number}</span>
                        {crane.brand && (
                          <span className="text-muted-foreground text-xs">
                            {crane.brand} {crane.model}
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-green-600" />
                <CardTitle className="text-sm font-medium">Operador</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.operator_id}
                onValueChange={(value) => onChange('operator_id', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un operador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin operador</SelectItem>
                  {operators.map((op) => (
                    <SelectItem key={op.id} value={op.id}>
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{op.full_name}</span>
                        <span className="text-muted-foreground text-xs">
                          #{op.employee_number}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Centro de Costo y Proveedor */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                <CardTitle className="text-sm font-medium">Centro de Costo</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.cost_center_id}
                onValueChange={(value) => onChange('cost_center_id', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un centro de costo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin centro de costo</SelectItem>
                  {costCenters.map((center) => (
                    <SelectItem key={center.id} value={center.id}>
                      <span className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {center.code}
                        </Badge>
                        <span>{center.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-orange-600" />
                <CardTitle className="text-sm font-medium">Proveedor</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) => onChange('supplier_id', value === 'none' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin proveedor</SelectItem>
                  {suppliers.map((sup) => (
                    <SelectItem key={sup.id} value={sup.id}>
                      {sup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

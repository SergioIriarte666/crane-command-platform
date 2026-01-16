import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CostFormData } from '@/types/costForm';

interface CostAmountDetailsStepProps {
  formData: CostFormData;
  onChange: (field: keyof CostFormData, value: string | number | boolean) => void;
  errors: Partial<Record<keyof CostFormData, string>>;
}

export function CostAmountDetailsStep({ formData, onChange, errors }: CostAmountDetailsStepProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const subtotal = formData.unit_value * formData.quantity;
  const discountedSubtotal = subtotal - formData.discount;
  const taxAmount = (discountedSubtotal * formData.tax_rate) / 100;
  const total = discountedSubtotal + taxAmount;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Monto y Detalles</h3>
        <p className="text-sm text-muted-foreground">
          Ingresa los valores del costo.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Campos de Piezas/Repuestos (opcional) */}
        <Card className="border-dashed border-violet-300 bg-violet-50/50 dark:bg-violet-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              🔧 Detalles Adicionales (Opcional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="part_name">Nombre de la Pieza/Artículo</Label>
                <Input
                  id="part_name"
                  value={formData.part_name}
                  onChange={(e) => onChange('part_name', e.target.value)}
                  placeholder="Ej: Llanta 295/80 R22.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kilometraje">Kilometraje</Label>
                <Input
                  id="kilometraje"
                  type="number"
                  value={formData.kilometraje || ''}
                  onChange={(e) => onChange('kilometraje', parseFloat(e.target.value) || 0)}
                  placeholder="Km actual del vehículo"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="supplier_name">Proveedor (texto libre)</Label>
                <Input
                  id="supplier_name"
                  value={formData.supplier_name}
                  onChange={(e) => onChange('supplier_name', e.target.value)}
                  placeholder="Nombre del proveedor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier_phone">Teléfono Proveedor</Label>
                <Input
                  id="supplier_phone"
                  value={formData.supplier_phone}
                  onChange={(e) => onChange('supplier_phone', e.target.value)}
                  placeholder="+52 xxx xxx xxxx"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="immediate_consumption">Consumo Inmediato</Label>
                <p className="text-xs text-muted-foreground">
                  Marcar si el artículo se utilizó de inmediato
                </p>
              </div>
              <Switch
                id="immediate_consumption"
                checked={formData.immediate_consumption}
                onCheckedChange={(checked) => onChange('immediate_consumption', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Valores principales */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="unit_value" className="flex items-center gap-1">
              Valor Unitario <span className="text-red-500">*</span>
            </Label>
            <Input
              id="unit_value"
              type="number"
              value={formData.unit_value || ''}
              onChange={(e) => onChange('unit_value', parseFloat(e.target.value) || 0)}
              placeholder="$0"
              className={cn(errors.unit_value && 'border-red-500')}
            />
            {errors.unit_value && (
              <p className="text-sm text-red-500">{errors.unit_value}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity" className="flex items-center gap-1">
              Cantidad <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity || ''}
              onChange={(e) => onChange('quantity', parseFloat(e.target.value) || 0)}
              placeholder="1"
              className={cn(errors.quantity && 'border-red-500')}
            />
            {errors.quantity && (
              <p className="text-sm text-red-500">{errors.quantity}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="discount">Descuento</Label>
            <Input
              id="discount"
              type="number"
              value={formData.discount || ''}
              onChange={(e) => onChange('discount', parseFloat(e.target.value) || 0)}
              placeholder="$0"
              className={cn(errors.discount && 'border-red-500')}
            />
            {errors.discount && (
              <p className="text-sm text-red-500">{errors.discount}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax_rate">Tasa IVA (%)</Label>
            <Input
              id="tax_rate"
              type="number"
              value={formData.tax_rate}
              onChange={(e) => onChange('tax_rate', parseFloat(e.target.value) || 0)}
              placeholder="19"
              className={cn(errors.tax_rate && 'border-red-500')}
            />
            {errors.tax_rate && (
              <p className="text-sm text-red-500">{errors.tax_rate}</p>
            )}
          </div>
        </div>

        {/* Resumen de cálculo */}
        <Card className="bg-muted/30">
          <CardContent className="pt-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {formData.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Descuento:</span>
                  <span>-{formatCurrency(formData.discount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA ({formData.tax_rate}%):</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t font-semibold text-base">
                <span>Total:</span>
                <span className="text-green-600">{formatCurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

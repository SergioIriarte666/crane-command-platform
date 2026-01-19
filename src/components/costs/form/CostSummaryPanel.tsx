import { Calendar, Tag, FileText, DollarSign, Truck, User, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CostFormData } from '@/types/costForm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Simplified catalog option type
interface CatalogOption {
  id: string;
  code: string;
  name: string;
}

interface CostSummaryPanelProps {
  formData: CostFormData;
  categories: CatalogOption[];
  cranes: { id: string; unit_number: string }[];
  operators: { id: string; full_name: string }[];
  services: { id: string; folio: string }[];
  isEditing: boolean;
}

export function CostSummaryPanel({
  formData,
  categories,
  cranes,
  operators,
  services,
  isEditing,
}: CostSummaryPanelProps) {
  const category = categories.find(c => c.id === formData.category_id);
  const crane = cranes.find(c => c.id === formData.crane_id);
  const operator = operators.find(o => o.id === formData.operator_id);
  const service = services.find(s => s.id === formData.service_id);

  const subtotal = formData.unit_value * formData.quantity;
  const discountedSubtotal = subtotal - formData.discount;
  const taxAmount = (discountedSubtotal * formData.tax_rate) / 100;
  const total = discountedSubtotal + taxAmount;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Resumen</CardTitle>
          <Badge variant={isEditing ? 'secondary' : 'default'} className="text-xs">
            {isEditing ? 'Editando' : 'Nuevo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Fecha */}
        {formData.cost_date && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Fecha:</span>
            <span className="font-medium">
              {format(new Date(formData.cost_date + 'T12:00:00'), 'dd MMM yyyy', { locale: es })}
            </span>
          </div>
        )}

        {/* Categoría */}
        {category && (
          <div className="flex items-center gap-2 text-sm">
            <Tag className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Categoría:</span>
            <span className="font-medium">{category.name}</span>
          </div>
        )}

        {/* Descripción */}
        {formData.description && (
          <div className="flex items-start gap-2 text-sm">
            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground">Descripción:</span>
            <span className="font-medium line-clamp-2">{formData.description}</span>
          </div>
        )}

        <Separator />

        {/* Monto */}
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(total)}
            </p>
          </div>
        </div>

        {/* Desglose */}
        {(formData.discount > 0 || formData.tax_rate > 0) && (
          <div className="text-xs text-muted-foreground space-y-1 pl-7">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {formData.discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Descuento:</span>
                <span>-{formatCurrency(formData.discount)}</span>
              </div>
            )}
            {formData.tax_rate > 0 && (
              <div className="flex justify-between">
                <span>IVA ({formData.tax_rate}%):</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
            )}
          </div>
        )}

        {/* Asociaciones */}
        {(crane || operator || service) && (
          <>
            <Separator />
            <div className="space-y-2">
              {crane && (
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Grúa:</span>
                  <span className="font-medium">{crane.unit_number}</span>
                </div>
              )}
              {operator && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Operador:</span>
                  <span className="font-medium truncate">{operator.full_name}</span>
                </div>
              )}
              {service && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Servicio:</span>
                  <span className="font-medium">{service.folio}</span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

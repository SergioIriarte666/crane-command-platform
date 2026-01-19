import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CostFormData } from '@/types/costForm';

// Simplified catalog option type
interface CatalogOption {
  id: string;
  code: string;
  name: string;
}

interface CostBasicInfoStepProps {
  formData: CostFormData;
  onChange: (field: keyof CostFormData, value: string | number | boolean) => void;
  categories: CatalogOption[];
  errors: Partial<Record<keyof CostFormData, string>>;
}

export function CostBasicInfoStep({ formData, onChange, categories, errors }: CostBasicInfoStepProps) {
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onChange('cost_date', format(date, 'yyyy-MM-dd'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Información Básica</h3>
        <p className="text-sm text-muted-foreground">
          Ingresa la fecha, categoría y descripción del costo.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Fecha */}
        <div className="space-y-2">
          <Label htmlFor="cost_date" className="flex items-center gap-1">
            Fecha del Costo <span className="text-red-500">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="cost_date"
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !formData.cost_date && 'text-muted-foreground',
                  errors.cost_date && 'border-red-500'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.cost_date
                  ? format(new Date(formData.cost_date + 'T12:00:00'), 'PPP', { locale: es })
                  : 'Selecciona una fecha'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.cost_date ? new Date(formData.cost_date + 'T12:00:00') : undefined}
                onSelect={handleDateSelect}
                locale={es}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.cost_date && (
            <p className="text-sm text-red-500">{errors.cost_date}</p>
          )}
        </div>

        {/* Categoría */}
        <div className="space-y-2">
          <Label htmlFor="category_id" className="flex items-center gap-1">
            Categoría <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.category_id}
            onValueChange={(value) => {
              onChange('category_id', value);
              onChange('subcategory_id', ''); // Reset subcategory when category changes
            }}
          >
            <SelectTrigger id="category_id" className={cn(errors.category_id && 'border-red-500')}>
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <span className="flex items-center gap-2">
                    <span>{cat.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category_id && (
            <p className="text-sm text-red-500">{errors.category_id}</p>
          )}
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center gap-1">
            Descripción <span className="text-red-500">*</span>
          </Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Ej: Combustible para unidad 05, Reparación de llanta..."
            className={cn(errors.description && 'border-red-500')}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Describe brevemente el gasto o servicio realizado.
          </p>
        </div>
      </div>
    </div>
  );
}

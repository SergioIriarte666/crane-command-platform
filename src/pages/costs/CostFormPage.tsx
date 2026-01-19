import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Calculator, Loader2, Save } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { useCost, useCosts } from '@/hooks/useCosts';
import { useServices } from '@/hooks/useServices';
import { useCranes } from '@/hooks/useCranes';
import { useOperators } from '@/hooks/useOperators';
import { useSuppliers } from '@/hooks/useSuppliers';
import { COST_CATEGORIES, COST_CATEGORY_CONFIG, calculateCostTotals } from '@/types/costs';

const costSchema = z.object({
  code: z.string().min(1, 'El código es requerido').max(50, 'Máximo 50 caracteres'),
  description: z.string().min(3, 'La descripción debe tener al menos 3 caracteres').max(500, 'Máximo 500 caracteres'),
  category: z.enum(['materials', 'labor', 'services', 'taxes', 'transport', 'equipment', 'other']),
  unit_value: z.coerce.number().min(0, 'El valor debe ser mayor o igual a 0'),
  quantity: z.coerce.number().min(0.01, 'La cantidad debe ser mayor a 0'),
  discount: z.coerce.number().min(0, 'El descuento no puede ser negativo').default(0),
  tax_rate: z.coerce.number().min(0).max(100, 'El IVA debe estar entre 0 y 100').default(19),
  cost_date: z.date(),
  service_id: z.string().nullable().optional(),
  crane_id: z.string().nullable().optional(),
  operator_id: z.string().nullable().optional(),
  supplier_id: z.string().nullable().optional(),
  notes: z.string().max(1000).optional(),
});

type CostFormValues = z.infer<typeof costSchema>;

export default function CostFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const { data: existingCost, isLoading: loadingCost } = useCost(id);
  const { createCost, updateCost } = useCosts();
  const { services } = useServices();
  const { cranes } = useCranes();
  const { operators } = useOperators();
  const { suppliers } = useSuppliers();

  const form = useForm<CostFormValues>({
    resolver: zodResolver(costSchema),
    defaultValues: {
      code: '',
      description: '',
      category: 'other',
      unit_value: 0,
      quantity: 1,
      discount: 0,
      tax_rate: 19,
      cost_date: new Date(),
      service_id: null,
      crane_id: null,
      operator_id: null,
      supplier_id: null,
      notes: '',
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (existingCost) {
      form.reset({
        code: existingCost.code,
        description: existingCost.description,
        category: existingCost.category,
        unit_value: Number(existingCost.unit_value),
        quantity: Number(existingCost.quantity),
        discount: Number(existingCost.discount),
        tax_rate: Number(existingCost.tax_rate),
        cost_date: new Date(existingCost.cost_date),
        service_id: existingCost.service_id,
        crane_id: existingCost.crane_id,
        operator_id: existingCost.operator_id,
        supplier_id: existingCost.supplier_id,
        notes: existingCost.notes || '',
      });
    }
  }, [existingCost, form]);

  // Calculate totals reactively
  const watchedValues = form.watch(['unit_value', 'quantity', 'discount', 'tax_rate']);
  const calculatedTotals = useMemo(() => {
    const [unitValue, quantity, discount, taxRate] = watchedValues;
    return calculateCostTotals(
      Number(unitValue) || 0,
      Number(quantity) || 0,
      Number(discount) || 0,
      Number(taxRate) || 19
    );
  }, [watchedValues]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
  };

  const onSubmit = async (values: CostFormValues) => {
    const costData = {
      code: values.code,
      description: values.description,
      category: values.category,
      unit_value: values.unit_value,
      quantity: values.quantity,
      discount: values.discount,
      tax_rate: values.tax_rate,
      cost_date: format(values.cost_date, 'yyyy-MM-dd'),
      service_id: values.service_id || null,
      crane_id: values.crane_id || null,
      operator_id: values.operator_id || null,
      supplier_id: values.supplier_id || null,
      notes: values.notes || null,
    };

    if (isEditing) {
      await updateCost.mutateAsync({ id, ...costData });
    } else {
      await createCost.mutateAsync(costData);
    }
    navigate('/costos');
  };

  if (loadingCost && isEditing) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/costos')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? 'Editar Costo' : 'Nuevo Costo'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Modifica los datos del costo' : 'Registra un nuevo costo operativo'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información del Costo</CardTitle>
                  <CardDescription>Datos principales del registro de costo</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código *</FormLabel>
                          <FormControl>
                            <Input placeholder="COSTO-001" {...field} />
                          </FormControl>
                          <FormDescription>Identificador único del costo</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoría *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar categoría" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COST_CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {COST_CATEGORY_CONFIG[cat].icon} {COST_CATEGORY_CONFIG[cat].label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe el costo en detalle..." 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="cost_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha del Costo *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value ? format(field.value, 'dd/MM/yyyy') : 'Seleccionar fecha'}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Valores */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Valores
                  </CardTitle>
                  <CardDescription>Cantidad, valor unitario y descuentos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="unit_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Unitario *</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" min="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cantidad *</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" min="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="discount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descuento</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" min="0" {...field} />
                          </FormControl>
                          <FormDescription>Monto de descuento a aplicar</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tax_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tasa IVA (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="1" min="0" max="100" {...field} />
                          </FormControl>
                          <FormDescription>Porcentaje de impuesto</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Referencias */}
              <Card>
                <CardHeader>
                  <CardTitle>Referencias (Opcional)</CardTitle>
                  <CardDescription>Asociar el costo a otros registros del sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="service_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Servicio</FormLabel>
                          <Select 
                            onValueChange={(v) => field.onChange(v === 'none' ? null : v)} 
                            value={field.value || 'none'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sin servicio asociado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Sin servicio asociado</SelectItem>
                              {services.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.folio}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="crane_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grúa</FormLabel>
                          <Select 
                            onValueChange={(v) => field.onChange(v === 'none' ? null : v)} 
                            value={field.value || 'none'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sin grúa asociada" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Sin grúa asociada</SelectItem>
                              {cranes.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.unit_number}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="operator_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Operador</FormLabel>
                          <Select 
                            onValueChange={(v) => field.onChange(v === 'none' ? null : v)} 
                            value={field.value || 'none'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sin operador asociado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Sin operador asociado</SelectItem>
                              {operators.map((o) => (
                                <SelectItem key={o.id} value={o.id}>{o.full_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="supplier_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proveedor</FormLabel>
                          <Select 
                            onValueChange={(v) => field.onChange(v === 'none' ? null : v)} 
                            value={field.value || 'none'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sin proveedor asociado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Sin proveedor asociado</SelectItem>
                              {suppliers.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas adicionales</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Observaciones o comentarios..." 
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Summary Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Resumen</CardTitle>
                  <CardDescription>Cálculos automáticos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-mono">{formatCurrency(calculatedTotals.subtotal)}</span>
                    </div>
                    {form.watch('discount') > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Descuento</span>
                        <span className="font-mono text-red-600">-{formatCurrency(Number(form.watch('discount')))}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">IVA ({form.watch('tax_rate')}%)</span>
                      <span className="font-mono">{formatCurrency(calculatedTotals.taxAmount)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span className="font-mono">{formatCurrency(calculatedTotals.total)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={createCost.isPending || updateCost.isPending}
                    >
                      {(createCost.isPending || updateCost.isPending) && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      <Save className="w-4 h-4 mr-2" />
                      {isEditing ? 'Guardar Cambios' : 'Crear Costo'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/costos')}
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useCranes } from '@/hooks/useCranes';
import { useOperators } from '@/hooks/useOperators';
import { useCatalogOptions } from '@/hooks/useCatalogs';
import { CRANE_STATUS_CONFIG } from '@/types/fleet';
import type { CraneStatus } from '@/types/fleet';

const craneSchema = z.object({
  unit_number: z.string().min(1, 'Número de unidad requerido'),
  type: z.string().min(1, 'Tipo de grúa requerido'),
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().optional(),
  plates: z.string().optional(),
  serial_number: z.string().optional(),
  capacity_tons: z.coerce.number().optional(),
  status: z.enum(['available', 'in_service', 'maintenance', 'out_of_service']),
  current_km: z.coerce.number().optional(),
  fuel_type: z.string().optional(),
  fuel_efficiency: z.coerce.number().optional(),
  gps_device_id: z.string().optional(),
  insurance_policy: z.string().optional(),
  insurance_expiry: z.string().optional(),
  circulation_permit: z.string().optional(),
  permit_expiry: z.string().optional(),
  verification_date: z.string().optional(),
  next_verification: z.string().optional(),
  acquisition_date: z.string().optional(),
  acquisition_cost: z.coerce.number().optional(),
  assigned_operator_id: z.string().optional(),
  notes: z.string().optional(),
});

type CraneFormData = z.infer<typeof craneSchema>;

export default function CraneFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { cranes, createCrane, updateCrane, generateUnitNumber } = useCranes();
  const { operators } = useOperators();
  const { data: craneTypes = [] } = useCatalogOptions('crane_type');
  const { data: fuelTypes = [] } = useCatalogOptions('fuel_type');
  const [isGeneratingUnit, setIsGeneratingUnit] = useState(false);

  const crane = isEditing ? cranes.find((c) => c.id === id) : null;

  const form = useForm<CraneFormData>({
    resolver: zodResolver(craneSchema),
    defaultValues: {
      unit_number: '',
      type: 'plataforma',
      status: 'available',
      fuel_type: 'diesel',
      current_km: 0,
    },
  });

  useEffect(() => {
    if (crane) {
      form.reset({
        unit_number: crane.unit_number,
        type: crane.type,
        brand: crane.brand || '',
        model: crane.model || '',
        year: crane.year || undefined,
        plates: crane.plates || '',
        serial_number: crane.serial_number || '',
        capacity_tons: crane.capacity_tons || undefined,
        status: crane.status as CraneStatus,
        current_km: crane.current_km || 0,
        fuel_type: crane.fuel_type || 'diesel',
        fuel_efficiency: crane.fuel_efficiency || undefined,
        gps_device_id: crane.gps_device_id || '',
        insurance_policy: crane.insurance_policy || '',
        insurance_expiry: crane.insurance_expiry || '',
        circulation_permit: crane.circulation_permit || '',
        permit_expiry: crane.permit_expiry || '',
        verification_date: crane.verification_date || '',
        next_verification: crane.next_verification || '',
        acquisition_date: crane.acquisition_date || '',
        acquisition_cost: crane.acquisition_cost || undefined,
        assigned_operator_id: crane.assigned_operator_id || '',
        notes: crane.notes || '',
      });
    }
  }, [crane, form]);

  useEffect(() => {
    if (!isEditing && !form.getValues('unit_number')) {
      setIsGeneratingUnit(true);
      generateUnitNumber()
        .then((unitNumber) => {
          form.setValue('unit_number', unitNumber);
        })
        .finally(() => setIsGeneratingUnit(false));
    }
  }, [isEditing, generateUnitNumber, form]);

  const onSubmit = async (data: CraneFormData) => {
    try {
      const payload = {
        ...data,
        type: data.type as 'plataforma' | 'arrastre' | 'pesada' | 'lowboy' | 'auxilio',
        year: data.year || null,
        capacity_tons: data.capacity_tons || null,
        fuel_efficiency: data.fuel_efficiency || null,
        acquisition_cost: data.acquisition_cost || null,
        insurance_expiry: data.insurance_expiry || null,
        permit_expiry: data.permit_expiry || null,
        verification_date: data.verification_date || null,
        next_verification: data.next_verification || null,
        acquisition_date: data.acquisition_date || null,
        assigned_operator_id: data.assigned_operator_id || null,
      };

      if (isEditing && id) {
        await updateCrane.mutateAsync({ id, ...payload });
      } else {
        await createCrane.mutateAsync(payload as any);
      }
      navigate('/flota/gruas');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isPending = createCrane.isPending || updateCrane.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/flota/gruas')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? 'Editar Grúa' : 'Nueva Grúa'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Modifica los datos de la grúa' : 'Agrega una nueva grúa a la flota'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Información Básica
              </CardTitle>
              <CardDescription>Datos principales de identificación</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="unit_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Unidad *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="GRU-001"
                        disabled={isGeneratingUnit}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Grúa *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {craneTypes.length > 0 ? (
                          craneTypes.map((type) => (
                            <SelectItem key={type.code} value={type.code}>
                              {type.name}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="plataforma">Plataforma</SelectItem>
                            <SelectItem value="arrastre">Arrastre</SelectItem>
                            <SelectItem value="pesada">Pesada</SelectItem>
                            <SelectItem value="lowboy">Lowboy</SelectItem>
                            <SelectItem value="auxilio">Auxilio</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {Object.entries(CRANE_STATUS_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej: Kenworth" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej: T800" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Año</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="2024" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="plates"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placas</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="AA-BB-12" className="uppercase" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </CardContent>
          </Card>


          {/* Documentos y Fechas */}
          <Card>
            <CardHeader>
              <CardTitle>Documentos y Vencimientos</CardTitle>
              <CardDescription>Control de documentación legal</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="verification_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimiento SOAP</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permit_expiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimiento Revisión Técnica</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="next_verification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimiento Permiso de Circulación</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>


          {/* Notas */}
          <Card>
            <CardHeader>
              <CardTitle>Notas Adicionales</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Observaciones adicionales sobre la grúa..."
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/flota/gruas')}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Crear Grúa'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

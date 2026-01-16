import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, User, CreditCard, Truck } from 'lucide-react';
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
import { useOperators } from '@/hooks/useOperators';
import { useCranes } from '@/hooks/useCranes';
import { useCatalogOptions } from '@/hooks/useCatalogs';
import { OPERATOR_STATUS_CONFIG } from '@/types/operators';
import type { OperatorStatus } from '@/types/operators';

const operatorSchema = z.object({
  employee_number: z.string().min(1, 'Número de empleado requerido'),
  full_name: z.string().min(1, 'Nombre completo requerido'),
  photo_url: z.string().optional(),
  phone: z.string().optional(),
  emergency_phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  birth_date: z.string().optional(),
  hire_date: z.string().optional(),
  license_number: z.string().optional(),
  license_type: z.string().optional(),
  license_expiry: z.string().optional(),
  blood_type: z.string().optional(),
  status: z.enum(['active', 'inactive', 'vacation', 'suspended']),
  assigned_crane_id: z.string().optional(),
  commission_type: z.string().optional(),
  commission_percentage: z.coerce.number().optional(),
  commission_fixed_amount: z.coerce.number().optional(),
  bank_name: z.string().optional(),
  bank_account: z.string().optional(),
  clabe: z.string().optional(),
  notes: z.string().optional(),
});

type OperatorFormData = z.infer<typeof operatorSchema>;

export default function OperatorFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { operators, createOperator, updateOperator, generateEmployeeNumber } = useOperators();
  const { cranes } = useCranes();
  const { data: licenseTypes = [] } = useCatalogOptions('license_type');
  const { data: bloodTypes = [] } = useCatalogOptions('blood_type');
  const { data: commissionTypes = [] } = useCatalogOptions('commission_type');
  const { data: banks = [] } = useCatalogOptions('bank');
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false);

  const operator = isEditing ? operators.find((o) => o.id === id) : null;

  const form = useForm<OperatorFormData>({
    resolver: zodResolver(operatorSchema),
    defaultValues: {
      employee_number: '',
      full_name: '',
      status: 'active',
      commission_type: 'percentage',
      commission_percentage: 0,
      commission_fixed_amount: 0,
    },
  });

  const watchCommissionType = form.watch('commission_type');

  useEffect(() => {
    if (operator) {
      form.reset({
        employee_number: operator.employee_number,
        full_name: operator.full_name,
        photo_url: operator.photo_url || '',
        phone: operator.phone || '',
        emergency_phone: operator.emergency_phone || '',
        email: operator.email || '',
        address: operator.address || '',
        birth_date: operator.birth_date || '',
        hire_date: operator.hire_date || '',
        license_number: operator.license_number || '',
        license_type: operator.license_type || '',
        license_expiry: operator.license_expiry || '',
        blood_type: operator.blood_type || '',
        status: operator.status as OperatorStatus,
        assigned_crane_id: operator.assigned_crane_id || '',
        commission_type: operator.commission_type || 'percentage',
        commission_percentage: operator.commission_percentage || 0,
        commission_fixed_amount: operator.commission_fixed_amount || 0,
        bank_name: operator.bank_name || '',
        bank_account: operator.bank_account || '',
        clabe: operator.clabe || '',
        notes: operator.notes || '',
      });
    }
  }, [operator, form]);

  useEffect(() => {
    if (!isEditing && !form.getValues('employee_number')) {
      setIsGeneratingNumber(true);
      generateEmployeeNumber()
        .then((number) => {
          form.setValue('employee_number', number);
        })
        .finally(() => setIsGeneratingNumber(false));
    }
  }, [isEditing, generateEmployeeNumber, form]);

  const onSubmit = async (data: OperatorFormData) => {
    try {
      const payload = {
        ...data,
        email: data.email || null,
        birth_date: data.birth_date || null,
        hire_date: data.hire_date || null,
        license_expiry: data.license_expiry || null,
        assigned_crane_id: data.assigned_crane_id || null,
        commission_type: (data.commission_type as 'percentage' | 'fixed' | 'mixed') || null,
      };

      if (isEditing && id) {
        await updateOperator.mutateAsync({ id, ...payload });
      } else {
        await createOperator.mutateAsync(payload as any);
      }
      navigate('/operadores');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isPending = createOperator.isPending || updateOperator.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/operadores')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? 'Editar Operador' : 'Nuevo Operador'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Modifica los datos del operador' : 'Registra un nuevo operador'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Información Personal
              </CardTitle>
              <CardDescription>Datos personales del operador</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="employee_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Empleado *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="EMP-001"
                        disabled={isGeneratingNumber}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Nombre Completo *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Juan Pérez González" />
                    </FormControl>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(OPERATOR_STATUS_CONFIG).map(([key, config]) => (
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+56 9 1234 5678" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergency_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono de Emergencia</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+56 9 8765 4321" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="operador@email.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Calle, número, comuna, ciudad" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birth_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Nacimiento</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hire_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Contratación</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </CardContent>
          </Card>

          {/* Licencia y Asignación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Licencia y Asignación
              </CardTitle>
              <CardDescription>Datos de licencia de conducir y grúa asignada</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="license_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Licencia</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="12.345.678-9" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="license_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Licencia</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {licenseTypes.map((type) => (
                          <SelectItem key={type.code} value={type.code}>
                            {type.name}
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
                name="license_expiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimiento Licencia</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assigned_crane_id"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>Grúa Asignada</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === '_none' ? '' : value)} 
                      value={field.value || '_none'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">Sin asignar</SelectItem>
                        {cranes
                          .filter((c) => c.status === 'available' || c.id === field.value)
                          .map((crane) => (
                            <SelectItem key={crane.id} value={crane.id}>
                              {crane.unit_number} - {crane.brand} {crane.model}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Solo se muestran grúas disponibles
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Comisiones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Comisiones y Pagos
              </CardTitle>
              <CardDescription>Configuración de comisiones y datos bancarios</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="commission_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Comisión</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || 'percentage'}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {commissionTypes.map((type) => (
                          <SelectItem key={type.code} value={type.code}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(watchCommissionType === 'percentage' || watchCommissionType === 'mixed') && (
                <FormField
                  control={form.control}
                  name="commission_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Porcentaje (%)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.5" min="0" max="100" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {(watchCommissionType === 'fixed' || watchCommissionType === 'mixed') && (
                <FormField
                  control={form.control}
                  name="commission_fixed_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto Fijo (CLP)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="bank_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banco</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar banco" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {banks.map((bank) => (
                          <SelectItem key={bank.code} value={bank.name}>
                            {bank.name}
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
                name="bank_account"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Cuenta</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="0000000000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clabe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RUT para Transferencias</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="12.345.678-9" />
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
                        placeholder="Observaciones adicionales sobre el operador..."
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
              onClick={() => navigate('/operadores')}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Crear Operador'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

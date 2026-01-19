import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTenant, useUpdateTenant } from '@/hooks/useSettings';
import { Loader2, Save, Building2, FileText, Upload, Trash2, ImageIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PlanLimitsCard } from './PlanLimitsCard';
import { useLogoUpdater } from '@/hooks/useLogoUpdater';

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  slug: z.string().min(1, 'El slug es requerido'),
  tax_id: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  logo_url: z.string().url('URL inválida').optional().or(z.literal('')),
  primary_color: z.string().optional(),
  folio_format: z.string().min(1, 'El formato es requerido').refine(
    (val) => val.includes('{number}'),
    'El formato debe incluir {number}'
  ),
  next_folio_number: z.number().min(1, 'Debe ser mayor a 0'),
});

type FormData = z.infer<typeof formSchema>;

export function CompanySettings() {
  const { data: tenant, isLoading, refetch } = useTenant();
  const updateTenant = useUpdateTenant();
  const { isUpdating: isLogoUpdating, updateLogo, removeLogo } = useLogoUpdater();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      slug: '',
      tax_id: '',
      email: '',
      phone: '',
      address: '',
      logo_url: '',
      primary_color: '',
      folio_format: 'SRV-{number}',
      next_folio_number: 1,
    },
  });

  useEffect(() => {
    if (tenant) {
      form.reset({
        name: tenant.name || '',
        slug: tenant.slug || '',
        tax_id: tenant.tax_id || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        address: tenant.address || '',
        logo_url: tenant.logo_url || '',
        primary_color: tenant.primary_color || '',
        folio_format: (tenant as any).folio_format || 'SRV-{number}',
        next_folio_number: (tenant as any).next_folio_number || 1,
      });
      setLogoPreview(tenant.logo_url || null);
    }
  }, [tenant, form]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return;
    }

    const result = await updateLogo(file);
    if (result.success) {
      setLogoPreview(result.newLogoUrl || null);
      refetch();
    }
  };

  const handleRemoveLogo = async () => {
    const result = await removeLogo();
    if (result.success) {
      setLogoPreview(null);
      refetch();
    }
  };

  const onSubmit = (data: FormData) => {
    updateTenant.mutate({
      name: data.name,
      slug: data.slug,
      tax_id: data.tax_id || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      logo_url: data.logo_url || null,
      primary_color: data.primary_color || null,
      folio_format: data.folio_format,
      next_folio_number: data.next_folio_number,
    } as any);
  };

  // Generate preview of folio format
  const folioFormat = form.watch('folio_format');
  const nextNumber = form.watch('next_folio_number');
  const folioPreview = folioFormat?.replace('{number}', String(nextNumber || 1).padStart(5, '0')) || '';


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Logotipo de la Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <img 
                  src={logoPreview} 
                  alt="Logo de la empresa" 
                  className="h-12 w-auto object-contain"
                />
              ) : (
                <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <span className="text-sm text-muted-foreground">
                Se muestra en informes y facturas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={handleLogoChange}
              />
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isLogoUpdating}
              >
                {isLogoUpdating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Cambiar
              </Button>
              {logoPreview && (
                <Button 
                  variant="destructive" 
                  size="icon"
                  onClick={handleRemoveLogo}
                  disabled={isLogoUpdating}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Información de la Empresa</CardTitle>
              <CardDescription>
                Configura los datos generales de tu empresa
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Empresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Mi Empresa de Grúas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Identificador (Slug)</FormLabel>
                      <FormControl>
                        <Input placeholder="mi-empresa" {...field} />
                      </FormControl>
                      <FormDescription>
                        Identificador único para URLs
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tax_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RUT</FormLabel>
                      <FormControl>
                        <Input placeholder="12.345.678-9" {...field} />
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
                        <Input type="email" placeholder="contacto@empresa.com" {...field} />
                      </FormControl>
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
                        <Input placeholder="+56 9 1234 5678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Calle, número, comuna, ciudad, región" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="primary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color Primario</FormLabel>
                    <div className="flex gap-3">
                      <Input 
                        type="color" 
                        className="w-16 h-10 p-1 cursor-pointer" 
                        value={field.value || '#3B82F6'}
                        onChange={field.onChange}
                      />
                      <FormControl>
                        <Input 
                          placeholder="#3B82F6" 
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormDescription>
                      Color principal para la marca de tu empresa
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={updateTenant.isPending}>
                  {updateTenant.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Folio Configuration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle>Configuración de Folio</CardTitle>
              <CardDescription>
                Define el formato de numeración para los servicios
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="folio_format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Formato de Folio</FormLabel>
                      <FormControl>
                        <Input placeholder="SRV-{number}" {...field} />
                      </FormControl>
                      <FormDescription>
                        Use <code className="bg-muted px-1 rounded">{'{number}'}</code> donde quiere que aparezca el número secuencial
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="next_folio_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Próximo Número de Folio</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription>
                        Número secuencial para el siguiente servicio
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Preview */}
              <div className="p-4 bg-muted/50 rounded-lg border">
                <p className="text-sm text-muted-foreground mb-1">Vista previa del próximo folio:</p>
                <p className="font-mono text-lg font-semibold">{folioPreview}</p>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={updateTenant.isPending}>
                  {updateTenant.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Guardar Configuración
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <PlanLimitsCard />
    </div>
  );
}

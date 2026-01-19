import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, X, GripVertical, Loader2 } from 'lucide-react';
import {
  PlanConfig,
  useUpdatePlanConfig,
  useUpdatePlanFeatures,
} from '@/hooks/usePlanConfigs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  price: z.string().min(1, 'El precio es requerido'),
  price_amount: z.coerce.number().min(0, 'El monto debe ser positivo'),
  max_cranes: z.coerce.number().nullable(),
  max_users: z.coerce.number().nullable(),
  max_operators: z.coerce.number().nullable(),
  max_clients: z.coerce.number().nullable(),
  icon: z.string(),
  color: z.string(),
});

type FormData = z.infer<typeof formSchema>;

interface PlanConfigDialogProps {
  plan: PlanConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ICON_OPTIONS = [
  { value: 'Shield', label: 'Escudo' },
  { value: 'Zap', label: 'Rayo' },
  { value: 'Crown', label: 'Corona' },
  { value: 'Star', label: 'Estrella' },
  { value: 'Rocket', label: 'Cohete' },
];

const COLOR_OPTIONS = [
  { value: 'slate', label: 'Gris', class: 'bg-slate-500' },
  { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
  { value: 'amber', label: 'Dorado', class: 'bg-amber-500' },
  { value: 'green', label: 'Verde', class: 'bg-green-500' },
  { value: 'purple', label: 'Morado', class: 'bg-purple-500' },
];

export function PlanConfigDialog({
  plan,
  open,
  onOpenChange,
}: PlanConfigDialogProps) {
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [unlimitedCranes, setUnlimitedCranes] = useState(false);
  const [unlimitedUsers, setUnlimitedUsers] = useState(false);
  const [unlimitedOperators, setUnlimitedOperators] = useState(false);
  const [unlimitedClients, setUnlimitedClients] = useState(false);

  const updatePlan = useUpdatePlanConfig();
  const updateFeatures = useUpdatePlanFeatures();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      price: '',
      price_amount: 0,
      max_cranes: null,
      max_users: null,
      max_operators: null,
      max_clients: null,
      icon: 'Shield',
      color: 'slate',
    },
  });

  useEffect(() => {
    if (plan) {
      form.reset({
        name: plan.name,
        price: plan.price,
        price_amount: plan.price_amount,
        max_cranes: plan.max_cranes,
        max_users: plan.max_users,
        max_operators: plan.max_operators,
        max_clients: plan.max_clients,
        icon: plan.icon,
        color: plan.color,
      });
      setFeatures(plan.features?.map((f) => f.feature_text) || []);
      setUnlimitedCranes(plan.max_cranes === null);
      setUnlimitedUsers(plan.max_users === null);
      setUnlimitedOperators(plan.max_operators === null);
      setUnlimitedClients(plan.max_clients === null);
    }
  }, [plan, form]);

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    if (!plan) return;

    const updates = {
      name: data.name,
      price: data.price,
      price_amount: data.price_amount,
      max_cranes: unlimitedCranes ? null : data.max_cranes,
      max_users: unlimitedUsers ? null : data.max_users,
      max_operators: unlimitedOperators ? null : data.max_operators,
      max_clients: unlimitedClients ? null : data.max_clients,
      icon: data.icon,
      color: data.color,
    };

    await updatePlan.mutateAsync({ id: plan.id, updates });
    await updateFeatures.mutateAsync({ planConfigId: plan.id, features });
    onOpenChange(false);
  };

  const isLoading = updatePlan.isPending || updateFeatures.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Plan: {plan?.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Plan</Label>
              <Input id="name" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Precio (texto)</Label>
              <Input
                id="price"
                placeholder="$499/mes"
                {...form.register('price')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_amount">Monto numérico</Label>
              <Input
                id="price_amount"
                type="number"
                {...form.register('price_amount')}
              />
            </div>

            <div className="space-y-2">
              <Label>Icono</Label>
              <Select
                value={form.watch('icon')}
                onValueChange={(v) => form.setValue('icon', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => form.setValue('color', opt.value)}
                    className={`w-8 h-8 rounded-full ${opt.class} ${
                      form.watch('color') === opt.value
                        ? 'ring-2 ring-offset-2 ring-primary'
                        : ''
                    }`}
                    title={opt.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <Separator />

          {/* Limits */}
          <div className="space-y-4">
            <h3 className="font-medium">Límites del Plan</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="max_cranes">Grúas</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Ilimitado
                    </span>
                    <Switch
                      checked={unlimitedCranes}
                      onCheckedChange={setUnlimitedCranes}
                    />
                  </div>
                </div>
                <Input
                  id="max_cranes"
                  type="number"
                  disabled={unlimitedCranes}
                  {...form.register('max_cranes')}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="max_users">Usuarios</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Ilimitado
                    </span>
                    <Switch
                      checked={unlimitedUsers}
                      onCheckedChange={setUnlimitedUsers}
                    />
                  </div>
                </div>
                <Input
                  id="max_users"
                  type="number"
                  disabled={unlimitedUsers}
                  {...form.register('max_users')}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="max_operators">Operadores</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Ilimitado
                    </span>
                    <Switch
                      checked={unlimitedOperators}
                      onCheckedChange={setUnlimitedOperators}
                    />
                  </div>
                </div>
                <Input
                  id="max_operators"
                  type="number"
                  disabled={unlimitedOperators}
                  {...form.register('max_operators')}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="max_clients">Clientes</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Ilimitado
                    </span>
                    <Switch
                      checked={unlimitedClients}
                      onCheckedChange={setUnlimitedClients}
                    />
                  </div>
                </div>
                <Input
                  id="max_clients"
                  type="number"
                  disabled={unlimitedClients}
                  {...form.register('max_clients')}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Features */}
          <div className="space-y-4">
            <h3 className="font-medium">Características</h3>

            <div className="flex gap-2">
              <Input
                placeholder="Agregar característica..."
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddFeature}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-muted rounded-md"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{feature}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFeature(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {features.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay características. Agrega una arriba.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

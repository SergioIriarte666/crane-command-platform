
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trialService, TrialSettings } from '@/services/trialService';
import { usePlanConfigs } from '@/hooks/usePlanConfigs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

export default function TrialConfigSettings() {
  const queryClient = useQueryClient();
  const [isActive, setIsActive] = useState(false);
  const [defaultDuration, setDefaultDuration] = useState('14');
  const [customDuration, setCustomDuration] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('basic');

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['trial-settings'],
    queryFn: trialService.getSettings,
  });

  const { data: plans, isLoading: plansLoading } = usePlanConfigs();

  useEffect(() => {
    if (settings) {
      setIsActive(settings.is_active);
      if (settings.allowed_durations.includes(settings.default_duration_days)) {
        setDefaultDuration(settings.default_duration_days.toString());
        setUseCustom(false);
      } else {
        setUseCustom(true);
        setCustomDuration(settings.default_duration_days.toString());
      }
      setSelectedPlan(settings.trial_plan || 'basic');
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (newSettings: Partial<TrialSettings>) => trialService.updateSettings(newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trial-settings'] });
      toast.success('Configuración de pruebas actualizada');
    },
    onError: (error) => {
      toast.error('Error al guardar configuración: ' + (error as Error).message);
    },
  });

  const handleSave = () => {
    const duration = useCustom ? parseInt(customDuration) : parseInt(defaultDuration);
    
    if (isNaN(duration) || duration <= 0) {
      toast.error('La duración debe ser un número positivo');
      return;
    }

    mutation.mutate({
      is_active: isActive,
      default_duration_days: duration,
      allowed_durations: [1, 3, 7, 14, 30],
      trial_plan: selectedPlan
    });
  };

  if (settingsLoading || plansLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Pruebas Gratuitas</CardTitle>
          <CardDescription>
            Gestiona la disponibilidad, duración y características de las pruebas gratuitas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="trial-active">Habilitar Pruebas Gratuitas</Label>
              <p className="text-sm text-muted-foreground">
                Permitir que los nuevos registros inicien una prueba gratuita automáticamente.
              </p>
            </div>
            <Switch
              id="trial-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <Label>Duración de la Prueba</Label>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Select
                  value={useCustom ? 'custom' : defaultDuration}
                  onValueChange={(val) => {
                    if (val === 'custom') {
                      setUseCustom(true);
                    } else {
                      setUseCustom(false);
                      setDefaultDuration(val);
                    }
                  }}
                  disabled={!isActive}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Seleccionar duración" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 día</SelectItem>
                    <SelectItem value="3">3 días</SelectItem>
                    <SelectItem value="7">7 días</SelectItem>
                    <SelectItem value="14">14 días</SelectItem>
                    <SelectItem value="30">30 días</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>

                {useCustom && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(e.target.value)}
                      className="w-[100px]"
                      placeholder="Días"
                      min="1"
                    />
                    <span className="text-sm text-muted-foreground">días</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Plan Asignado (Características)</Label>
              <Select
                value={selectedPlan}
                onValueChange={setSelectedPlan}
                disabled={!isActive}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans?.map((plan) => (
                    <SelectItem key={plan.plan_key} value={plan.plan_key}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Determina qué características estarán disponibles durante el periodo de prueba.
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

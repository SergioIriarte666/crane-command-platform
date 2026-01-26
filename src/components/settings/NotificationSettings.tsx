
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, Mail, Smartphone, Save, Loader2, AppWindow } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationsContext';
import { toast } from 'sonner';

interface NotificationSettingItem {
  id: string;
  label: string;
  description: string;
}

const notificationTypes: NotificationSettingItem[] = [
  {
    id: 'new_service',
    label: 'Nuevo Servicio',
    description: 'Cuando se crea un nuevo servicio',
  },
  {
    id: 'service_assigned',
    label: 'Servicio Asignado',
    description: 'Cuando un servicio es asignado a un operador',
  },
  {
    id: 'service_completed',
    label: 'Servicio Completado',
    description: 'Cuando un servicio se marca como completado',
  },
  {
    id: 'payment_received',
    label: 'Pago Recibido',
    description: 'Cuando se recibe un pago',
  },
  {
    id: 'invoice_overdue',
    label: 'Factura Vencida',
    description: 'Cuando una factura supera su fecha de vencimiento',
  },
  {
    id: 'document_expiring',
    label: 'Documento por Vencer',
    description: 'Licencias, permisos o seguros próximos a vencer',
  },
  {
    id: 'maintenance_due',
    label: 'Mantenimiento Programado',
    description: 'Recordatorio de mantenimiento de vehículos',
  },
  {
    id: 'low_inventory',
    label: 'Inventario Bajo',
    description: 'Cuando un artículo está por debajo del mínimo',
  },
];

export function NotificationSettings() {
  const { preferences, updatePreferences, loading } = useNotifications();
  const [saving, setSaving] = useState(false);
  
  // Local state for form
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [reminderDays, setReminderDays] = useState({
    documents: 30,
    maintenance: 7,
    invoices: 3,
  });

  useEffect(() => {
    if (preferences?.settings) {
      // Merge defaults with saved preferences
      const mergedSettings: Record<string, any> = {};
      notificationTypes.forEach(type => {
        mergedSettings[type.id] = preferences.settings[type.id] || {
          email: true,
          push: true,
          in_app: true
        };
      });
      setSettings(mergedSettings);

      if (preferences.settings.reminderDays) {
        setReminderDays(preferences.settings.reminderDays);
      }
    } else if (!loading && !preferences) {
        // Initialize defaults if no prefs exist yet
        const defaults: Record<string, any> = {};
        notificationTypes.forEach(type => {
            defaults[type.id] = { email: true, push: true, in_app: true };
        });
        setSettings(defaults);
    }
  }, [preferences, loading]);

  const handleToggle = (
    typeId: string,
    channel: 'email' | 'push' | 'in_app',
    value: boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      [typeId]: {
        ...prev[typeId],
        [channel]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePreferences({
        settings: {
          ...settings,
          reminderDays
        }
      });
      // Toast is handled in context
    } catch (error) {
      // Error handled in context
    } finally {
      setSaving(false);
    }
  };

  if (loading && !preferences) {
      return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Preferencias de Notificación</CardTitle>
              <CardDescription>
                Configura cómo y cuándo recibir notificaciones
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Header row */}
            <div className="grid grid-cols-[1fr,80px,80px,80px] gap-4 items-center pb-4 border-b">
              <div className="font-medium">Notificación</div>
              <div className="text-center">
                <Mail className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Email</span>
              </div>
              <div className="text-center">
                <Smartphone className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">Push</span>
              </div>
              <div className="text-center">
                <AppWindow className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground">In-App</span>
              </div>
            </div>

            {/* Settings rows */}
            {notificationTypes.map((type) => (
              <div
                key={type.id}
                className="grid grid-cols-[1fr,80px,80px,80px] gap-4 items-center py-2"
              >
                <div>
                  <div className="font-medium text-sm">{type.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {type.description}
                  </div>
                </div>
                <div className="flex justify-center">
                  <Switch
                    checked={settings[type.id]?.email ?? true}
                    onCheckedChange={(checked) =>
                      handleToggle(type.id, 'email', checked)
                    }
                  />
                </div>
                <div className="flex justify-center">
                  <Switch
                    checked={settings[type.id]?.push ?? true}
                    onCheckedChange={(checked) =>
                      handleToggle(type.id, 'push', checked)
                    }
                  />
                </div>
                <div className="flex justify-center">
                  <Switch
                    checked={settings[type.id]?.in_app ?? true}
                    onCheckedChange={(checked) =>
                      handleToggle(type.id, 'in_app', checked)
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t">
            <h3 className="text-sm font-medium mb-4">Configuración de Recordatorios</h3>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="doc-reminder">Vencimiento de Documentos</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="doc-reminder"
                    type="number"
                    min={1}
                    max={90}
                    value={reminderDays.documents}
                    onChange={(e) =>
                      setReminderDays({ ...reminderDays, documents: parseInt(e.target.value) || 30 })
                    }
                    className="w-20"
                  />
                  <span className="text-muted-foreground">días antes</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maint-reminder">Mantenimientos</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="maint-reminder"
                    type="number"
                    min={1}
                    max={30}
                    value={reminderDays.maintenance}
                    onChange={(e) =>
                      setReminderDays({ ...reminderDays, maintenance: parseInt(e.target.value) || 7 })
                    }
                    className="w-20"
                  />
                  <span className="text-muted-foreground">días antes</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-reminder">Facturas por Vencer</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="inv-reminder"
                    type="number"
                    min={1}
                    max={15}
                    value={reminderDays.invoices}
                    onChange={(e) =>
                      setReminderDays({ ...reminderDays, invoices: parseInt(e.target.value) || 3 })
                    }
                    className="w-20"
                  />
                  <span className="text-muted-foreground">días antes</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Preferencias
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

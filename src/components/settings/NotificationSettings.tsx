import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, Mail, MessageSquare, Smartphone, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}

const defaultSettings: NotificationSetting[] = [
  {
    id: 'new_service',
    label: 'Nuevo Servicio',
    description: 'Cuando se crea un nuevo servicio',
    email: true,
    push: true,
    sms: false,
  },
  {
    id: 'service_assigned',
    label: 'Servicio Asignado',
    description: 'Cuando un servicio es asignado a un operador',
    email: true,
    push: true,
    sms: true,
  },
  {
    id: 'service_completed',
    label: 'Servicio Completado',
    description: 'Cuando un servicio se marca como completado',
    email: true,
    push: true,
    sms: false,
  },
  {
    id: 'payment_received',
    label: 'Pago Recibido',
    description: 'Cuando se recibe un pago',
    email: true,
    push: true,
    sms: false,
  },
  {
    id: 'invoice_overdue',
    label: 'Factura Vencida',
    description: 'Cuando una factura supera su fecha de vencimiento',
    email: true,
    push: true,
    sms: false,
  },
  {
    id: 'document_expiring',
    label: 'Documento por Vencer',
    description: 'Licencias, permisos o seguros próximos a vencer',
    email: true,
    push: true,
    sms: false,
  },
  {
    id: 'maintenance_due',
    label: 'Mantenimiento Programado',
    description: 'Recordatorio de mantenimiento de vehículos',
    email: true,
    push: false,
    sms: false,
  },
  {
    id: 'low_inventory',
    label: 'Inventario Bajo',
    description: 'Cuando un artículo está por debajo del mínimo',
    email: true,
    push: false,
    sms: false,
  },
];

export function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSetting[]>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [reminderDays, setReminderDays] = useState({
    documents: 30,
    maintenance: 7,
    invoices: 3,
  });

  const handleToggle = (
    settingId: string,
    channel: 'email' | 'push' | 'sms',
    value: boolean
  ) => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === settingId ? { ...setting, [channel]: value } : setting
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate saving
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success('Preferencias de notificación guardadas');
    setSaving(false);
  };

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
                <Mail className="h-4 w-4 mx-auto text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Email</span>
              </div>
              <div className="text-center">
                <Smartphone className="h-4 w-4 mx-auto text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Push</span>
              </div>
              <div className="text-center">
                <MessageSquare className="h-4 w-4 mx-auto text-muted-foreground" />
                <span className="text-xs text-muted-foreground">SMS</span>
              </div>
            </div>

            {/* Settings rows */}
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="grid grid-cols-[1fr,80px,80px,80px] gap-4 items-center py-2"
              >
                <div>
                  <p className="font-medium">{setting.label}</p>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                </div>
                <div className="flex justify-center">
                  <Switch
                    checked={setting.email}
                    onCheckedChange={(value) => handleToggle(setting.id, 'email', value)}
                  />
                </div>
                <div className="flex justify-center">
                  <Switch
                    checked={setting.push}
                    onCheckedChange={(value) => handleToggle(setting.id, 'push', value)}
                  />
                </div>
                <div className="flex justify-center">
                  <Switch
                    checked={setting.sms}
                    onCheckedChange={(value) => handleToggle(setting.id, 'sms', value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recordatorios</CardTitle>
          <CardDescription>
            Configura con cuántos días de anticipación recibir recordatorios
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Guardar Preferencias
        </Button>
      </div>
    </div>
  );
}

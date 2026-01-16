import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Palette, Monitor, Sun, Moon, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { 
  useUserPreferences, 
  useUpdateUserPreferences, 
  applyPreferencesToDocument,
  type UserPreferences 
} from '@/hooks/useUserPreferences';

export function AppearanceSettings() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { data: savedPreferences, isLoading } = useUserPreferences();
  const updatePreferences = useUpdateUserPreferences();
  const [mounted, setMounted] = useState(false);
  const [themeInitialized, setThemeInitialized] = useState(false);
  const [localSettings, setLocalSettings] = useState<Omit<UserPreferences, 'theme'>>({
    compactMode: false,
    animations: true,
    highContrast: false,
    primaryColor: null,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (savedPreferences && !themeInitialized) {
      setLocalSettings({
        compactMode: savedPreferences.compactMode,
        animations: savedPreferences.animations,
        highContrast: savedPreferences.highContrast,
        primaryColor: savedPreferences.primaryColor,
      });
      applyPreferencesToDocument(savedPreferences);
      if (savedPreferences.theme) {
        setTheme(savedPreferences.theme);
      }
      setThemeInitialized(true);
    }
  }, [savedPreferences, setTheme, themeInitialized]);

  const handleSave = async () => {
    const newPreferences: UserPreferences = {
      theme: ((theme || resolvedTheme) as 'light' | 'dark' | 'system') || 'system',
      ...localSettings,
    };

    try {
      await updatePreferences.mutateAsync(newPreferences);
      applyPreferencesToDocument(newPreferences);
      toast.success('Preferencias de apariencia guardadas');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Error al guardar preferencias');
    }
  };

  const handleSettingChange = <K extends keyof Omit<UserPreferences, 'theme'>>(
    key: K,
    value: UserPreferences[K]
  ) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    
    // Apply preview immediately
    applyPreferencesToDocument({
      theme: ((theme || resolvedTheme) as 'light' | 'dark' | 'system') || 'system',
      ...newSettings,
    });
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Tema y Apariencia</CardTitle>
              <CardDescription>
                Personaliza la apariencia visual de la aplicación
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-4">
                <Label className="text-base">Tema de Color</Label>
                <RadioGroup
                  value={theme || resolvedTheme || 'system'}
                  onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}
                  className="grid grid-cols-3 gap-4"
                >
                  <Label
                    htmlFor="theme-light"
                    className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                      theme === 'light' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/50'
                    }`}
                  >
                    <RadioGroupItem value="light" id="theme-light" className="sr-only" />
                    <div className="w-12 h-12 rounded-full bg-white border shadow-sm flex items-center justify-center">
                      <Sun className="h-6 w-6 text-yellow-500" />
                    </div>
                    <span className="font-medium">Claro</span>
                  </Label>

                  <Label
                    htmlFor="theme-dark"
                    className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                      theme === 'dark' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/50'
                    }`}
                  >
                    <RadioGroupItem value="dark" id="theme-dark" className="sr-only" />
                    <div className="w-12 h-12 rounded-full bg-slate-900 border shadow-sm flex items-center justify-center">
                      <Moon className="h-6 w-6 text-slate-300" />
                    </div>
                    <span className="font-medium">Oscuro</span>
                  </Label>

                  <Label
                    htmlFor="theme-system"
                    className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                      theme === 'system' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/50'
                    }`}
                  >
                    <RadioGroupItem value="system" id="theme-system" className="sr-only" />
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white to-slate-900 border shadow-sm flex items-center justify-center">
                      <Monitor className="h-6 w-6 text-slate-500" />
                    </div>
                    <span className="font-medium">Sistema</span>
                  </Label>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-base">Color Primario</Label>
                <p className="text-sm text-muted-foreground">
                  Color principal para el sidebar y elementos destacados
                </p>
                <div className="flex items-center gap-3 max-w-xl">
                  <div
                    className="w-10 h-10 rounded-lg border"
                    style={{
                      background:
                        localSettings.primaryColor && localSettings.primaryColor.startsWith('#')
                          ? localSettings.primaryColor
                          : 'transparent',
                    }}
                  />
                  <input
                    type="color"
                    className="w-16 h-10 p-1 rounded-md border cursor-pointer bg-transparent"
                    value={localSettings.primaryColor || '#874efe'}
                    onChange={(e) => handleSettingChange('primaryColor', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="px-3"
                    onClick={() => handleSettingChange('primaryColor', null)}
                  >
                    Usar color de empresa
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base">Opciones de Visualización</Label>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">Modo Compacto</p>
                      <p className="text-sm text-muted-foreground">
                        Reduce el espaciado para mostrar más contenido
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.compactMode}
                      onCheckedChange={(value) => handleSettingChange('compactMode', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">Animaciones</p>
                      <p className="text-sm text-muted-foreground">
                        Habilitar transiciones y animaciones suaves
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.animations}
                      onCheckedChange={(value) => handleSettingChange('animations', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">Alto Contraste</p>
                      <p className="text-sm text-muted-foreground">
                        Mejora la legibilidad con mayor contraste
                      </p>
                    </div>
                    <Switch
                      checked={localSettings.highContrast}
                      onCheckedChange={(value) => handleSettingChange('highContrast', value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vista Previa</CardTitle>
          <CardDescription>
            Así se verá la interfaz con tus preferencias actuales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg space-y-3">
              <div className="h-4 bg-primary rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-5/6" />
              <div className="flex gap-2 mt-4">
                <div className="h-8 bg-primary rounded flex-1" />
                <div className="h-8 bg-secondary border rounded flex-1" />
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary/20 rounded-full" />
                <div className="flex-1">
                  <div className="h-3 bg-foreground/20 rounded w-24 mb-1" />
                  <div className="h-2 bg-muted-foreground/30 rounded w-32" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-muted rounded" />
                <div className="h-2 bg-muted rounded w-4/5" />
                <div className="h-2 bg-muted rounded w-3/5" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updatePreferences.isPending || isLoading}>
          {updatePreferences.isPending ? (
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

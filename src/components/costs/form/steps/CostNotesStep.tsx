import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StickyNote, CheckCircle2 } from 'lucide-react';
import { CostFormData } from '@/types/costForm';

interface CostNotesStepProps {
  formData: CostFormData;
  onChange: (field: keyof CostFormData, value: string | number | boolean) => void;
}

export function CostNotesStep({ formData, onChange }: CostNotesStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Notas y Observaciones</h3>
        <p className="text-sm text-muted-foreground">
          Agrega cualquier información adicional relevante para este costo.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-amber-600" />
            <CardTitle className="text-sm font-medium">Notas</CardTitle>
          </div>
          <CardDescription>
            Incluye detalles como número de factura, justificación del gasto, etc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => onChange('notes', e.target.value)}
            placeholder="Ej: Factura #12345 del proveedor Refaccionaria Norte. Compra urgente por falla en carretera..."
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {formData.notes.length}/500 caracteres
          </p>
        </CardContent>
      </Card>

      <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800 dark:text-green-200">
                ¡Casi listo!
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Revisa el resumen en el panel izquierdo y haz clic en "Guardar" para registrar el costo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

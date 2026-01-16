import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useInventory } from '@/hooks/useInventory';
import { useCranes } from '@/hooks/useCranes';
import { useSuppliers } from '@/hooks/useSuppliers';
import type { InventoryItem } from '@/types/inventory';
import { Loader2, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';

const formSchema = z.object({
  type: z.enum(['in', 'out', 'adjustment']),
  quantity: z.string().min(1, 'La cantidad es requerida').refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Debe ser un número mayor a 0'),
  reference_type: z.string().optional(),
  reference_id: z.string().optional(), // Used for Supplier ID, Crane ID, or Department Name
  notes: z.string().optional(),
  reason: z.string().optional(), // For specific reasons/references
});

interface InventoryMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: InventoryItem | null;
}

export function InventoryMovementModal({ isOpen, onClose, item: initialItem }: InventoryMovementModalProps) {
  const { items, createMovement } = useInventory();
  const { cranes } = useCranes();
  const { suppliers } = useSuppliers();
  const [activeType, setActiveType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [selectedItemId, setSelectedItemId] = useState<string>('');

  const item = initialItem || items.find(i => i.id === selectedItemId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'in',
      quantity: '',
      reference_type: 'supplier',
      reference_id: '',
      notes: '',
      reason: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setSelectedItemId(initialItem.id);
      } else {
        setSelectedItemId('');
      }
      setActiveType('in');
      form.reset({
        type: 'in',
        quantity: '',
        reference_type: 'supplier',
        reference_id: '',
        notes: '',
        reason: '',
      });
    }
  }, [isOpen, initialItem]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const targetItem = initialItem || items.find(i => i.id === selectedItemId);
    if (!targetItem) return;

    try {
      let finalReferenceType = values.reference_type;
      let finalReferenceId = values.reference_id;
      let finalNotes = values.notes;

      let finalQuantity = Number(values.quantity);
      
      // Logic to structure data based on type
      if (values.type === 'in') {
        // Entry: Provider is reference_id (if selected) or in notes
        finalNotes = values.reason ? `Ref: ${values.reason}. ${values.notes || ''}` : values.notes;
      } else if (values.type === 'out') {
        // Exit: Crane or Department
        finalNotes = values.reason ? `Motivo: ${values.reason}. ${values.notes || ''}` : values.notes;
      } else if (values.type === 'adjustment') {
        // Adjustment: Loss/Gain
        finalReferenceType = 'adjustment';
        finalNotes = values.reason ? `Tipo: ${values.reason}. Responsable: ${values.reference_id}. ${values.notes || ''}` : values.notes;
        
        // Negate quantity for loss/damage
        if (['loss', 'damage'].includes(values.reason || '')) {
          finalQuantity = -Math.abs(finalQuantity);
        }
      }

      await createMovement.mutateAsync({
        item_id: targetItem.id,
        type: values.type,
        quantity: finalQuantity,
        reference_type: finalReferenceType,
        reference_id: finalReferenceId,
        notes: finalNotes,
      });
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  const handleTypeChange = (value: 'in' | 'out' | 'adjustment') => {
    setActiveType(value);
    form.setValue('type', value);
    // Set defaults for reference_type based on movement type
    if (value === 'in') form.setValue('reference_type', 'supplier');
    else if (value === 'out') form.setValue('reference_type', 'crane');
    else form.setValue('reference_type', 'adjustment');
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Movimiento {item ? `- ${item.name}` : ''}</DialogTitle>
        </DialogHeader>

        {!initialItem && (
          <div className="mb-4">
            <Label className="mb-2 block">Artículo</Label>
            <Select 
              value={selectedItemId} 
              onValueChange={setSelectedItemId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar artículo..." />
              </SelectTrigger>
              <SelectContent>
                {items.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.code} - {i.name} ({i.current_stock} {i.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <Button
              variant={activeType === 'in' ? 'default' : 'outline'}
              className="rounded-l-lg border-r-0"
              onClick={() => handleTypeChange('in')}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Entrada
            </Button>
            <Button
              variant={activeType === 'out' ? 'default' : 'outline'}
              className="rounded-none border-x-0"
              onClick={() => handleTypeChange('out')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Salida
            </Button>
            <Button
              variant={activeType === 'adjustment' ? 'default' : 'outline'}
              className="rounded-r-lg border-l-0"
              onClick={() => handleTypeChange('adjustment')}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Ajuste
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Common Field: Quantity */}
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad ({item?.unit})</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ENTRADA Fields */}
            {activeType === 'in' && (
              <>
                <FormField
                  control={form.control}
                  name="reference_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proveedor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar proveedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers?.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="other">Otro / No registrado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referencia / Factura</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Factura 12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* SALIDA Fields */}
            {activeType === 'out' && (
              <>
                <FormField
                  control={form.control}
                  name="reference_type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Destino</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="crane" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Equipo (Grúa)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="department" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Departamento
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('reference_type') === 'crane' ? (
                  <FormField
                    control={form.control}
                    name="reference_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seleccionar Equipo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar grúa" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cranes?.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.unit_number} - {c.brand} {c.model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="reference_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Departamento</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar departamento" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="maintenance">Mantenimiento</SelectItem>
                            <SelectItem value="operations">Operaciones</SelectItem>
                            <SelectItem value="admin">Administración</SelectItem>
                            <SelectItem value="sales">Ventas</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Reparación preventiva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* AJUSTE Fields */}
            {activeType === 'adjustment' && (
              <>
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Ajuste</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="loss">Pérdida / Robo</SelectItem>
                          <SelectItem value="damage">Daño</SelectItem>
                          <SelectItem value="found">Hallazgo (Entrada)</SelectItem>
                          <SelectItem value="correction">Corrección de conteo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reference_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsable</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del responsable" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Adicionales</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalles adicionales..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMovement.isPending}>
                {createMovement.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Movimiento
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

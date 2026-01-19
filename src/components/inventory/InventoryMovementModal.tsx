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
import { Loader2, ArrowRight, ArrowLeft, AlertTriangle, Plus } from 'lucide-react';

const formSchema = z.object({
  type: z.enum(['in', 'out', 'adjustment']),
  quantity: z.string().min(1, 'La cantidad es requerida').refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'Debe ser un número mayor a 0'),
  reference_type: z.string().optional(),
  reference_id: z.string().optional(),
  notes: z.string().optional(),
  reason: z.string().optional(),
  location_id: z.string().min(1, 'La ubicación es requerida'),
  batch_id: z.string().optional(),
  new_batch_number: z.string().optional(),
  new_batch_expiration: z.string().optional().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, 'La fecha de vencimiento debe ser igual o posterior a hoy'),
});

interface InventoryMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: InventoryItem | null;
}

export function InventoryMovementModal({ isOpen, onClose, item: initialItem }: InventoryMovementModalProps) {
  const { items, createMovement, locations, batches, createBatch, deleteBatch } = useInventory();
  const { cranes } = useCranes();
  const { suppliers } = useSuppliers();
  const [activeType, setActiveType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);

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
      location_id: '',
      batch_id: 'none',
      new_batch_number: '',
      new_batch_expiration: '',
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
      // Set default location if available (e.g., 'Bodega Central')
      const defaultLocation = locations.find(l => l.name === 'Bodega Central')?.id || locations[0]?.id || '';
      
      form.reset({
        type: 'in',
        quantity: '',
        reference_type: 'supplier',
        reference_id: '',
        notes: '',
        reason: '',
        location_id: defaultLocation,
        batch_id: 'none',
        new_batch_number: '',
        new_batch_expiration: '',
      });
      setIsCreatingBatch(false);
    }
  }, [isOpen, initialItem, locations]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const targetItem = initialItem || items.find(i => i.id === selectedItemId);
    if (!targetItem) return;

    let createdBatchId: string | undefined = undefined;

    try {
      let finalReferenceType = values.reference_type;
      let finalReferenceId = values.reference_id;
      let finalNotes = values.notes;
      let finalQuantity = Number(values.quantity);
      let batchId = values.batch_id === 'none' ? undefined : values.batch_id;

      // Create batch if needed
      if (values.type === 'in' && isCreatingBatch && values.new_batch_number) {
        // Check for duplicate batch locally first
        const batchExists = batches.some(b => 
          b.item_id === targetItem.id && 
          b.batch_number.toLowerCase() === values.new_batch_number?.toLowerCase()
        );

        if (batchExists) {
          form.setError('new_batch_number', { 
            type: 'manual', 
            message: 'Este número de lote ya existe para este artículo' 
          });
          return;
        }

        const newBatch = await createBatch.mutateAsync({
          item_id: targetItem.id,
          batch_number: values.new_batch_number,
          expiration_date: values.new_batch_expiration || undefined,
        });
        batchId = newBatch.id;
        createdBatchId = newBatch.id;
      }
      
      // Logic to structure data based on type
      if (values.type === 'in') {
        finalNotes = values.reason ? `Ref: ${values.reason}. ${values.notes || ''}` : values.notes;
      } else if (values.type === 'out') {
        finalNotes = values.reason ? `Motivo: ${values.reason}. ${values.notes || ''}` : values.notes;
      } else if (values.type === 'adjustment') {
        finalReferenceType = 'adjustment';
        finalNotes = values.reason ? `Tipo: ${values.reason}. Responsable: ${values.reference_id}. ${values.notes || ''}` : values.notes;
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
        location_id: values.location_id,
        batch_id: batchId,
      });
      onClose();
    } catch (error) {
      console.error(error);
      if (createdBatchId) {
        try {
          await deleteBatch.mutateAsync(createdBatchId);
        } catch (rollbackError) {
          console.error('Failed to rollback batch', rollbackError);
        }
      }
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
            
            {/* Ubicación y Lote */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations?.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
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
                name="batch_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lote</FormLabel>
                    {activeType === 'in' ? (
                      <div className="flex gap-2">
                        {!isCreatingBatch ? (
                          <>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Sin Lote</SelectItem>
                                {batches?.filter(b => b.item_id === item?.id).map((b) => (
                                  <SelectItem key={b.id} value={b.id}>
                                    {b.batch_number}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => setIsCreatingBatch(true)}
                              title="Nuevo Lote"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                             type="button"
                             variant="outline"
                             className="w-full"
                             onClick={() => setIsCreatingBatch(false)}
                           >
                             Cancelar Nuevo Lote
                           </Button>
                        )}
                      </div>
                    ) : (
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Sin Lote</SelectItem>
                            {batches?.filter(b => b.item_id === item?.id).map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.batch_number}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Nuevo Lote Fields */}
            {isCreatingBatch && activeType === 'in' && (
              <div className="p-3 border rounded-md bg-muted/20 space-y-3">
                 <h4 className="text-sm font-medium">Nuevo Lote</h4>
                 <div className="grid grid-cols-2 gap-4">
                   <FormField
                      control={form.control}
                      name="new_batch_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Lote</FormLabel>
                          <FormControl>
                            <Input placeholder="Lote #123" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="new_batch_expiration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha de Vencimiento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                 </div>
              </div>
            )}

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

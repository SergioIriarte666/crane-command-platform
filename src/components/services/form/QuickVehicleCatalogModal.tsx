import { useState } from 'react';
import { useCatalogs } from '@/hooks/useCatalogs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface QuickVehicleCatalogModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (brandId: string, modelId: string, typeCode: string, brandName: string, modelName: string) => void;
  initialBrandId?: string;
}

export function QuickVehicleCatalogModal({ 
  isOpen, 
  onOpenChange, 
  onSuccess,
  initialBrandId 
}: QuickVehicleCatalogModalProps) {
  const [mode, setMode] = useState<'new_brand' | 'existing_brand'>('new_brand');
  const [brandName, setBrandName] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState(initialBrandId || '');
  const [modelName, setModelName] = useState('');
  const [vehicleTypeId, setVehicleTypeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { catalogs: brands } = useCatalogs('vehicle_brand');
  const { catalogs: vehicleTypes } = useCatalogs('vehicle_type');
  const { createCatalogItem } = useCatalogs();

  // Reset state when opening/closing or changing mode
  const handleOpenChange = (open: boolean) => {
    if (open) {
      if (initialBrandId) {
        setMode('existing_brand');
        setSelectedBrandId(initialBrandId);
      } else {
        setMode('new_brand');
        setBrandName('');
        setSelectedBrandId('');
      }
      setModelName('');
      setVehicleTypeId('');
    }
    onOpenChange(open);
  };

  const handleSubmit = async () => {
    // Validation
    if (mode === 'new_brand' && !brandName.trim()) {
      toast.error('El nombre de la marca es requerido');
      return;
    }
    if (mode === 'existing_brand' && !selectedBrandId) {
      toast.error('Debe seleccionar una marca existente');
      return;
    }
    if (!modelName.trim()) {
      toast.error('El nombre del modelo es requerido');
      return;
    }
    if (!vehicleTypeId) {
      toast.error('El tipo de vehículo es requerido');
      return;
    }

    setIsSubmitting(true);
    try {
      let targetBrandId = selectedBrandId;

      // 1. Create Brand if needed
      if (mode === 'new_brand') {
        const brandCode = brandName.toLowerCase().replace(/\s+/g, '_');
        const newBrand = await createCatalogItem.mutateAsync({
          catalog_type: 'vehicle_brand',
          name: brandName.trim(),
          code: brandCode,
          is_active: true,
        });
        targetBrandId = newBrand.id;
      }

      // 2. Create Model linked to Brand and with Type metadata
      const modelCode = modelName.toLowerCase().replace(/\s+/g, '_');
      const newModel = await createCatalogItem.mutateAsync({
        catalog_type: 'vehicle_model',
        name: modelName.trim(),
        code: modelCode,
        is_active: true,
        parent_id: targetBrandId,
        metadata: { default_vehicle_type: vehicleTypeId } // Save the Type ID
      });

      // 3. Find the Type Code to pass back
      const selectedType = vehicleTypes.find(t => t.id === vehicleTypeId);
      
      toast.success('Vehículo registrado exitosamente');
      
      if (onSuccess) {
        // Determine names
        let finalBrandName = brandName.trim();
        if (mode === 'existing_brand') {
          const existingBrand = brands.find(b => b.id === selectedBrandId);
          finalBrandName = existingBrand?.name || '';
        }

        onSuccess(
          targetBrandId, 
          newModel.id, 
          selectedType?.code || '',
          finalBrandName,
          newModel.name
        );
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating vehicle catalog:', error);
      // Toast is handled by the mutation hook, but let's be safe
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Vehículo</DialogTitle>
          <DialogDescription>
            Cree una nueva marca o añada un modelo a una marca existente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <RadioGroup 
            value={mode} 
            onValueChange={(v) => setMode(v as 'new_brand' | 'existing_brand')}
            className="flex flex-row space-x-4 mb-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new_brand" id="new_brand" />
              <Label htmlFor="new_brand">Nueva Marca</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="existing_brand" id="existing_brand" />
              <Label htmlFor="existing_brand">Marca Existente</Label>
            </div>
          </RadioGroup>

          {/* Brand Selection/Creation */}
          {mode === 'new_brand' ? (
            <div className="space-y-2">
              <Label htmlFor="brandName">Nombre de la Marca</Label>
              <Input
                id="brandName"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Ej: Tesla"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Marca</Label>
              <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar marca..." />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Model Creation */}
          <div className="space-y-2">
            <Label htmlFor="modelName">Nombre del Modelo</Label>
            <Input
              id="modelName"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="Ej: Model Y"
            />
          </div>

          {/* Type Association */}
          <div className="space-y-2">
            <Label>Tipo de Vehículo Predeterminado</Label>
            <Select value={vehicleTypeId} onValueChange={setVehicleTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo..." />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Este tipo se seleccionará automáticamente al elegir este modelo.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

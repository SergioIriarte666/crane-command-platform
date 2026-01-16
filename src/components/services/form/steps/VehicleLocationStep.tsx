import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColoredSectionCard } from '../ColoredSectionCard';
import { ServiceFormData } from '@/types/serviceForm';
import { VEHICLE_TYPES } from '@/types/services';
import { Car, MapPin, Key } from 'lucide-react';

import type { Json } from '@/integrations/supabase/types';

interface CatalogOption {
  id: string;
  name: string;
  code?: string;
  metadata?: Json | null;
  parent_id?: string | null;
}

interface VehicleLocationStepProps {
  formData: ServiceFormData;
  onChange: (data: Partial<ServiceFormData>) => void;
  brands: CatalogOption[];
  models: CatalogOption[];
  vehicleConditions: CatalogOption[];
  vehicleTypes: CatalogOption[];
  isFieldInvalid: (field: string) => boolean;
  getFieldError: (field: string) => { message: string } | undefined;
}

export function VehicleLocationStep({
  formData,
  onChange,
  brands,
  models,
  vehicleConditions,
  vehicleTypes,
  isFieldInvalid,
  getFieldError,
}: VehicleLocationStepProps) {
  // Find the brand ID from the name to filter models correctly
  const selectedBrandId = brands.find(b => b.name === formData.vehicleBrand)?.id;
  
  // Filter models by selected brand if available
  const filteredModels = selectedBrandId
    ? models.filter(m => m.parent_id === selectedBrandId || !m.parent_id)
    : models;

  // Handle model selection with auto-complete for vehicle type
  const handleModelChange = (modelId: string) => {
    if (modelId === 'none') {
      onChange({ vehicleModel: '' });
      return;
    }
    
    const selectedModel = filteredModels.find(m => m.id === modelId);
    if (selectedModel) {
      const updates: Partial<ServiceFormData> = { vehicleModel: selectedModel.name };
      
      // Auto-complete vehicle type from model metadata if available
      const metadata = selectedModel.metadata as { default_vehicle_type?: string } | null;
      if (metadata?.default_vehicle_type) {
        // The metadata stores the vehicle type ID, we need to find the code
        const vehicleTypeItem = vehicleTypes.find(vt => vt.id === metadata.default_vehicle_type);
        if (vehicleTypeItem?.code) {
          updates.vehicleType = vehicleTypeItem.code as ServiceFormData['vehicleType'];
        }
      }
      
      onChange(updates);
    } else {
      onChange({ vehicleModel: '' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Información del Vehículo */}
      <ColoredSectionCard title="Información del Vehículo" icon={<Car className="w-4 h-4" />} color="blue">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Marca</Label>
              {brands.length > 0 ? (
                <Select
                  value={brands.find(b => b.name === formData.vehicleBrand)?.id || 'none'}
                  onValueChange={(v) => {
                    const selectedBrand = brands.find(b => b.id === v);
                    onChange({ 
                      vehicleBrand: selectedBrand?.name || '',
                      vehicleModel: '' // Reset model when brand changes
                    });
                  }}
                >
                  <SelectTrigger className={isFieldInvalid('vehicleBrand') ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Seleccionar marca</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={formData.vehicleBrand}
                  onChange={(e) => onChange({ vehicleBrand: e.target.value })}
                  placeholder="Ej: Toyota"
                  className={isFieldInvalid('vehicleBrand') ? 'border-red-500' : ''}
                />
              )}
              {getFieldError('vehicleBrand') && (
                <p className="text-xs text-red-500">{getFieldError('vehicleBrand')?.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Modelo</Label>
              {models.length > 0 ? (
                <Select
                  value={filteredModels.find(m => m.name === formData.vehicleModel)?.id || 'none'}
                  onValueChange={handleModelChange}
                >
                  <SelectTrigger className={isFieldInvalid('vehicleModel') ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Seleccionar modelo</SelectItem>
                    {filteredModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={formData.vehicleModel}
                  onChange={(e) => onChange({ vehicleModel: e.target.value })}
                  placeholder="Ej: Corolla"
                  className={isFieldInvalid('vehicleModel') ? 'border-red-500' : ''}
                />
              )}
              {getFieldError('vehicleModel') && (
                <p className="text-xs text-red-500">{getFieldError('vehicleModel')?.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Patente / Placas</Label>
            <Input
              value={formData.vehiclePlates}
              onChange={(e) => onChange({ vehiclePlates: e.target.value.toUpperCase() })}
              placeholder="ABC-123"
              className={isFieldInvalid('vehiclePlates') ? 'border-red-500' : ''}
            />
            {getFieldError('vehiclePlates') && (
              <p className="text-xs text-red-500">{getFieldError('vehiclePlates')?.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Vehículo</Label>
              <Select
                value={formData.vehicleType}
                onValueChange={(v) => onChange({ vehicleType: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VEHICLE_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Condición</Label>
              <Select
                value={formData.vehicleCondition}
                onValueChange={(v) => onChange({ vehicleCondition: v as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar condición" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleConditions.length > 0 ? (
                    vehicleConditions.map((condition) => (
                      <SelectItem key={condition.id} value={condition.code || condition.id}>
                        {condition.name}
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="runs">Funciona</SelectItem>
                      <SelectItem value="not_runs">No funciona</SelectItem>
                      <SelectItem value="accident">Accidentado</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Key className="w-4 h-4 text-muted-foreground" />
            <Label htmlFor="vehicleKeys" className="flex-1 cursor-pointer">
              ¿El vehículo tiene llaves?
            </Label>
            <Switch
              id="vehicleKeys"
              checked={formData.vehicleKeys}
              onCheckedChange={(checked) => onChange({ vehicleKeys: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label>Notas del vehículo</Label>
            <Textarea
              value={formData.vehicleNotes || ''}
              onChange={(e) => onChange({ vehicleNotes: e.target.value })}
              placeholder="Observaciones sobre el estado del vehículo..."
              rows={2}
            />
          </div>
        </div>
      </ColoredSectionCard>

      {/* Ubicaciones */}
      <ColoredSectionCard title="Ubicaciones" icon={<MapPin className="w-4 h-4" />} color="green">
        <div className="space-y-4">
          {/* Origen */}
          <div className="space-y-3 p-3 border rounded-lg border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-600" />
              <Label className="font-medium text-green-700 dark:text-green-400">Origen</Label>
            </div>
            <Input
              value={formData.originAddress}
              onChange={(e) => onChange({ originAddress: e.target.value })}
              placeholder="Dirección de origen"
              className={isFieldInvalid('originAddress') ? 'border-red-500' : ''}
            />
            {getFieldError('originAddress') && (
              <p className="text-xs text-red-500">{getFieldError('originAddress')?.message}</p>
            )}
            <Input
              value={formData.originCity || ''}
              onChange={(e) => onChange({ originCity: e.target.value })}
              placeholder="Ciudad"
            />
            <Input
              value={formData.originReferences || ''}
              onChange={(e) => onChange({ originReferences: e.target.value })}
              placeholder="Referencias (ej: frente a estación de servicio)"
            />
          </div>

          {/* Destino */}
          <div className="space-y-3 p-3 border rounded-lg border-red-200 bg-red-50/50 dark:bg-red-950/20">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-600" />
              <Label className="font-medium text-red-700 dark:text-red-400">Destino</Label>
            </div>
            <Input
              value={formData.destinationAddress}
              onChange={(e) => onChange({ destinationAddress: e.target.value })}
              placeholder="Dirección de destino"
              className={isFieldInvalid('destinationAddress') ? 'border-red-500' : ''}
            />
            {getFieldError('destinationAddress') && (
              <p className="text-xs text-red-500">{getFieldError('destinationAddress')?.message}</p>
            )}
            <Input
              value={formData.destinationCity || ''}
              onChange={(e) => onChange({ destinationCity: e.target.value })}
              placeholder="Ciudad"
            />
            <Input
              value={formData.destinationReferences || ''}
              onChange={(e) => onChange({ destinationReferences: e.target.value })}
              placeholder="Referencias"
            />
          </div>
        </div>
      </ColoredSectionCard>
    </div>
  );
}

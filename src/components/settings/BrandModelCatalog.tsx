import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Car, Truck } from 'lucide-react';
import { useCatalogs, CatalogItem } from '@/hooks/useCatalogs';

interface FormData {
  code: string;
  name: string;
  description: string;
  parent_id: string | null;
  vehicle_type: string;
}

type DialogMode = 'brand' | 'model' | null;

// Default vehicle types as fallback
const DEFAULT_VEHICLE_TYPES = [
  { id: 'auto', code: 'AUTO', name: 'Automóvil' },
  { id: 'camioneta', code: 'CAMIONETA', name: 'Camioneta' },
  { id: 'suv', code: 'SUV', name: 'SUV' },
  { id: 'moto', code: 'MOTO', name: 'Motocicleta' },
  { id: 'camion', code: 'CAMION', name: 'Camión' },
  { id: 'bus', code: 'BUS', name: 'Bus' },
  { id: 'furgon', code: 'FURGON', name: 'Furgón' },
];

export function BrandModelCatalog() {
  const { 
    catalogsByType, 
    isLoading,
    createCatalogItem, 
    updateCatalogItem, 
    deleteCatalogItem, 
    toggleCatalogItem 
  } = useCatalogs();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<CatalogItem | null>(null);
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    description: '',
    parent_id: null,
    vehicle_type: '',
  });

  const brands = catalogsByType['vehicle_brand'] || [];
  const models = catalogsByType['vehicle_model'] || [];

  // Group models by brand
  const modelsByBrand = models.reduce((acc, model) => {
    const brandId = model.parent_id || 'unassigned';
    if (!acc[brandId]) {
      acc[brandId] = [];
    }
    acc[brandId].push(model);
    return acc;
  }, {} as Record<string, CatalogItem[]>);

  const toggleBrandExpanded = (brandId: string) => {
    const newExpanded = new Set(expandedBrands);
    if (newExpanded.has(brandId)) {
      newExpanded.delete(brandId);
    } else {
      newExpanded.add(brandId);
    }
    setExpandedBrands(newExpanded);
  };

  // Get vehicle types from catalog or use defaults
  const vehicleTypes = useMemo(() => {
    const catalogVehicleTypes = catalogsByType['vehicle_type'] || [];
    if (catalogVehicleTypes.length > 0) {
      return catalogVehicleTypes.filter(vt => vt.is_active).map(vt => ({
        id: vt.id,
        code: vt.code,
        name: vt.name,
      }));
    }
    return DEFAULT_VEHICLE_TYPES;
  }, [catalogsByType]);

  // Helper to get vehicle type name by id or code
  const getVehicleTypeName = (typeIdOrCode: string | null | undefined) => {
    if (!typeIdOrCode) return null;
    const found = vehicleTypes.find(vt => vt.id === typeIdOrCode || vt.code === typeIdOrCode);
    return found?.name || typeIdOrCode;
  };

  const handleOpenCreateBrand = () => {
    setDialogMode('brand');
    setEditingItem(null);
    setFormData({ code: '', name: '', description: '', parent_id: null, vehicle_type: '' });
    setIsDialogOpen(true);
  };

  const handleOpenCreateModel = (brandId?: string) => {
    setDialogMode('model');
    setEditingItem(null);
    setFormData({ code: '', name: '', description: '', parent_id: brandId || null, vehicle_type: '' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: CatalogItem, mode: DialogMode) => {
    setDialogMode(mode);
    setEditingItem(item);
    // Extract vehicle_type from metadata for models
    const metadata = item.metadata as { default_vehicle_type?: string } | null;
    const vehicleType = metadata?.default_vehicle_type || '';
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || '',
      parent_id: item.parent_id,
      vehicle_type: vehicleType,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (item: CatalogItem) => {
    setDeletingItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!dialogMode || !formData.code || !formData.name) return;
    
    // For models, vehicle_type is required
    if (dialogMode === 'model' && !formData.vehicle_type) return;

    const catalogType = dialogMode === 'brand' ? 'vehicle_brand' : 'vehicle_model';

    if (editingItem) {
      await updateCatalogItem.mutateAsync({
        id: editingItem.id,
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        parent_id: dialogMode === 'model' ? formData.parent_id : null,
        metadata: dialogMode === 'model' ? { default_vehicle_type: formData.vehicle_type } : undefined,
      });
    } else {
      await createCatalogItem.mutateAsync({
        catalog_type: catalogType,
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        parent_id: dialogMode === 'model' ? formData.parent_id : undefined,
        metadata: dialogMode === 'model' ? { default_vehicle_type: formData.vehicle_type } : undefined,
      });
    }

    setIsDialogOpen(false);
    setFormData({ code: '', name: '', description: '', parent_id: null, vehicle_type: '' });
    setEditingItem(null);
    setDialogMode(null);
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    await deleteCatalogItem.mutateAsync(deletingItem.id);
    setIsDeleteDialogOpen(false);
    setDeletingItem(null);
  };

  const handleToggle = async (item: CatalogItem) => {
    await toggleCatalogItem.mutateAsync({ id: item.id, is_active: !item.is_active });
  };

  const unassignedModels = modelsByBrand['unassigned'] || [];

  return (
    <div className="border rounded-lg p-4 bg-muted/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Car className="h-5 w-5 text-primary" />
          <div>
            <h4 className="font-medium">Marcas y Modelos de Vehículo</h4>
            <p className="text-sm text-muted-foreground">
              {brands.length} marcas, {models.length} modelos
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleOpenCreateBrand}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva Marca
          </Button>
          <Button size="sm" onClick={() => handleOpenCreateModel()}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Modelo
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {brands.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay marcas configuradas. Crea una marca primero para poder agregar modelos.
          </div>
        ) : (
          brands.map((brand) => {
            const brandModels = modelsByBrand[brand.id] || [];
            const isExpanded = expandedBrands.has(brand.id);

            return (
              <Collapsible
                key={brand.id}
                open={isExpanded}
                onOpenChange={() => toggleBrandExpanded(brand.id)}
              >
                <div className="border rounded-lg bg-background">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 rounded-t-lg">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{brand.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {brand.code}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {brandModels.length} modelos
                          </Badge>
                          {!brand.is_active && (
                            <Badge variant="destructive" className="text-xs">
                              Inactivo
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={brand.is_active ?? false}
                          onCheckedChange={() => handleToggle(brand)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(brand, 'brand')}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(brand)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenCreateModel(brand.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t px-3 pb-3">
                      {brandModels.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground text-sm">
                          No hay modelos para esta marca.
                          <Button
                            variant="link"
                            size="sm"
                            className="ml-1"
                            onClick={() => handleOpenCreateModel(brand.id)}
                          >
                            Agregar modelo
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-2 space-y-1">
                          {brandModels.map((model) => {
                            const modelMetadata = model.metadata as { default_vehicle_type?: string } | null;
                            const vehicleTypeName = getVehicleTypeName(modelMetadata?.default_vehicle_type);
                            
                            return (
                            <div
                              key={model.id}
                              className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/50"
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-muted-foreground">└</span>
                                <span>{model.name}</span>
                                <Badge variant="outline" className="text-xs font-mono">
                                  {model.code}
                                </Badge>
                                {vehicleTypeName && (
                                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                    <Truck className="h-3 w-3" />
                                    {vehicleTypeName}
                                  </Badge>
                                )}
                                {model.description && (
                                  <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                    {model.description}
                                  </span>
                                )}
                                {!model.is_active && (
                                  <Badge variant="destructive" className="text-xs">
                                    Inactivo
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Switch
                                  checked={model.is_active ?? false}
                                  onCheckedChange={() => handleToggle(model)}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenEdit(model, 'model')}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenDelete(model)}
                                >
                                <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          )})}
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })
        )}

        {/* Show unassigned models if any */}
        {unassignedModels.length > 0 && (
          <div className="border rounded-lg bg-background p-3 mt-4">
            <div className="flex items-center gap-2 mb-2 text-amber-600">
              <span className="font-medium">⚠️ Modelos sin marca asignada</span>
              <Badge variant="outline">{unassignedModels.length}</Badge>
            </div>
            <div className="space-y-1">
              {unassignedModels.map((model) => (
                <div
                  key={model.id}
                  className="flex items-center justify-between py-2 px-3 rounded hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <span>{model.name}</span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {model.code}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEdit(model, 'model')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDelete(model)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem 
                ? `Editar ${dialogMode === 'brand' ? 'Marca' : 'Modelo'}`
                : `Nueva ${dialogMode === 'brand' ? 'Marca' : 'Modelo'}`
              }
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'brand' 
                ? 'Las marcas agrupan los modelos de vehículos'
                : 'Los modelos pertenecen a una marca específica'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {dialogMode === 'model' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="parent">Marca *</Label>
                  <Select
                    value={formData.parent_id || ''}
                    onValueChange={(value) => setFormData({ ...formData, parent_id: value || null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicle_type">Tipo de Vehículo *</Label>
                  <Select
                    value={formData.vehicle_type}
                    onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    El tipo de vehículo asociado a este modelo
                  </p>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder={dialogMode === 'brand' ? 'Ej: TOYOTA, FORD' : 'Ej: COROLLA, F150'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={dialogMode === 'brand' ? 'Ej: Toyota, Ford' : 'Ej: Corolla, F-150'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.code || 
                !formData.name || 
                (dialogMode === 'model' && (!formData.parent_id || !formData.vehicle_type)) ||
                createCatalogItem.isPending || 
                updateCatalogItem.isPending
              }
            >
              {editingItem ? 'Guardar Cambios' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar elemento?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar "{deletingItem?.name}". 
              {deletingItem?.catalog_type === 'vehicle_brand' && (
                <span className="block mt-2 text-amber-600">
                  ⚠️ Los modelos asociados a esta marca quedarán sin asignar.
                </span>
              )}
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

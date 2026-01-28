import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  Plus, 
  Pencil, 
  Trash2, 
  Users, 
  Truck, 
  UserCog, 
  Package, 
  Wrench, 
  ClipboardList, 
  DollarSign,
  ChevronRight,
  Search,
  Tag,
  ToggleLeft,
  Settings2,
  Car
} from 'lucide-react';
import { useCatalogs, CATALOG_TYPES, CatalogItem, CatalogType } from '@/hooks/useCatalogs';
import { BrandModelCatalog } from './BrandModelCatalog';
import { StatusCatalogCard } from './StatusCatalogCard';
import { cn } from '@/lib/utils';
import { Flag } from 'lucide-react';

const MODULE_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  'Clientes': { icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/30' },
  'Grúas': { icon: Truck, color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950/30' },
  'Operadores': { icon: UserCog, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950/30' },
  'Proveedores': { icon: Package, color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-950/30' },
  'Inventario': { icon: Wrench, color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/30' },
  'Servicios': { icon: ClipboardList, color: 'text-cyan-600', bgColor: 'bg-cyan-50 dark:bg-cyan-950/30' },
  'Vehículos': { icon: Car, color: 'text-slate-600', bgColor: 'bg-slate-50 dark:bg-slate-950/30' },
  'Costos': { icon: DollarSign, color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30' },
  'Facturación': { icon: ClipboardList, color: 'text-violet-600', bgColor: 'bg-violet-50 dark:bg-violet-950/30' },
  'Estados': { icon: Flag, color: 'text-indigo-600', bgColor: 'bg-indigo-50 dark:bg-indigo-950/30' },
};

// Catalog types that should be excluded from regular rendering (handled separately)
const EXCLUDED_CATALOG_TYPES = ['vehicle_brand', 'vehicle_model', 'service_status', 'closure_status', 'invoice_status'];

interface CatalogFormData {
  code: string;
  name: string;
  description: string;
}

export function CatalogSettings() {
  const { catalogsByType, isLoading, createCatalogItem, updateCatalogItem, deleteCatalogItem, toggleCatalogItem } = useCatalogs();
  
  const [selectedModule, setSelectedModule] = useState<string>('Clientes');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCatalogType, setSelectedCatalogType] = useState<CatalogType | null>(null);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<CatalogItem | null>(null);
  const [formData, setFormData] = useState<CatalogFormData>({
    code: '',
    name: '',
    description: '',
  });

  // Group catalog types by module, excluding brand/model (handled separately)
  const catalogsByModule = Object.entries(CATALOG_TYPES).reduce((acc, [key, value]) => {
    if (EXCLUDED_CATALOG_TYPES.includes(key)) return acc;
    
    if (!acc[value.module]) {
      acc[value.module] = [];
    }
    acc[value.module].push({ type: key as CatalogType, label: value.label });
    return acc;
  }, {} as Record<string, Array<{ type: CatalogType; label: string }>>);

  // Include all modules from MODULE_CONFIG (including Estados which may have no items in catalogsByModule)
  const modules = Object.keys(MODULE_CONFIG);

  const handleOpenCreate = (catalogType: CatalogType) => {
    setSelectedCatalogType(catalogType);
    setEditingItem(null);
    setFormData({ code: '', name: '', description: '' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: CatalogItem) => {
    setSelectedCatalogType(item.catalog_type as CatalogType);
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (item: CatalogItem) => {
    setDeletingItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedCatalogType || !formData.code || !formData.name) return;

    if (editingItem) {
      await updateCatalogItem.mutateAsync({
        id: editingItem.id,
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
      });
    } else {
      await createCatalogItem.mutateAsync({
        catalog_type: selectedCatalogType,
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
      });
    }

    setIsDialogOpen(false);
    setFormData({ code: '', name: '', description: '' });
    setEditingItem(null);
    setSelectedCatalogType(null);
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

  // Get total items count for a module
  const getModuleItemCount = (module: string) => {
    // Special case for Estados module - count status types separately
    if (module === 'Estados') {
      const serviceStatuses = (catalogsByType['service_status'] || []).length;
      const closureStatuses = (catalogsByType['closure_status'] || []).length;
      const invoiceStatuses = (catalogsByType['invoice_status'] || []).length;
      return serviceStatuses + closureStatuses + invoiceStatuses;
    }
    const types = catalogsByModule[module] || [];
    return types.reduce((sum, { type }) => sum + (catalogsByType[type]?.length || 0), 0);
  };

  // Filter items based on search
  const filterItems = (items: CatalogItem[]) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.code.toLowerCase().includes(query)
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentModuleConfig = MODULE_CONFIG[selectedModule] || MODULE_CONFIG['Clientes'];
  const CurrentModuleIcon = currentModuleConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Settings2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Catálogos del Sistema</CardTitle>
              <CardDescription>
                Administra las opciones y categorías disponibles en cada módulo
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Module Navigation */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Módulos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <nav className="space-y-1">
              {modules.map((module) => {
                const config = MODULE_CONFIG[module] || MODULE_CONFIG['Clientes'];
                const Icon = config.icon;
                const itemCount = getModuleItemCount(module);
                const isSelected = selectedModule === module;
                
                return (
                  <button
                    key={module}
                    onClick={() => setSelectedModule(module)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all",
                      isSelected 
                        ? `${config.bgColor} ${config.color} font-medium` 
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("h-4 w-4", isSelected && config.color)} />
                      <span className="text-sm">{module}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={isSelected ? "default" : "secondary"} 
                        className={cn(
                          "text-xs h-5 min-w-[1.25rem] justify-center",
                          isSelected && "bg-background/80 text-foreground"
                        )}
                      >
                        {itemCount}
                      </Badge>
                      {isSelected && <ChevronRight className="h-4 w-4" />}
                    </div>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Main Content - Catalog Types for Selected Module */}
        <div className="lg:col-span-3 space-y-4">
          {/* Module Header with Search */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", currentModuleConfig.bgColor)}>
                    <CurrentModuleIcon className={cn("h-5 w-5", currentModuleConfig.color)} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">{selectedModule}</h2>
                    <p className="text-sm text-muted-foreground">
                      {catalogsByModule[selectedModule]?.length || 0} catálogos configurables
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar elementos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Special handling for Vehículos module - BrandModelCatalog */}
          {selectedModule === 'Vehículos' && (
            <BrandModelCatalog />
          )}

          {/* Special handling for Estados module - StatusCatalogCards */}
          {selectedModule === 'Estados' && (
            <div className="space-y-4">
              <StatusCatalogCard 
                catalogType="service_status" 
                title="Estados de Servicio" 
                description="Configura los estados del flujo de servicios"
              />
              <StatusCatalogCard 
                catalogType="closure_status" 
                title="Estados de Cierre" 
                description="Configura los estados del flujo de cierres de facturación"
              />
              <StatusCatalogCard 
                catalogType="invoice_status" 
                title="Estados de Factura" 
                description="Configura los estados del flujo de facturas"
              />
            </div>
          )}

          {/* Catalog Cards */}
          <div className="grid grid-cols-1 gap-4">
            {catalogsByModule[selectedModule]?.map(({ type, label }) => {
              const items = catalogsByType[type] || [];
              const filteredItems = filterItems(items);
              const activeCount = items.filter(i => i.is_active).length;
              
              return (
                <Card key={type} className="overflow-hidden">
                  <CardHeader className="pb-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Tag className={cn("h-4 w-4", currentModuleConfig.color)} />
                        <div>
                          <CardTitle className="text-base">{label}</CardTitle>
                          <CardDescription className="text-xs">
                            {activeCount} activos de {items.length} elementos
                          </CardDescription>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleOpenCreate(type)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    {filteredItems.length > 0 ? (
                      <ScrollArea className={filteredItems.length > 6 ? "h-64" : undefined}>
                        <div className="space-y-2">
                          {filteredItems.map((item) => (
                            <div
                              key={item.id}
                              className={cn(
                                "group flex items-center justify-between p-3 rounded-lg border transition-all",
                                item.is_active 
                                  ? "bg-background hover:bg-muted/50" 
                                  : "bg-muted/30 opacity-60"
                              )}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={cn(
                                  "w-2 h-2 rounded-full shrink-0",
                                  item.is_active ? "bg-green-500" : "bg-gray-300"
                                )} />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium truncate">{item.name}</span>
                                    <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                      {item.code}
                                    </code>
                                  </div>
                                  {item.description && (
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleToggle(item)}
                                  title={item.is_active ? "Desactivar" : "Activar"}
                                >
                                  <ToggleLeft className={cn(
                                    "h-4 w-4",
                                    item.is_active ? "text-green-600" : "text-muted-foreground"
                                  )} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleOpenEdit(item)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => handleOpenDelete(item)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : searchQuery ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No se encontraron resultados para "{searchQuery}"</p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay elementos configurados</p>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="mt-1"
                          onClick={() => handleOpenCreate(type)}
                        >
                          Agregar el primero
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Elemento' : 'Nuevo Elemento'}
            </DialogTitle>
            <DialogDescription>
              {selectedCatalogType && CATALOG_TYPES[selectedCatalogType]?.label}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="Ej: MORAL, TIPO_A, etc."
              />
              <p className="text-xs text-muted-foreground">
                Identificador único usado internamente
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre visible en el sistema"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional para más contexto"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.code || !formData.name || createCatalogItem.isPending || updateCatalogItem.isPending}
            >
              {editingItem ? 'Guardar Cambios' : 'Crear Elemento'}
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
              Estás a punto de eliminar <strong>"{deletingItem?.name}"</strong>. 
              Esta acción no se puede deshacer y puede afectar registros existentes que usen este valor.
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

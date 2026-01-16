import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Plus, Pencil, Trash2, GripVertical, ToggleLeft, Flag } from 'lucide-react';
import { useCatalogs, CatalogItem, CatalogType } from '@/hooks/useCatalogs';
import { cn } from '@/lib/utils';
import type { Json } from '@/integrations/supabase/types';

interface StatusMetadata {
  color: string;
  bgColor: string;
  textColor: string;
  isFinal: boolean;
}

const DEFAULT_COLORS = [
  { color: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-700', label: 'Gris' },
  { color: '#3b82f6', bgColor: 'bg-blue-100', textColor: 'text-blue-700', label: 'Azul' },
  { color: '#22c55e', bgColor: 'bg-green-100', textColor: 'text-green-700', label: 'Verde' },
  { color: '#eab308', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700', label: 'Amarillo' },
  { color: '#f97316', bgColor: 'bg-orange-100', textColor: 'text-orange-700', label: 'Naranja' },
  { color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-700', label: 'Rojo' },
  { color: '#8b5cf6', bgColor: 'bg-purple-100', textColor: 'text-purple-700', label: 'Púrpura' },
  { color: '#06b6d4', bgColor: 'bg-cyan-100', textColor: 'text-cyan-700', label: 'Cyan' },
];

interface StatusFormData {
  code: string;
  name: string;
  description: string;
  sortOrder: number;
  color: string;
  bgColor: string;
  textColor: string;
  isFinal: boolean;
}

interface StatusCatalogCardProps {
  catalogType: CatalogType;
  title: string;
  description: string;
}

export function StatusCatalogCard({ catalogType, title, description }: StatusCatalogCardProps) {
  const { catalogsByType, createCatalogItem, updateCatalogItem, deleteCatalogItem, toggleCatalogItem } = useCatalogs(catalogType);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<CatalogItem | null>(null);
  const [formData, setFormData] = useState<StatusFormData>({
    code: '',
    name: '',
    description: '',
    sortOrder: 1,
    color: '#6b7280',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    isFinal: false,
  });

  const items = catalogsByType[catalogType] || [];

  const parseMetadata = (metadata: Json | null): StatusMetadata => {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return { color: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-700', isFinal: false };
    }
    const m = metadata as Record<string, unknown>;
    return {
      color: (m.color as string) || '#6b7280',
      bgColor: (m.bgColor as string) || 'bg-gray-100',
      textColor: (m.textColor as string) || 'text-gray-700',
      isFinal: (m.isFinal as boolean) || false,
    };
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      sortOrder: items.length + 1,
      color: '#6b7280',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      isFinal: false,
    });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (item: CatalogItem) => {
    const meta = parseMetadata(item.metadata);
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || '',
      sortOrder: item.sort_order || 1,
      color: meta.color,
      bgColor: meta.bgColor,
      textColor: meta.textColor,
      isFinal: meta.isFinal,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (item: CatalogItem) => {
    setDeletingItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleColorSelect = (colorConfig: typeof DEFAULT_COLORS[0]) => {
    setFormData(prev => ({
      ...prev,
      color: colorConfig.color,
      bgColor: colorConfig.bgColor,
      textColor: colorConfig.textColor,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.code || !formData.name) return;

    const metadata: StatusMetadata = {
      color: formData.color,
      bgColor: formData.bgColor,
      textColor: formData.textColor,
      isFinal: formData.isFinal,
    };

    if (editingItem) {
      await updateCatalogItem.mutateAsync({
        id: editingItem.id,
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        sort_order: formData.sortOrder,
        metadata: metadata as unknown as Json,
      });
    } else {
      await createCatalogItem.mutateAsync({
        catalog_type: catalogType,
        code: formData.code,
        name: formData.name,
        description: formData.description || undefined,
        sort_order: formData.sortOrder,
        metadata: metadata as unknown as Json,
      });
    }

    setIsDialogOpen(false);
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

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Flag className="h-4 w-4 text-indigo-600" />
              <div>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription className="text-xs">{description}</CardDescription>
              </div>
            </div>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {items.length > 0 ? (
            <ScrollArea className={items.length > 6 ? "h-64" : undefined}>
              <div className="space-y-2">
                {items.map((item) => {
                  const meta = parseMetadata(item.metadata);
                  return (
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
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <Badge 
                          className="border-none text-white"
                          style={{ backgroundColor: meta.color }}
                        >
                          {item.name}
                        </Badge>
                        <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {item.code}
                        </code>
                        {meta.isFinal && (
                          <Badge variant="outline" className="text-xs">
                            Final
                          </Badge>
                        )}
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
                  );
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Flag className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay estados configurados</p>
              <Button 
                variant="link" 
                size="sm" 
                className="mt-1"
                onClick={handleOpenCreate}
              >
                Agregar el primero
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Estado' : 'Nuevo Estado'}
            </DialogTitle>
            <DialogDescription>
              Configura el estado con su color y propiedades
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Preview */}
            <div className="p-4 bg-muted/50 rounded-lg border">
              <p className="text-xs text-muted-foreground mb-2">Vista previa:</p>
              <Badge 
                className="border-none text-white"
                style={{ backgroundColor: formData.color }}
              >
                {formData.name || 'Nombre del Estado'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="ej: in_progress"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ej: En Proceso"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción opcional..."
              />
            </div>

            <div className="space-y-2">
              <Label>Color del Estado</Label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_COLORS.map((colorConfig) => (
                  <button
                    key={colorConfig.color}
                    type="button"
                    onClick={() => handleColorSelect(colorConfig)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      formData.color === colorConfig.color 
                        ? "border-foreground scale-110" 
                        : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: colorConfig.color }}
                    title={colorConfig.label}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Orden</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min={1}
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  id="isFinal"
                  checked={formData.isFinal}
                  onCheckedChange={(checked) => setFormData({ ...formData, isFinal: checked })}
                />
                <Label htmlFor="isFinal" className="cursor-pointer">
                  Estado Final
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.code || !formData.name}
            >
              {editingItem ? 'Guardar Cambios' : 'Crear Estado'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este estado?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El estado "{deletingItem?.name}" será eliminado.
              <br /><br />
              <strong>Nota:</strong> Si hay registros usando este estado, podrían quedar inconsistentes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package, Search, Filter, MoreVertical, Pencil, Trash2, Eye, ArrowUpCircle, ArrowDownCircle, AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QueryErrorState } from '@/components/common/QueryErrorState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useInventory } from '@/hooks/useInventory';
import { InventoryReports } from '@/components/inventory/InventoryReports';
import { InventoryMovementModal } from '@/components/inventory/InventoryMovementModal';
import { 
  INVENTORY_CATEGORIES, 
  INVENTORY_UNITS, 
  getStockStatus, 
  getStockStatusConfig,
  formatCurrency 
} from '@/types/inventory';
import type { InventoryCategory, InventoryUnit, MovementType } from '@/types/inventory';
import { format } from 'date-fns';

export default function InventoryPage() {
  const { items, isLoading, error, refetch, deleteItem, createMovement } = useInventory();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // New Modal State
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<typeof items[0] | null>(null);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    
    const status = getStockStatus(item);
    const matchesStock = stockFilter === 'all' || status === stockFilter;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const lowStockCount = items.filter(i => ['low', 'critical'].includes(getStockStatus(i))).length;

  const handleDelete = async () => {
    if (deleteId) {
      await deleteItem.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleOpenMovement = (item: typeof items[0] | null = null) => {
    setSelectedItem(item);
    setIsMovementModalOpen(true);
  };

  const handleExport = () => {
    const headers = ['Código', 'Nombre', 'Categoría', 'Stock', 'Unidad', 'Costo Unit.', 'Valor Total', 'Ubicación', 'Estado'];
    const csvContent = [
      headers.join(','),
      ...filteredItems.map(item => {
        const totalValue = (item.current_stock || 0) * (item.unit_cost || 0);
        const status = getStockStatus(item);
        const statusLabel = getStockStatusConfig(status).label;
        const categoryLabel = INVENTORY_CATEGORIES[item.category as InventoryCategory]?.label || item.category;
        
        return [
          `"${item.code}"`,
          `"${item.name}"`,
          `"${categoryLabel}"`,
          item.current_stock,
          item.unit,
          item.unit_cost,
          totalValue,
          `"${item.location || ''}"`,
          `"${statusLabel}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventario_stock_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <QueryErrorState
        title="No se pudo cargar el inventario"
        description="Hubo un problema al obtener la lista de artículos."
        error={error}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground">
            {items.length} artículos registrados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="secondary" onClick={() => handleOpenMovement()}>
            <ArrowUpCircle className="w-4 h-4 mr-2" />
            Movimiento Rápido
          </Button>
          <Button asChild>
            <Link to="/inventario/nuevo">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Artículo
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          {/* Alert for low stock */}
      {lowStockCount > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>{lowStockCount}</strong> artículo(s) con stock bajo o crítico
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto"
              onClick={() => setStockFilter('critical')}
            >
              Ver críticos
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, código o código de barras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {Object.entries(INVENTORY_CATEGORIES).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.icon} {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo el stock</SelectItem>
            <SelectItem value="ok">Normal</SelectItem>
            <SelectItem value="low">Bajo</SelectItem>
            <SelectItem value="critical">Crítico</SelectItem>
            <SelectItem value="over">Exceso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No hay artículos</h3>
            <p className="text-muted-foreground text-center max-w-sm mt-1">
              {search || categoryFilter !== 'all' || stockFilter !== 'all'
                ? 'No se encontraron artículos con los filtros aplicados.'
                : 'Comienza agregando tu primer artículo al inventario.'}
            </p>
            {!search && categoryFilter === 'all' && stockFilter === 'all' && (
              <Button asChild className="mt-4">
                <Link to="/inventario/nuevo">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Artículo
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Costo Unit.</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const categoryConfig = INVENTORY_CATEGORIES[item.category as InventoryCategory];
                const unitLabel = INVENTORY_UNITS[item.unit as InventoryUnit];
                const status = getStockStatus(item);
                const statusConfig = getStockStatusConfig(status);
                const totalValue = (item.current_stock || 0) * (item.unit_cost || 0);

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.code}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        {item.location && (
                          <p className="text-xs text-muted-foreground">📍 {item.location}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {categoryConfig.icon} {categoryConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.current_stock} {unitLabel}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unit_cost)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(totalValue)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/inventario/${item.id}`}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalle
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleOpenMovement(item)}>
                            <ArrowUpCircle className="w-4 h-4 mr-2 text-blue-600" />
                            Registrar Movimiento
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link to={`/inventario/${item.id}/editar`}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(item.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

        </TabsContent>

        <TabsContent value="reports">
          <InventoryReports />
        </TabsContent>
      </Tabs>

      <InventoryMovementModal 
        isOpen={isMovementModalOpen} 
        onClose={() => {
          setIsMovementModalOpen(false);
          setSelectedItem(null);
        }} 
        item={selectedItem}
      />

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar artículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los movimientos
              asociados a este artículo.
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

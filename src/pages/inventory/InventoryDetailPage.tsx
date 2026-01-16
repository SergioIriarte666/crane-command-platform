import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInventory } from '@/hooks/useInventory';
import { useCranes } from '@/hooks/useCranes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Package, 
  Pencil, 
  ArrowUpCircle, 
  Truck, 
  Building2, 
  Calendar,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { InventoryMovementModal } from '@/components/inventory/InventoryMovementModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  INVENTORY_CATEGORIES, 
  INVENTORY_UNITS, 
  getStockStatus, 
  getStockStatusConfig,
  formatCurrency,
  InventoryCategory,
  InventoryUnit
} from '@/types/inventory';

export default function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { items, movements, isLoading } = useInventory();
  const { cranes } = useCranes();
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);

  const item = items.find(i => i.id === id);
  const itemMovements = movements.filter(m => m.item_id === id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Package className="w-16 h-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Artículo no encontrado</h1>
        <Button onClick={() => navigate('/inventario')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Inventario
        </Button>
      </div>
    );
  }

  const categoryConfig = INVENTORY_CATEGORIES[item.category as InventoryCategory];
  const unitLabel = INVENTORY_UNITS[item.unit as InventoryUnit];
  const status = getStockStatus(item);
  const statusConfig = getStockStatusConfig(status);
  const totalValue = (item.current_stock || 0) * (item.unit_cost || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/inventario')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
              <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                {statusConfig.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-mono text-sm">{item.code}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-sm">
                {categoryConfig.icon} {categoryConfig.label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="secondary" className="flex-1 sm:flex-none" onClick={() => setIsMovementModalOpen(true)}>
            <ArrowUpCircle className="w-4 h-4 mr-2" />
            Registrar Movimiento
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => navigate(`/inventario/${item.id}/editar`)}>
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Actual</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {item.current_stock} <span className="text-sm font-normal text-muted-foreground">{unitLabel}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Mínimo requerido: {item.min_stock} {unitLabel}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <span className="font-bold text-muted-foreground">$</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Costo unitario: {formatCurrency(item.unit_cost)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ubicación</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {item.location || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Almacén Principal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimientos (Mes)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {itemMovements.filter(m => {
                const date = new Date(m.created_at || '');
                const now = new Date();
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Operaciones registradas
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="movements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="movements">Historial de Movimientos</TabsTrigger>
          <TabsTrigger value="details">Detalles del Artículo</TabsTrigger>
        </TabsList>

        <TabsContent value="movements">
          <Card>
            <CardHeader>
              <CardTitle>Historial Completo</CardTitle>
            </CardHeader>
            <CardContent>
              {itemMovements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay movimientos registrados para este artículo.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Referencia/Destino</TableHead>
                      <TableHead>Notas</TableHead>
                      <TableHead className="text-right">Usuario</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemMovements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(movement.created_at || ''), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            movement.type === 'in' ? 'bg-green-100 text-green-700' : 
                            movement.type === 'out' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {movement.type === 'in' ? 'Entrada' : movement.type === 'out' ? 'Salida' : 'Ajuste'}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          {movement.quantity} {unitLabel}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {movement.reference_type === 'crane' && cranes?.find(c => c.id === movement.reference_id)?.unit_number}
                          {movement.reference_type === 'department' && (
                             movement.reference_id === 'maintenance' ? 'Mantenimiento' :
                             movement.reference_id === 'operations' ? 'Operaciones' :
                             movement.reference_id === 'admin' ? 'Admin' : movement.reference_id
                          )}
                          {movement.reference_type === 'supplier' && 'Proveedor'}
                          {movement.reference_type === 'adjustment' && 'Ajuste Manual'}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {movement.notes}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs">
                          {/* User info not available in movement directly, would need join */}
                          -
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Descripción</h3>
                  <p className="mt-1">{item.description || 'Sin descripción'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Código de Barras</h3>
                  <p className="mt-1 font-mono">{item.barcode || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Categoría</h3>
                  <p className="mt-1 flex items-center gap-2">
                    {categoryConfig.icon} {categoryConfig.label}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Unidad de Medida</h3>
                  <p className="mt-1 capitalize">{unitLabel}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Stock Mínimo</h3>
                  <p className="mt-1">{item.min_stock} {unitLabel}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Ubicación Física</h3>
                  <p className="mt-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    {item.location || 'No especificada'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <InventoryMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        item={item}
      />
    </div>
  );
}

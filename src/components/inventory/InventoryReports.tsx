import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useInventory } from '@/hooks/useInventory';
import { useCranes } from '@/hooks/useCranes';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Truck, Building2, Package, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InventoryReports() {
  const { movements } = useInventory();
  const { cranes } = useCranes();

  // Filter only OUT movements for consumption stats
  const consumptions = useMemo(() => {
    return movements.filter(m => m.type === 'out');
  }, [movements]);

  // Group by Reference Type (Crane vs Department)
  const groupedData = useMemo(() => {
    const grouped: Record<string, {
      name: string;
      type: string;
      itemsCount: number;
      movementsCount: number;
    }> = {};

    consumptions.forEach(m => {
      const key = `${m.reference_type}-${m.reference_id}`;
      if (!grouped[key]) {
        let name = 'Desconocido';
        if (m.reference_type === 'crane') {
          const crane = cranes?.find(c => c.id === m.reference_id);
          name = crane ? `${crane.unit_number}` : 'Grúa Eliminada';
        } else if (m.reference_type === 'department') {
          const deptNames: Record<string, string> = {
            maintenance: 'Mantenimiento',
            operations: 'Operaciones',
            admin: 'Administración',
            sales: 'Ventas'
          };
          name = deptNames[m.reference_id || ''] || m.reference_id || 'Departamento';
        }

        grouped[key] = {
          name,
          type: m.reference_type === 'crane' ? 'Equipo' : 'Departamento',
          itemsCount: 0,
          movementsCount: 0,
        };
      }
      grouped[key].itemsCount += m.quantity;
      grouped[key].movementsCount += 1;
    });

    return Object.values(grouped).sort((a, b) => b.itemsCount - a.itemsCount);
  }, [consumptions, cranes]);

  // Chart Data
  const chartData = groupedData.slice(0, 5).map(d => ({
    name: d.name,
    items: d.itemsCount
  }));

  const handleExport = () => {
    const headers = ['Fecha', 'Artículo', 'Tipo', 'Cantidad', 'Referencia', 'Notas'];
    const csvContent = [
      headers.join(','),
      ...movements.map(m => {
        let refInfo = m.reference_id || '';
        if (m.reference_type === 'crane') {
          const crane = cranes?.find(c => c.id === m.reference_id);
          refInfo = crane ? `${crane.unit_number}` : m.reference_id || '';
        } else if (m.reference_type === 'supplier') {
          refInfo = 'Proveedor'; // Could be improved if we had suppliers list
        }

        return [
          format(new Date(m.created_at || ''), 'yyyy-MM-dd HH:mm'),
          `"${(m as any).item?.name || ''}"`,
          m.type,
          m.quantity,
          `"${refInfo}"`,
          `"${m.notes || ''}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `movimientos_inventario_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Reportes y Movimientos</h2>
        <Button variant="outline" onClick={handleExport} disabled={movements.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Todo (CSV)
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Consumo por Equipo
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {groupedData.filter(d => d.type === 'Equipo').reduce((acc, curr) => acc + curr.itemsCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Artículos asignados a grúas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Consumo por Depto
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {groupedData.filter(d => d.type === 'Departamento').reduce((acc, curr) => acc + curr.itemsCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Artículos asignados a áreas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Movimientos Totales
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{movements.length}</div>
            <p className="text-xs text-muted-foreground">
              Entradas, salidas y ajustes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Consumo por Destino</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip />
                <Bar dataKey="items" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Cantidad" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Historial Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {movements.slice(0, 5).map((movement) => (
                <div key={movement.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {(movement as any).item?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(movement.created_at || ''), "d MMM yyyy HH:mm", { locale: es })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-sm font-bold ${
                      movement.type === 'in' ? 'text-green-600' : 
                      movement.type === 'out' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : ''}{movement.quantity}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {movement.type === 'in' ? 'Entrada' : movement.type === 'out' ? 'Salida' : 'Ajuste'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Artículo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Referencia/Destino</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(movement.created_at || ''), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="font-medium">{(movement as any).item?.name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      movement.type === 'in' ? 'bg-green-100 text-green-700' : 
                      movement.type === 'out' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {movement.type === 'in' ? 'Entrada' : movement.type === 'out' ? 'Salida' : 'Ajuste'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {movement.quantity}
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
                  <TableCell className="text-sm max-w-[200px] truncate">
                    {movement.notes}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

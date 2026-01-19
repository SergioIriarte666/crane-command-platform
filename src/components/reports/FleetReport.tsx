import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ReportDateFilter } from './ReportDateFilter';
import { useFleetReport, exportToCSV, type DateRange } from '@/hooks/useReports';
import { formatCurrency } from '@/types/finance';
import { startOfMonth, endOfMonth } from 'date-fns';
import { Truck, Wrench, DollarSign, Activity } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const CRANE_TYPE_LABELS: Record<string, string> = {
  plataforma: 'Plataforma',
  arrastre: 'Arrastre',
  pesada: 'Pesada',
  lowboy: 'Lowboy',
  auxilio: 'Auxilio',
};

const CRANE_STATUS_LABELS: Record<string, string> = {
  available: 'Disponible',
  in_service: 'En Servicio',
  maintenance: 'Mantenimiento',
  out_of_service: 'Fuera de Servicio',
};

export function FleetReport() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const { data: fleet, isLoading } = useFleetReport(dateRange);

  const stats = useMemo(() => {
    if (!fleet) return null;

    const totalUnits = fleet.length;
    const totalServices = fleet.reduce((sum, c) => sum + c.servicesCount, 0);
    const totalRevenue = fleet.reduce((sum, c) => sum + c.totalRevenue, 0);
    const totalMaintenanceCost = fleet.reduce((sum, c) => sum + c.maintenanceCost, 0);
    const avgServicesPerUnit = totalUnits > 0 ? totalServices / totalUnits : 0;

    // By type
    const byType = Object.entries(
      fleet.reduce((acc, c) => {
        const type = c.crane?.type || 'other';
        if (!acc[type]) acc[type] = { count: 0, services: 0, revenue: 0 };
        acc[type].count++;
        acc[type].services += c.servicesCount;
        acc[type].revenue += c.totalRevenue;
        return acc;
      }, {} as Record<string, { count: number; services: number; revenue: number }>)
    ).map(([type, data]) => ({
      name: CRANE_TYPE_LABELS[type] || type,
      unidades: data.count,
      servicios: data.services,
      ingresos: data.revenue,
    }));

    // By status
    const byStatus = Object.entries(
      fleet.reduce((acc, c) => {
        const status = c.crane?.status || 'available';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([status, count]) => ({
      name: CRANE_STATUS_LABELS[status] || status,
      value: count,
    }));

    // Top performers
    const topPerformers = [...fleet]
      .sort((a, b) => b.servicesCount - a.servicesCount)
      .slice(0, 8)
      .map(c => ({
        name: c.crane?.unit_number || 'N/A',
        servicios: c.servicesCount,
        ingresos: c.totalRevenue / 1000,
        mantenimiento: c.maintenanceCost / 1000,
      }));

    // Utilization rate (assuming 1 service per day max is 100%)
    const daysInPeriod = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const maxPossibleServices = totalUnits * daysInPeriod;
    const utilizationRate = maxPossibleServices > 0 ? (totalServices / maxPossibleServices) * 100 : 0;

    return {
      totalUnits,
      totalServices,
      totalRevenue,
      totalMaintenanceCost,
      avgServicesPerUnit,
      utilizationRate,
      byType,
      byStatus,
      topPerformers,
    };
  }, [fleet, dateRange]);

  const handleExport = () => {
    if (!fleet) return;
    const exportData = fleet.map(c => ({
      Unidad: c.crane?.unit_number || '',
      Tipo: CRANE_TYPE_LABELS[c.crane?.type || ''] || '',
      Marca: c.crane?.brand || '',
      Modelo: c.crane?.model || '',
      Estado: CRANE_STATUS_LABELS[c.crane?.status || ''] || '',
      Kilometraje: c.crane?.current_km || 0,
      Servicios: c.servicesCount,
      Completados: c.completedServices,
      Ingresos: c.totalRevenue,
      Mantenimientos: c.maintenanceCount,
      CostoMantenimiento: c.maintenanceCost,
    }));
    exportToCSV(exportData, 'reporte_flota');
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-96" /></div>;
  }

  return (
    <div className="space-y-6">
      <ReportDateFilter
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onExport={handleExport}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Unidades</p>
            </div>
            <p className="text-3xl font-bold">{stats?.totalUnits || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Servicios</p>
            </div>
            <p className="text-3xl font-bold">{stats?.totalServices || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Utilización</p>
            <p className="text-3xl font-bold">{stats?.utilizationRate?.toFixed(1) || 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Ingresos</p>
            </div>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(stats?.totalRevenue || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Costo Mant.</p>
            </div>
            <p className="text-3xl font-bold text-amber-600">{formatCurrency(stats?.totalMaintenanceCost || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento por Unidad</CardTitle>
            <CardDescription>Top 8 unidades por servicios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.topPerformers || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="servicios" name="Servicios" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de la Flota</CardTitle>
            <CardDescription>Distribución actual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.byStatus || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {stats?.byStatus?.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Por Tipo de Unidad</CardTitle>
            <CardDescription>Servicios e ingresos por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.byType || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis yAxisId="left" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number, name: string) => name === 'ingresos' ? formatCurrency(value) : value} />
                  <Bar yAxisId="left" dataKey="servicios" name="Servicios" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Flota</CardTitle>
          <CardDescription>{fleet?.length || 0} unidades registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unidad</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Servicios</TableHead>
                <TableHead className="text-center">Mantenimientos</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">Costo Mant.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fleet?.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono font-medium">{item.crane?.unit_number || '-'}</TableCell>
                  <TableCell>{CRANE_TYPE_LABELS[item.crane?.type || ''] || item.crane?.type}</TableCell>
                  <TableCell>
                    <Badge variant={item.crane?.status === 'available' ? 'default' : 'secondary'}>
                      {CRANE_STATUS_LABELS[item.crane?.status || ''] || item.crane?.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{item.servicesCount}</TableCell>
                  <TableCell className="text-center">{item.maintenanceCount}</TableCell>
                  <TableCell className="text-right text-green-600">{formatCurrency(item.totalRevenue)}</TableCell>
                  <TableCell className="text-right text-amber-600">{formatCurrency(item.maintenanceCost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

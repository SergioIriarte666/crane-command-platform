import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ReportDateFilter } from './ReportDateFilter';
import { useClientsReport, exportToCSV, type DateRange } from '@/hooks/useReports';
import { formatCurrency } from '@/types/finance';
import { startOfMonth, endOfMonth } from 'date-fns';
import { Users, TrendingUp, Award } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const CLIENT_TYPE_LABELS: Record<string, string> = {
  particular: 'Particular',
  empresa: 'Empresa',
  aseguradora: 'Aseguradora',
  gobierno: 'Gobierno',
};

export function ClientsReport() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const { data: clients, isLoading } = useClientsReport(dateRange);

  const stats = useMemo(() => {
    if (!clients) return null;

    const totalClients = clients.length;
    const totalRevenue = clients.reduce((sum, c) => sum + c.totalRevenue, 0);
    const totalServices = clients.reduce((sum, c) => sum + c.servicesCount, 0);
    const avgRevenuePerClient = totalClients > 0 ? totalRevenue / totalClients : 0;

    // Top 10 by revenue
    const topByRevenue = clients.slice(0, 10).map(c => ({
      name: c.client?.name || 'Sin nombre',
      revenue: c.totalRevenue,
      services: c.servicesCount,
    }));

    // By type
    const byType = Object.entries(
      clients.reduce((acc, c) => {
        const type = (c.client as any)?.type || 'particular';
        if (!acc[type]) acc[type] = { count: 0, revenue: 0 };
        acc[type].count++;
        acc[type].revenue += c.totalRevenue;
        return acc;
      }, {} as Record<string, { count: number; revenue: number }>)
    ).map(([type, data]) => ({
      name: CLIENT_TYPE_LABELS[type] || type,
      clientes: data.count,
      ingresos: data.revenue,
    }));

    // Pareto analysis (80/20)
    const sortedByRevenue = [...clients].sort((a, b) => b.totalRevenue - a.totalRevenue);
    let accumulated = 0;
    let clientsFor80Percent = 0;
    const target = totalRevenue * 0.8;
    for (const client of sortedByRevenue) {
      accumulated += client.totalRevenue;
      clientsFor80Percent++;
      if (accumulated >= target) break;
    }

    return {
      totalClients,
      totalRevenue,
      totalServices,
      avgRevenuePerClient,
      topByRevenue,
      byType,
      clientsFor80Percent,
      paretoPercent: totalClients > 0 ? ((clientsFor80Percent / totalClients) * 100).toFixed(0) : 0,
    };
  }, [clients]);

  const handleExport = () => {
    if (!clients) return;
    const exportData = clients.map(c => ({
      Codigo: c.client?.code || '',
      Nombre: c.client?.name || '',
      Tipo: CLIENT_TYPE_LABELS[(c.client as any)?.type] || '',
      Servicios: c.servicesCount,
      Completados: c.completedCount,
      Ingresos: c.totalRevenue,
    }));
    exportToCSV(exportData, 'reporte_clientes');
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Clientes Activos</p>
            </div>
            <p className="text-3xl font-bold">{stats?.totalClients || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Ingresos Totales</p>
            </div>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(stats?.totalRevenue || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Ingreso Promedio</p>
            <p className="text-3xl font-bold">{formatCurrency(stats?.avgRevenuePerClient || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Pareto 80/20</p>
            </div>
            <p className="text-3xl font-bold">{stats?.paretoPercent}%</p>
            <p className="text-xs text-muted-foreground">{stats?.clientsFor80Percent} clientes = 80% ingresos</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Clientes</CardTitle>
            <CardDescription>Por ingresos en el período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.topByRevenue || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" fontSize={11} width={120} tick={{ fill: 'currentColor' }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="revenue" name="Ingresos" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por Tipo de Cliente</CardTitle>
            <CardDescription>Distribución de ingresos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.byType || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="ingresos"
                  >
                    {stats?.byType?.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Clientes</CardTitle>
          <CardDescription>{clients?.length || 0} clientes con actividad en el período</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Servicios</TableHead>
                <TableHead className="text-center">Completados</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients?.slice(0, 15).map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono">{item.client?.code || '-'}</TableCell>
                  <TableCell className="font-medium">{item.client?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {CLIENT_TYPE_LABELS[(item.client as any)?.type] || 'Particular'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{item.servicesCount}</TableCell>
                  <TableCell className="text-center">{item.completedCount}</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(item.totalRevenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { ReportDateFilter } from './ReportDateFilter';
import { useOperatorsReport, exportToCSV, type DateRange } from '@/hooks/useReports';
import { formatCurrency } from '@/types/finance';
import { startOfMonth, endOfMonth } from 'date-fns';
import { UserCheck, Trophy, DollarSign, Truck } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function OperatorsReport() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const { data: operators, isLoading } = useOperatorsReport(dateRange);

  const stats = useMemo(() => {
    if (!operators) return null;

    const totalOperators = operators.length;
    const totalServices = operators.reduce((sum, o) => sum + o.servicesCount, 0);
    const totalRevenue = operators.reduce((sum, o) => sum + o.totalRevenue, 0);
    const totalCommissions = operators.reduce((sum, o) => sum + o.totalCommission, 0);
    const avgServicesPerOperator = totalOperators > 0 ? totalServices / totalOperators : 0;

    // Performance chart data
    const performanceData = operators.slice(0, 8).map(o => ({
      name: o.operator?.full_name?.split(' ')[0] || 'Op',
      servicios: o.servicesCount,
      completados: o.completedCount,
      ingresos: o.totalRevenue / 1000, // in thousands
      comision: o.totalCommission / 1000,
    }));

    // Radar chart for top 5
    const radarData = operators.slice(0, 5).map(o => {
      const maxServices = Math.max(...operators.map(op => op.servicesCount)) || 1;
      const maxRevenue = Math.max(...operators.map(op => op.totalRevenue)) || 1;
      const completionRate = o.servicesCount > 0 ? (o.completedCount / o.servicesCount) * 100 : 0;
      return {
        operator: o.operator?.full_name?.split(' ')[0] || 'Op',
        Servicios: (o.servicesCount / maxServices) * 100,
        Ingresos: (o.totalRevenue / maxRevenue) * 100,
        Cumplimiento: completionRate,
      };
    });

    return {
      totalOperators,
      totalServices,
      totalRevenue,
      totalCommissions,
      avgServicesPerOperator,
      performanceData,
      radarData,
    };
  }, [operators]);

  const handleExport = () => {
    if (!operators) return;
    const exportData = operators.map(o => ({
      Numero: o.operator?.employee_number || '',
      Nombre: o.operator?.full_name || '',
      Servicios: o.servicesCount,
      Completados: o.completedCount,
      TasaCumplimiento: o.servicesCount > 0 ? ((o.completedCount / o.servicesCount) * 100).toFixed(1) + '%' : '0%',
      Ingresos: o.totalRevenue,
      Comision: o.totalCommission,
    }));
    exportToCSV(exportData, 'reporte_operadores');
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
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Operadores</p>
            </div>
            <p className="text-3xl font-bold">{stats?.totalOperators || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Servicios</p>
            </div>
            <p className="text-3xl font-bold">{stats?.totalServices || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Promedio/Operador</p>
            <p className="text-3xl font-bold">{stats?.avgServicesPerOperator?.toFixed(1) || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Ingresos Generados</p>
            </div>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(stats?.totalRevenue || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Comisiones</p>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(stats?.totalCommissions || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento por Operador</CardTitle>
            <CardDescription>Servicios e ingresos (miles)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.performanceData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="servicios" name="Servicios" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completados" name="Completados" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ingresos y Comisiones</CardTitle>
            <CardDescription>Por operador (en miles)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.performanceData || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis dataKey="name" type="category" fontSize={12} width={60} />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(1)}k`} />
                  <Legend />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="comision" name="Comisión" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operators Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Operadores</CardTitle>
          <CardDescription>{operators?.length || 0} operadores con actividad</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Empleado</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead className="text-center">Servicios</TableHead>
                <TableHead className="text-center">Completados</TableHead>
                <TableHead>Cumplimiento</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">Comisión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operators?.map((item, idx) => {
                const completionRate = item.servicesCount > 0 
                  ? (item.completedCount / item.servicesCount) * 100 
                  : 0;
                return (
                  <TableRow key={idx}>
                    <TableCell className="font-mono">{item.operator?.employee_number || '-'}</TableCell>
                    <TableCell className="font-medium">{item.operator?.full_name || '-'}</TableCell>
                    <TableCell className="text-center">{item.servicesCount}</TableCell>
                    <TableCell className="text-center">{item.completedCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={completionRate} className="h-2 w-16" />
                        <span className="text-sm">{completionRate.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.totalRevenue)}</TableCell>
                    <TableCell className="text-right font-bold">{formatCurrency(item.totalCommission)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

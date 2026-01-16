import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { ReportDateFilter, ExportFormat } from './ReportDateFilter';
import { useServicesReport, exportToCSV, type DateRange } from '@/hooks/useReports';
import { formatCurrency } from '@/types/finance';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { exportServiceReport } from '@/utils/reports/serviceReportExporter';
import { useTenant } from '@/hooks/useSettings';
import { tenantToCompanyInfo } from '@/utils/reports/reportUtils';
import { toast } from 'sonner';

const SERVICE_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  quoted: 'Cotizado',
  confirmed: 'Confirmado',
  assigned: 'Asignado',
  en_route: 'En Camino',
  on_site: 'En Sitio',
  in_progress: 'En Curso',
  completed: 'Completado',
  invoiced: 'Facturado',
  cancelled: 'Cancelado',
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  local: 'Local',
  foraneo: 'Foráneo',
  pension: 'Pensión',
  maniobra: 'Maniobra',
  auxilio: 'Auxilio',
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function ServicesReport() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const { data: services, isLoading } = useServicesReport(dateRange);
  const { data: tenant } = useTenant();

  const stats = useMemo(() => {
    if (!services) return null;

    const total = services.length;
    const completed = services.filter(s => s.status === 'completed' || s.status === 'invoiced').length;
    const cancelled = services.filter(s => s.status === 'cancelled').length;
    const totalRevenue = services
      .filter(s => s.status === 'completed' || s.status === 'invoiced')
      .reduce((sum, s) => sum + (s.total || 0), 0);
    const avgTicket = completed > 0 ? totalRevenue / completed : 0;

    // By status
    const byStatus = Object.entries(
      services.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([status, count]) => ({
      name: SERVICE_STATUS_LABELS[status] || status,
      value: count,
    }));

    // By type
    const byType = Object.entries(
      services.reduce((acc, s) => {
        acc[s.type] = (acc[s.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([type, count]) => ({
      name: SERVICE_TYPE_LABELS[type] || type,
      value: count,
    }));

    // By day
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    const byDay = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayServices = services.filter(s => s.scheduled_date === dayStr);
      return {
        date: format(day, 'dd MMM', { locale: es }),
        total: dayServices.length,
        completed: dayServices.filter(s => s.status === 'completed' || s.status === 'invoiced').length,
        revenue: dayServices
          .filter(s => s.status === 'completed' || s.status === 'invoiced')
          .reduce((sum, s) => sum + (s.total || 0), 0),
      };
    });

    return { total, completed, cancelled, totalRevenue, avgTicket, byStatus, byType, byDay };
  }, [services, dateRange]);

  const handleExport = async (exportFormat: ExportFormat) => {
    if (!services) return;
    
    if (exportFormat === 'csv') {
      const exportData = services.map(s => ({
        Folio: s.folio,
        Fecha: s.scheduled_date,
        Estado: SERVICE_STATUS_LABELS[s.status] || s.status,
        Tipo: SERVICE_TYPE_LABELS[s.type] || s.type,
        Cliente: (s.client as any)?.name || '',
        Operador: (s.operator as any)?.full_name || '',
        Unidad: (s.crane as any)?.unit_number || '',
        Total: s.total || 0,
      }));
      exportToCSV(exportData, 'reporte_servicios');
    } else {
      try {
        const formattedServices = services.map(s => ({
          id: s.id,
          folio: s.folio,
          service_date: s.scheduled_date || '',
          status: s.status,
          total_price: s.total,
          client: s.client ? { id: (s.client as any).id, name: (s.client as any).name } : null,
          service_type: s.type ? { id: s.type, name: SERVICE_TYPE_LABELS[s.type] || s.type } : null,
          license_plate: (s as any).license_plate || '',
          origin_address: (s as any).origin_address || '',
          destination_address: (s as any).destination_address || '',
        }));

        await exportServiceReport({
          format: exportFormat === 'pdf' ? 'pdf' : 'excel',
          services: formattedServices,
          company: tenantToCompanyInfo(tenant),
          appliedFilters: {
            dateRange: {
              from: format(dateRange.from, 'yyyy-MM-dd'),
              to: format(dateRange.to, 'yyyy-MM-dd'),
            },
            client: 'Todos',
          },
          logoUrl: tenant?.logo_url || undefined,
        });
        toast.success(`Reporte exportado como ${exportFormat.toUpperCase()}`);
      } catch (error) {
        console.error('Export error:', error);
        toast.error('Error al exportar el reporte');
      }
    }
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
            <p className="text-sm text-muted-foreground">Total Servicios</p>
            <p className="text-3xl font-bold">{stats?.total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Completados</p>
            <p className="text-3xl font-bold text-green-600">{stats?.completed || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Cancelados</p>
            <p className="text-3xl font-bold text-red-600">{stats?.cancelled || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Ingresos</p>
            <p className="text-3xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Ticket Promedio</p>
            <p className="text-3xl font-bold">{formatCurrency(stats?.avgTicket || 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Servicios por Día</CardTitle>
            <CardDescription>Tendencia de servicios en el período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.byDay || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" name="Total" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="completed" name="Completados" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Día</CardTitle>
            <CardDescription>Facturación de servicios completados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.byDay || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="revenue" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.byStatus || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
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

        <Card>
          <CardHeader>
            <CardTitle>Por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.byType || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis dataKey="name" type="category" fontSize={12} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" name="Servicios" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Servicios</CardTitle>
          <CardDescription>{services?.length || 0} servicios en el período</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Folio</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services?.slice(0, 10).map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-mono">{service.folio}</TableCell>
                  <TableCell>{service.scheduled_date ? format(parseISO(service.scheduled_date), 'dd/MM/yyyy', { locale: es }) : '-'}</TableCell>
                  <TableCell>{(service.client as any)?.name || '-'}</TableCell>
                  <TableCell>{SERVICE_TYPE_LABELS[service.type] || service.type}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{SERVICE_STATUS_LABELS[service.status] || service.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(service.total || 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

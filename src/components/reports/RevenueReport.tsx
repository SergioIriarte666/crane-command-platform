import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { ReportDateFilter } from './ReportDateFilter';
import { useRevenueReport, exportToCSV, type DateRange } from '@/hooks/useReports';
import { formatCurrency } from '@/types/finance';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { TrendingUp, TrendingDown, DollarSign, FileText, CreditCard } from 'lucide-react';

export function RevenueReport() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const { data, isLoading } = useRevenueReport(dateRange);

  const stats = useMemo(() => {
    if (!data) return null;

    const { invoices, payments } = data;

    const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0);
    const totalPending = invoices.filter(i => ['pending', 'sent', 'partial', 'overdue'].includes(i.status)).reduce((sum, inv) => sum + (inv.balance_due || 0), 0);
    const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // By day
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    const byDay = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayInvoices = invoices.filter(i => i.issue_date === dayStr);
      const dayPayments = payments.filter(p => p.payment_date === dayStr);
      return {
        date: format(day, 'dd MMM', { locale: es }),
        facturado: dayInvoices.reduce((sum, i) => sum + (i.total || 0), 0),
        cobrado: dayPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      };
    });

    // Cumulative
    let cumulativeInvoiced = 0;
    let cumulativePaid = 0;
    const cumulative = byDay.map(day => {
      cumulativeInvoiced += day.facturado;
      cumulativePaid += day.cobrado;
      return {
        ...day,
        acumuladoFacturado: cumulativeInvoiced,
        acumuladoCobrado: cumulativePaid,
      };
    });

    // By payment method
    const byMethod = Object.entries(
      payments.reduce((acc, p) => {
        const method = p.payment_method || 'otro';
        acc[method] = (acc[method] || 0) + (p.amount || 0);
        return acc;
      }, {} as Record<string, number>)
    ).map(([method, amount]) => ({
      name: method === 'transfer' ? 'Transferencia' : method === 'cash' ? 'Efectivo' : method === 'check' ? 'Cheque' : method === 'card' ? 'Tarjeta' : method,
      value: amount,
    }));

    return { totalInvoiced, totalPaid, totalPending, totalPayments, byDay, cumulative, byMethod };
  }, [data, dateRange]);

  const handleExport = () => {
    if (!data) return;
    const exportData = data.invoices.map(inv => ({
      Folio: inv.folio,
      Fecha: inv.issue_date,
      Vencimiento: inv.due_date,
      Estado: inv.status,
      Cliente: (inv.client as any)?.name || '',
      Total: inv.total || 0,
      Saldo: inv.balance_due || 0,
    }));
    exportToCSV(exportData, 'reporte_ingresos');
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
              <FileText className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Facturado</p>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(stats?.totalInvoiced || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Cobrado</p>
            </div>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(stats?.totalPayments || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Por Cobrar</p>
            </div>
            <p className="text-3xl font-bold text-amber-600">{formatCurrency(stats?.totalPending || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              {(stats?.totalPayments || 0) >= (stats?.totalInvoiced || 0) * 0.8 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <p className="text-sm text-muted-foreground">Tasa de Cobro</p>
            </div>
            <p className="text-3xl font-bold">
              {stats?.totalInvoiced ? ((stats.totalPayments / stats.totalInvoiced) * 100).toFixed(0) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Facturado vs Cobrado</CardTitle>
            <CardDescription>Comparativo diario</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.byDay || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="facturado" name="Facturado" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cobrado" name="Cobrado" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acumulado del Período</CardTitle>
            <CardDescription>Evolución de facturación y cobros</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.cumulative || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="acumuladoFacturado" name="Facturado" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="acumuladoCobrado" name="Cobrado" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Cobros por Método de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.byMethod || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" fontSize={12} width={100} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" name="Monto" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

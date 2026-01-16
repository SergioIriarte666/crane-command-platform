import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ReportDateFilter } from './ReportDateFilter';
import { useFinanceReport, exportToCSV, type DateRange } from '@/hooks/useReports';
import { formatCurrency, INVOICE_STATUS_CONFIG, CLOSURE_STATUS_CONFIG, COMMISSION_STATUS_CONFIG } from '@/types/finance';
import { startOfMonth, endOfMonth, format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, CreditCard, Calculator, FolderOpen, AlertTriangle } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function FinanceReport() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const { data, isLoading } = useFinanceReport(dateRange);

  const stats = useMemo(() => {
    if (!data) return null;

    const { invoices, payments, commissions, closures } = data;

    // Invoice stats
    const totalInvoiced = invoices.reduce((sum, i) => sum + (i.total || 0), 0);
    const totalPending = invoices
      .filter(i => ['pending', 'sent', 'partial', 'overdue'].includes(i.status))
      .reduce((sum, i) => sum + (i.balance_due || 0), 0);
    const overdueInvoices = invoices.filter(i => {
      if (i.status === 'paid' || i.status === 'cancelled') return false;
      return differenceInDays(new Date(), parseISO(i.due_date)) > 0;
    });
    const overdueAmount = overdueInvoices.reduce((sum, i) => sum + (i.balance_due || 0), 0);

    // Payment stats
    const totalPayments = payments.filter(p => p.status === 'confirmed').reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingPayments = payments.filter(p => p.status === 'pending').length;

    // Commission stats
    const totalCommissions = commissions.reduce((sum, c) => sum + (c.total_amount || 0), 0);
    const pendingCommissions = commissions.filter(c => c.status === 'pending' || c.status === 'approved').reduce((sum, c) => sum + (c.total_amount || 0), 0);

    // Closure stats
    const totalClosures = closures.length;
    const closuresByStatus = Object.entries(
      closures.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([status, count]) => ({
      name: CLOSURE_STATUS_CONFIG[status as keyof typeof CLOSURE_STATUS_CONFIG]?.label || status,
      value: count,
    }));

    // Invoice by status
    const invoicesByStatus = Object.entries(
      invoices.reduce((acc, i) => {
        acc[i.status] = (acc[i.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([status, count]) => ({
      name: INVOICE_STATUS_CONFIG[status as keyof typeof INVOICE_STATUS_CONFIG]?.label || status,
      value: count,
    }));

    // Commission by status
    const commissionsByStatus = Object.entries(
      commissions.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([status, count]) => ({
      name: COMMISSION_STATUS_CONFIG[status as keyof typeof COMMISSION_STATUS_CONFIG]?.label || status,
      value: count,
    }));

    // Aging analysis
    const aging = {
      current: 0,
      days30: 0,
      days60: 0,
      days90: 0,
      over90: 0,
    };
    invoices.filter(i => ['pending', 'sent', 'partial', 'overdue'].includes(i.status)).forEach(i => {
      const daysOverdue = differenceInDays(new Date(), parseISO(i.due_date));
      const balance = i.balance_due || 0;
      if (daysOverdue <= 0) aging.current += balance;
      else if (daysOverdue <= 30) aging.days30 += balance;
      else if (daysOverdue <= 60) aging.days60 += balance;
      else if (daysOverdue <= 90) aging.days90 += balance;
      else aging.over90 += balance;
    });

    const agingData = [
      { name: 'Vigente', value: aging.current },
      { name: '1-30 días', value: aging.days30 },
      { name: '31-60 días', value: aging.days60 },
      { name: '61-90 días', value: aging.days90 },
      { name: '+90 días', value: aging.over90 },
    ];

    return {
      totalInvoiced,
      totalPending,
      overdueCount: overdueInvoices.length,
      overdueAmount,
      totalPayments,
      pendingPayments,
      totalCommissions,
      pendingCommissions,
      totalClosures,
      invoicesByStatus,
      closuresByStatus,
      commissionsByStatus,
      agingData,
    };
  }, [data]);

  const handleExport = () => {
    if (!data) return;
    const exportData = [
      ...data.invoices.map(i => ({
        Tipo: 'Factura',
        Folio: i.folio,
        Fecha: i.issue_date,
        Estado: i.status,
        Total: i.total || 0,
        Saldo: i.balance_due || 0,
      })),
      ...data.payments.map(p => ({
        Tipo: 'Pago',
        Folio: '-',
        Fecha: p.payment_date,
        Estado: p.status,
        Total: p.amount || 0,
        Saldo: 0,
      })),
    ];
    exportToCSV(exportData, 'reporte_finanzas');
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
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <p className="text-sm text-muted-foreground">Vencido</p>
            </div>
            <p className="text-3xl font-bold text-red-600">{formatCurrency(stats?.overdueAmount || 0)}</p>
            <p className="text-xs text-muted-foreground">{stats?.overdueCount} facturas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Comisiones</p>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(stats?.totalCommissions || 0)}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(stats?.pendingCommissions || 0)} pendientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Antigüedad de Cartera</CardTitle>
            <CardDescription>Análisis de cuentas por cobrar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.agingData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" name="Saldo" fill="#ef4444" radius={[4, 4, 0, 0]}>
                    {stats?.agingData?.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? '#10b981' : index < 3 ? '#f59e0b' : '#ef4444'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Facturas por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.invoicesByStatus || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {stats?.invoicesByStatus?.map((_, index) => (
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
            <CardTitle>Cierres por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.closuresByStatus || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {stats?.closuresByStatus?.map((_, index) => (
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
            <CardTitle>Comisiones por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.commissionsByStatus || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis dataKey="name" type="category" fontSize={12} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" name="Cantidad" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle>Facturas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total emitidas</span>
              <span className="font-medium">{data?.invoices.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monto facturado</span>
              <span className="font-medium">{formatCurrency(stats?.totalInvoiced || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Por cobrar</span>
              <span className="font-medium text-amber-600">{formatCurrency(stats?.totalPending || 0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              <CardTitle>Cierres</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total cierres</span>
              <span className="font-medium">{stats?.totalClosures || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monto total</span>
              <span className="font-medium">
                {formatCurrency(data?.closures.reduce((sum, c) => sum + (c.total || 0), 0) || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              <CardTitle>Comisiones</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total comisiones</span>
              <span className="font-medium">{data?.commissions.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monto total</span>
              <span className="font-medium">{formatCurrency(stats?.totalCommissions || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pendientes de pago</span>
              <span className="font-medium text-amber-600">{formatCurrency(stats?.pendingCommissions || 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ReportDateFilter, ExportFormat } from './ReportDateFilter';
import { useCostStats } from '@/hooks/useCosts';
import { useServiceCostsLedger } from '@/hooks/useServiceCostsLedger';
import { formatCurrency } from '@/types/finance';
import { COST_CATEGORY_CONFIG, CostCategory } from '@/types/costs';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Loader2, DollarSign, Wrench, FileText } from 'lucide-react';
import { DateRange } from '@/hooks/useReports';
import { exportServiceCostsToExcel, exportServiceCostsToPDF } from '@/lib/costExport';
import { useCatalogs } from '@/hooks/useCatalogs';
import { toast } from 'sonner';

export function CostsReport() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const formattedDates = useMemo(() => ({
    dateFrom: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    dateTo: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
  }), [dateRange]);

  const { data: operationalStats, isLoading: isLoadingOp } = useCostStats(
    formattedDates.dateFrom,
    formattedDates.dateTo
  );

  const { metrics: serviceMetrics, rows: serviceCosts, isLoading: isLoadingService } = useServiceCostsLedger({
    dateFrom: formattedDates.dateFrom,
    dateTo: formattedDates.dateTo,
  });

  const { catalogs: costCategories } = useCatalogs('cost_category');

  const categoriesMap = useMemo(() => {
    if (!costCategories) return {};
    return costCategories.reduce((acc: Record<string, string>, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {} as Record<string, string>);
  }, [costCategories]);

  const isLoading = isLoadingOp || isLoadingService;

  const totalCosts = (operationalStats?.totalCosts || 0) + (serviceMetrics?.totalAmount || 0);

  // Merge categories for chart
  const categoryData = useMemo(() => {
    if (!operationalStats?.byCategory) return [];
    
    return Object.entries(operationalStats.byCategory).map(([key, value]) => ({
      name: COST_CATEGORY_CONFIG[key as CostCategory]?.label || key,
      value: value.total,
      count: value.count
    })).sort((a, b) => b.value - a.value);
  }, [operationalStats]);

  const typeData = [
    { name: 'Operativos', value: operationalStats?.totalCosts || 0, color: '#3b82f6' },
    { name: 'Servicios', value: serviceMetrics?.totalAmount || 0, color: '#f59e0b' }
  ].filter(d => d.value > 0);

  const handleExport = async (format: ExportFormat) => {
    if (!serviceCosts || serviceCosts.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    if (format === 'excel') {
      exportServiceCostsToExcel(serviceCosts, categoriesMap);
    } else if (format === 'pdf') {
      await exportServiceCostsToPDF(serviceCosts, categoriesMap);
    }
  };


  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <ReportDateFilter
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onExport={handleExport}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Costos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCosts)}</div>
            <p className="text-xs text-muted-foreground">
              {(operationalStats?.totalCount || 0) + (serviceMetrics?.total || 0)} registros en total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costos Operativos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(operationalStats?.totalCosts || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {operationalStats?.totalCount || 0} registros
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costos de Servicios</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(serviceMetrics?.totalAmount || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {serviceMetrics?.total || 0} registros
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Tipo</CardTitle>
            <CardDescription>Operativos vs Servicios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Costos Operativos por Categoría</CardTitle>
            <CardDescription>Desglose de gastos generales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" fontSize={11} width={100} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" name="Monto" fill="#8884d8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Costs Table (Mixed or just Top ones) */}
       <Card>
        <CardHeader>
          <CardTitle>Mayores Costos de Servicios</CardTitle>
          <CardDescription>Top 10 costos asociados a servicios en el período</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceCosts?.slice(0, 10).map((cost) => (
                <TableRow key={cost.id}>
                  <TableCell className="text-sm">
                    {cost.cost_date ? format(new Date(cost.cost_date), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell className="font-medium">{cost.description}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {cost.service?.folio || '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(cost.amount || 0)}
                  </TableCell>
                </TableRow>
              ))}
              {(!serviceCosts || serviceCosts.length === 0) && (
                 <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No hay costos de servicios en este período
                    </TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

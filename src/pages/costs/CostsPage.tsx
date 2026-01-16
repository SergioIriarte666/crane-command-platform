import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Download, MoreHorizontal, Eye, Pencil, Trash2, CheckCircle, XCircle, SendHorizontal, Wrench, FileText, FileSpreadsheet, Copy, ChevronLeft, ChevronRight, Check, ChevronsUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

import { useCosts, useCostStats, CostFilters } from '@/hooks/useCosts';
import { useServiceCostsLedger } from '@/hooks/useServiceCostsLedger';
import { useAuth } from '@/contexts/AuthContext';
import {
  COST_STATUS_CONFIG, 
  COST_CATEGORY_CONFIG, 
  COST_CATEGORIES, 
  COST_STATUSES,
  CostWithRelations,
  CostStatus,
  CostCategory,
} from '@/types/costs';
import { QueryErrorState } from '@/components/common/QueryErrorState';
import { CostDetailDialog } from '@/components/costs/CostDetailDialog';
import { ServiceDetailsModal } from '@/components/services/ServiceDetailsModal';
import { exportCostsToCSV, exportServiceCostsToCSV, exportServiceCostsToExcel, exportServiceCostsToPDF } from '@/lib/costExport';
import { useCatalogs } from '@/hooks/useCatalogs';
import { useCatalogSubcategories } from '@/hooks/useCatalogSubcategories';
import { useAddServiceCost, useDeleteServiceCost, useUpdateServiceCost } from '@/hooks/useServiceCosts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CostsPage() {
  const { isAdmin } = useAuth();
  const [filters, setFilters] = useState<CostFilters>({
    search: '',
    status: 'all',
    category: 'all',
  });
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedCost, setSelectedCost] = useState<CostWithRelations | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [rejectReason, setRejectReason] = useState('');

  const effectiveFilters: CostFilters = {
    ...filters,
    dateFrom: dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    dateTo: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
  };

  const { costs, isLoading, error, refetch, deleteCost, approveCost, rejectCost, submitForApproval } = useCosts(effectiveFilters);
  const { data: stats } = useCostStats(effectiveFilters.dateFrom, effectiveFilters.dateTo);

  const {
    rows: serviceCosts,
    metrics: serviceCostMetrics,
    isLoading: isServiceCostsLoading,
    refetch: refetchServiceCosts,
  } = useServiceCostsLedger({
    search: filters.search,
    dateFrom: effectiveFilters.dateFrom,
    dateTo: effectiveFilters.dateTo,
  });

  const { catalogs: costCategories } = useCatalogs('cost_category');

  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize] = useState(10);
  const [ledgerSortDesc, setLedgerSortDesc] = useState(true);

  const [serviceCostDialogOpen, setServiceCostDialogOpen] = useState(false);
  const [serviceCostDialogMode, setServiceCostDialogMode] = useState<'view' | 'edit' | 'duplicate'>('view');
  const [serviceCostDialogRecord, setServiceCostDialogRecord] = useState<{
    id: string | null;
    service_id: string;
    description: string;
    amount: number;
    category_id: string;
    subcategory: string;
    cost_date: string;
  } | null>(null);

  const addServiceCost = useAddServiceCost();
  const [serviceDetailsId, setServiceDetailsId] = useState<string | null>(null);
  const updateServiceCost = useUpdateServiceCost();
  const deleteServiceCost = useDeleteServiceCost();

  const { data: dialogSubcategories = [] } = useCatalogSubcategories(
    serviceCostDialogRecord?.category_id || null
  );

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCost.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleReject = async () => {
    if (rejectDialog.id && rejectReason.trim()) {
      await rejectCost.mutateAsync({ id: rejectDialog.id, reason: rejectReason });
      setRejectDialog({ open: false, id: null });
      setRejectReason('');
    }
  };

  const handleExport = (
    exportFn: (data: any[], ...args: any[]) => boolean,
    data: any[],
    ...args: any[]
  ) => {
    const success = exportFn(data, ...args);
    if (success) {
      toast.success('Exportación completada');
    } else {
      toast.error('No hay datos para exportar');
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '$0';
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value);
  };

  const categoriesMap = useMemo(() => {
    return costCategories.reduce((acc, cat) => {
      acc[cat.id] = cat.name;
      return acc;
    }, {} as Record<string, string>);
  }, [costCategories]);

  const sortedServiceCosts = useMemo(() => {
    let rows = [...serviceCosts];
    
    // Client-side category filtering
    if (filters.category && filters.category !== 'all') {
      rows = rows.filter(row => row.category_id === filters.category);
    }

    rows.sort((a, b) => {
      const aDate = a.cost_date ? new Date(a.cost_date).getTime() : 0;
      const bDate = b.cost_date ? new Date(b.cost_date).getTime() : 0;
      return ledgerSortDesc ? bDate - aDate : aDate - bDate;
    });
    return rows;
  }, [serviceCosts, ledgerSortDesc, filters.category]);

  const totalLedgerPages = Math.max(1, Math.ceil(sortedServiceCosts.length / ledgerPageSize));
  const currentLedgerPage = Math.min(ledgerPage, totalLedgerPages);

  const paginatedServiceCosts = useMemo(() => {
    const start = (currentLedgerPage - 1) * ledgerPageSize;
    const end = start + ledgerPageSize;
    return sortedServiceCosts.slice(start, end);
  }, [sortedServiceCosts, currentLedgerPage, ledgerPageSize]);

  const openServiceCostDialog = (mode: 'view' | 'edit' | 'duplicate', row: typeof serviceCosts[number]) => {
    if (!row.service_id) {
      toast.error('El costo no está asociado a ningún servicio');
      return;
    }

    setServiceCostDialogMode(mode);
    setServiceCostDialogRecord({
      id: mode === 'duplicate' ? null : row.id,
      service_id: row.service_id,
      description: row.description,
      amount: Number(row.amount || 0),
      category_id: row.category_id || '',
      subcategory: row.subcategory || '',
      cost_date: row.cost_date || new Date().toISOString().split('T')[0],
    });
    setServiceCostDialogOpen(true);
  };

  const handleServiceCostDialogSave = async () => {
    if (!serviceCostDialogRecord) return;

    const { id, service_id, description, amount, category_id, subcategory, cost_date } = serviceCostDialogRecord;

    if (!cost_date) {
      toast.error('La fecha es obligatoria');
      return;
    }

    if (!description.trim()) {
      toast.error('La descripción es obligatoria');
      return;
    }

    if (description.length > 200) {
      toast.error('La descripción no puede superar los 200 caracteres');
      return;
    }

    if (!category_id) {
      toast.error('La categoría es obligatoria');
      return;
    }

    if (amount <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }

    const roundedAmount = Math.round(amount * 100) / 100;

    try {
      if (id && serviceCostDialogMode === 'edit') {
        await updateServiceCost.mutateAsync({
          id,
          service_id,
          description: description.trim(),
          amount: roundedAmount,
          category_id,
          subcategory: subcategory || null,
          cost_date,
        } as any);
        toast.success('Costo actualizado correctamente');
      } else if (serviceCostDialogMode === 'duplicate') {
        await addServiceCost.mutateAsync({
          service_id,
          description: description.trim(),
          amount: roundedAmount,
          category_id,
          subcategory: subcategory || null,
          cost_date,
        });
        toast.success('Costo duplicado correctamente');
      }

      setServiceCostDialogOpen(false);
      setServiceCostDialogRecord(null);
      refetchServiceCosts();
    } catch (error: any) {
      toast.error(error?.message || 'Error al guardar el costo');
    }
  };

  const handleDeleteServiceCost = async (rowId: string, serviceId: string) => {
    try {
      await deleteServiceCost.mutateAsync({ id: rowId, service_id: serviceId });
      toast.success('Costo eliminado correctamente');
      refetchServiceCosts();
    } catch (error: any) {
      toast.error(error?.message || 'Error al eliminar el costo');
    }
  };

  if (error) {
    return <QueryErrorState error={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Costos</h1>
          <p className="text-muted-foreground">
            Costos operativos y costos registrados dentro de servicios
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportCostsToCSV(costs)}>
                <FileText className="w-4 h-4 mrhandl-E2" />(export, 
                Costos Operativos (CSV)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => exportServiceCostsToCSV(sortedServiceCosts, categoriesMap)}>
                <FileText className="w-4 h-4 mrhandl-E2" />(export, 
                Costos de Servicios (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportServiceCostsToExcel(sortedServiceCosts, categoriesMap)}>
                <FileSpreadsheet className="w-4handleExport( h-4 mr-2" />, 
                Costos de Servicios (Excel)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportServiceCostsToPDF(sortedServiceCosts, categoriesMap)}>
                <FileText className="w-4 h-4 mrhandleExport(-2" />, 
                Costos de Servicios (PDF)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild>
            <Link to="/costos/nuevo">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Costo
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:w-[420px]">
          <TabsTrigger value="services" className="gap-2">
            <Wrench className="w-4 h-4" />
            Costos de Servicios ({serviceCostMetrics.total})
          </TabsTrigger>
          <TabsTrigger value="operational" className="gap-2">
            Costos Operativos ({costs.length})
          </TabsTrigger>
        </TabsList>

        {/* Stats Cards - Service Costs */}
        <TabsContent value="services" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Costos (Servicios)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(serviceCostMetrics.totalAmount)}</div>
                <p className="text-xs text-muted-foreground">{serviceCostMetrics.total} registros</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters (shared search + date range) */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1">
                  <Label className="sr-only">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por descripción..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="w-full md:w-auto">
                  <Label className="text-xs text-muted-foreground mb-1 block">Categoría</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full md:w-[200px] justify-between",
                          !filters.category && "text-muted-foreground"
                        )}
                      >
                        {filters.category && filters.category !== 'all'
                          ? categoriesMap[filters.category]
                          : "Todas las categorías"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar categoría..." />
                        <CommandList>
                          <CommandEmpty>No se encontró la categoría.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="all"
                              onSelect={() => setFilters({ ...filters, category: 'all' })}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  filters.category === 'all' ? "opacity-100" : "opacity-0"
                                )}
                              />
                              Todas las categorías
                            </CommandItem>
                            {costCategories.map((category) => (
                              <CommandItem
                                key={category.id}
                                value={category.name}
                                onSelect={() => {
                                  setFilters({ ...filters, category: category.id as any });
                                  setLedgerPage(1);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    filters.category === category.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {category.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="w-full md:w-auto">
                  <Label className="text-xs text-muted-foreground mb-1 block">Período</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full md:w-[240px] justify-start text-left font-normal">
                        <Filter className="w-4 h-4 mr-2" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, 'dd/MM/yy')} - {format(dateRange.to, 'dd/MM/yy')}
                            </>
                          ) : (
                            format(dateRange.from, 'dd/MM/yyyy')
                          )
                        ) : (
                          'Seleccionar fechas'
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={{ from: dateRange.from, to: dateRange.to }}
                        onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                        locale={es}
                        numberOfMonths={2}
                      />
                      <div className="p-3 border-t flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setDateRange({})}>
                          Limpiar
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table - Service Costs */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => setLedgerSortDesc(!ledgerSortDesc)}>
                      Fecha
                    </TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Subcategoría</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead>Asociado a servicio</TableHead>
                    <TableHead className="w-[120px] text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isServiceCostsLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : paginatedServiceCosts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No se encontraron costos de servicios con los filtros aplicados
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedServiceCosts.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.cost_date ? format(new Date(row.cost_date), 'dd/MM/yyyy') : '—'}
                        </TableCell>
                        <TableCell className="max-w-[260px] truncate">
                          {row.description}
                        </TableCell>
                        <TableCell>
                          {row.category_id ? (categoriesMap[row.category_id] || '—') : '—'}
                        </TableCell>
                        <TableCell>{row.subcategory || '—'}</TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {formatCurrency(Number(row.amount || 0))}
                        </TableCell>
                        <TableCell>
                          {row.service ? (
                            <button
                              type="button"
                              className="text-primary underline-offset-2 hover:underline text-sm"
                              onClick={() => setServiceDetailsId(row.service?.id || null)}
                            >
                              Servicio {row.service.folio}
                            </button>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openServiceCostDialog('view', row)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openServiceCostDialog('edit', row)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openServiceCostDialog('duplicate', row)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar este costo?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. El registro será eliminado permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteServiceCost(row.id, row.service_id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <div>
              Mostrando {(currentLedgerPage - 1) * ledgerPageSize + 1}-
              {Math.min(currentLedgerPage * ledgerPageSize, sortedServiceCosts.length)} de {sortedServiceCosts.length} registros
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={currentLedgerPage === 1}
                onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span>
                Página {currentLedgerPage} de {totalLedgerPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={currentLedgerPage === totalLedgerPages}
                onClick={() => setLedgerPage((p) => Math.min(totalLedgerPages, p + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Existing Operational Costs UI */}
        <TabsContent value="operational" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Costos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats?.totalCosts || 0)}</div>
                <p className="text-xs text-muted-foreground">{stats?.totalCount || 0} registros</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Aprobados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(stats?.approvedTotal || 0)}</div>
                <p className="text-xs text-muted-foreground">{stats?.approvedCount || 0} registros</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{formatCurrency(stats?.pendingTotal || 0)}</div>
                <p className="text-xs text-muted-foreground">{stats?.pendingCount || 0} registros</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Este Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{costs.length}</div>
                <p className="text-xs text-muted-foreground">registros filtrados</p>
              </CardContent>
            </Card>
          </div>


          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1">
                  <Label className="sr-only">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por código o descripción..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="w-full md:w-40">
                  <Label className="text-xs text-muted-foreground mb-1 block">Estado</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value as CostStatus | 'all' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {COST_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {COST_STATUS_CONFIG[status].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-40">
                  <Label className="text-xs text-muted-foreground mb-1 block">Categoría</Label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => setFilters({ ...filters, category: value as CostCategory | 'all' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {COST_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {COST_CATEGORY_CONFIG[cat].icon} {COST_CATEGORY_CONFIG[cat].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-auto">
                  <Label className="text-xs text-muted-foreground mb-1 block">Período</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full md:w-[240px] justify-start text-left font-normal">
                        <Filter className="w-4 h-4 mr-2" />
                        {dateRange.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, 'dd/MM/yy')} - {format(dateRange.to, 'dd/MM/yy')}
                            </>
                          ) : (
                            format(dateRange.from, 'dd/MM/yyyy')
                          )
                        ) : (
                          'Seleccionar fechas'
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={{ from: dateRange.from, to: dateRange.to }}
                        onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                        locale={es}
                        numberOfMonths={2}
                      />
                      <div className="p-3 border-t flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setDateRange({})}>
                          Limpiar
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">V. Unitario</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Desc.</TableHead>
                    <TableHead className="text-right">IVA</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 12 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : costs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="h-32 text-center text-muted-foreground">
                        No se encontraron costos con los filtros aplicados
                      </TableCell>
                    </TableRow>
                  ) : (
                    costs.map((cost) => (
                      <TableRow key={cost.id}>
                        <TableCell className="font-mono text-sm">{cost.code}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{cost.description}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            {COST_CATEGORY_CONFIG[cost.category].icon}
                            <span className="text-sm">{COST_CATEGORY_CONFIG[cost.category].label}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">{cost.quantity}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(Number(cost.unit_value))}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(Number(cost.subtotal))}</TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {cost.discount > 0 ? `-${formatCurrency(Number(cost.discount))}` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {formatCurrency(Number(cost.tax_amount))}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">{formatCurrency(Number(cost.total))}</TableCell>
                        <TableCell>
                          <Badge className={`${COST_STATUS_CONFIG[cost.status].bgColor} ${COST_STATUS_CONFIG[cost.status].textColor} border-0`}>
                            {COST_STATUS_CONFIG[cost.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(cost.cost_date), 'dd/MM/yy')}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedCost(cost)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver detalle
                              </DropdownMenuItem>
                              {cost.status !== 'approved' && (
                                <DropdownMenuItem asChild>
                                  <Link to={`/costos/${cost.id}/editar`}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {cost.status === 'draft' && (
                                <DropdownMenuItem onClick={() => submitForApproval.mutate(cost.id)}>
                                  <SendHorizontal className="w-4 h-4 mr-2" />
                                  Enviar a aprobación
                                </DropdownMenuItem>
                              )}
                              {(cost.status === 'pending_approval' || cost.status === 'draft') && isAdmin() && (
                                <>
                                  <DropdownMenuItem onClick={() => approveCost.mutate(cost.id)}>
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                    Aprobar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setRejectDialog({ open: true, id: cost.id })}>
                                    <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                    Rechazar
                                  </DropdownMenuItem>
                                </>
                              )}
                              {isAdmin() && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteId(cost.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Detail Dialog */}
          <CostDetailDialog 
            cost={selectedCost} 
            open={!!selectedCost} 
            onOpenChange={(open) => !open && setSelectedCost(null)} 
          />

          {/* Delete Confirmation */}
          <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar este costo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. El registro será eliminado permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Reject Dialog */}
          <Dialog open={rejectDialog.open} onOpenChange={(open) => !open && setRejectDialog({ open: false, id: null })}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rechazar costo</DialogTitle>
                <DialogDescription>
                  Indica el motivo del rechazo para que el usuario pueda corregir el registro.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reject-reason">Motivo del rechazo</Label>
                  <Textarea
                    id="reject-reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Describe el motivo del rechazo..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectDialog({ open: false, id: null })}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                >
                  Rechazar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      {/* Service Cost Dialog */}
      <Dialog open={serviceCostDialogOpen} onOpenChange={setServiceCostDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {serviceCostDialogMode === 'view' ? 'Detalles del Costo' : 
               serviceCostDialogMode === 'edit' ? 'Editar Costo' : 'Duplicar Costo'}
            </DialogTitle>
            <DialogDescription>
              {serviceCostDialogMode === 'view' ? 'Información detallada del registro de costo.' :
               'Modifica la información del costo asociado al servicio.'}
            </DialogDescription>
          </DialogHeader>
          
          {serviceCostDialogRecord && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={serviceCostDialogRecord.description}
                  disabled={serviceCostDialogMode === 'view'}
                  onChange={(e) => setServiceCostDialogRecord({ ...serviceCostDialogRecord, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="amount">Monto</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={serviceCostDialogRecord.amount}
                    disabled={serviceCostDialogMode === 'view'}
                    onChange={(e) => setServiceCostDialogRecord({ ...serviceCostDialogRecord, amount: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={serviceCostDialogRecord.cost_date}
                    disabled={serviceCostDialogMode === 'view'}
                    onChange={(e) => setServiceCostDialogRecord({ ...serviceCostDialogRecord, cost_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Categoría</Label>
                  <Select
                    value={serviceCostDialogRecord.category_id}
                    disabled={serviceCostDialogMode === 'view'}
                    onValueChange={(value) => setServiceCostDialogRecord({ ...serviceCostDialogRecord, category_id: value, subcategory: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {costCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Subcategoría</Label>
                  <Select
                    value={serviceCostDialogRecord.subcategory}
                    disabled={serviceCostDialogMode === 'view' || !serviceCostDialogRecord.category_id}
                    onValueChange={(value) => setServiceCostDialogRecord({ ...serviceCostDialogRecord, subcategory: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {dialogSubcategories.map((sub) => (
                        <SelectItem key={sub.id} value={sub.name}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceCostDialogOpen(false)}>
              {serviceCostDialogMode === 'view' ? 'Cerrar' : 'Cancelar'}
            </Button>
            {serviceCostDialogMode !== 'view' && (
              <Button onClick={handleServiceCostDialogSave}>
                Guardar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ServiceDetailsModal
        isOpen={!!serviceDetailsId}
        onOpenChange={(open) => !open && setServiceDetailsId(null)}
        serviceId={serviceDetailsId}
      />
    </div>
  );
}

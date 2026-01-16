import { useState } from 'react';
import { Calculator, Search, MoreVertical, Check, DollarSign, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useCommissions } from '@/hooks/useCommissions';
import { useServiceCommissionsLedger } from '@/hooks/useServiceCommissionsLedger';
import { COMMISSION_STATUS_CONFIG, formatCurrency } from '@/types/finance';
import type { CommissionStatus } from '@/types/finance';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { GenerateCommissionsDialog } from '@/components/finance/GenerateCommissionsDialog';

export default function CommissionsPage() {
  const { commissions, metrics, isLoading, approveCommission, markAsPaid, deleteCommission } = useCommissions();
  const { rows: serviceCommissions, metrics: serviceMetrics, isLoading: isServiceLoading } = useServiceCommissionsLedger();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  const filteredLiquidations = commissions.filter((c) => {
    const matchesSearch = (c.operator as any)?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredServiceCommissions = serviceCommissions.filter((r) => {
    if (!search.trim()) return true;
    const s = search.trim().toLowerCase();
    const op = r.operator?.full_name?.toLowerCase() || '';
    const emp = r.operator?.employee_number?.toLowerCase() || '';
    const folio = r.service?.folio?.toLowerCase() || '';
    const client = r.service?.client?.name?.toLowerCase() || '';
    const role = r.role?.toLowerCase() || '';
    return op.includes(s) || emp.includes(s) || folio.includes(s) || client.includes(s) || role.includes(s);
  });

  const isAnyLoading = isLoading || isServiceLoading;
  if (isAnyLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-96" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Comisiones</h1>
          <p className="text-muted-foreground">{serviceMetrics.total} comisiones por servicio • {commissions.length} liquidaciones</p>
        </div>
        <Button onClick={() => setShowGenerateDialog(true)}>
          <Calculator className="w-4 h-4 mr-2" />
          Generar Comisiones
        </Button>
      </div>

      <GenerateCommissionsDialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog} />

      <Tabs defaultValue="service" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="service" className="gap-2">
            <Users className="w-4 h-4" />
            Por Servicio
          </TabsTrigger>
          <TabsTrigger value="liquidations" className="gap-2">
            <Calculator className="w-4 h-4" />
            Liquidaciones
          </TabsTrigger>
        </TabsList>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por operador, servicio o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <TabsContent value="liquidations" className="m-0">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(COMMISSION_STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </TabsContent>
        </div>

        <TabsContent value="service" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Registros</p>
                <p className="text-2xl font-bold">{filteredServiceCommissions.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">Total Comisión</p>
                <p className="text-2xl font-bold">{formatCurrency(filteredServiceCommissions.reduce((s, r) => s + Number(r.commission || 0), 0))}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operador</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead className="text-right">Comisión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServiceCommissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No se encontraron comisiones por servicio
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServiceCommissions.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{row.operator?.full_name || 'Operador'}</p>
                          <p className="text-xs text-muted-foreground">{row.operator?.employee_number}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{row.service?.folio || '—'}</p>
                          {row.service?.scheduled_date && (
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(row.service.scheduled_date), 'dd MMM yyyy', { locale: es })}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{row.service?.client?.name || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.role || '—'}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(Number(row.commission || 0))}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="liquidations" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Pendientes</p><p className="text-2xl font-bold text-amber-600">{metrics.pending}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Aprobadas</p><p className="text-2xl font-bold text-blue-600">{metrics.approved}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Por Pagar</p><p className="text-2xl font-bold">{formatCurrency(metrics.totalPending)}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Pagado</p><p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalPaid)}</p></CardContent></Card>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operador</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Servicios</TableHead>
                  <TableHead>Valor Servicios</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Comisión</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLiquidations.map((commission) => {
                  const statusConfig = COMMISSION_STATUS_CONFIG[commission.status as CommissionStatus];
                  const operator = commission.operator as any;
                  return (
                    <TableRow key={commission.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{operator?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{operator?.employee_number}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(commission.period_start), 'dd MMM', { locale: es })} - {format(new Date(commission.period_end), 'dd MMM yyyy', { locale: es })}
                      </TableCell>
                      <TableCell>{commission.services_count}</TableCell>
                      <TableCell>{formatCurrency(commission.total_services_value || 0)}</TableCell>
                      <TableCell><Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0`}>{statusConfig.label}</Badge></TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(commission.total_amount || 0)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {commission.status === 'pending' && (
                              <DropdownMenuItem onClick={() => approveCommission.mutate(commission.id)}><Check className="w-4 h-4 mr-2" />Aprobar</DropdownMenuItem>
                            )}
                            {commission.status === 'approved' && (
                              <DropdownMenuItem onClick={() => markAsPaid.mutate({ id: commission.id })}><DollarSign className="w-4 h-4 mr-2" />Marcar Pagada</DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(commission.id)}><Trash2 className="w-4 h-4 mr-2" />Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>¿Eliminar comisión?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => { deleteCommission.mutate(deleteId!); setDeleteId(null); }} className="bg-destructive text-destructive-foreground">Eliminar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}

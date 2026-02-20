import { useState } from 'react';
import { Plus, Search, MoreVertical, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useClosures } from '@/hooks/useClosures';
import { CLOSURE_STATUS_CONFIG, formatCurrency, getClosureNextStatuses } from '@/types/finance';
import type { ClosureStatus } from '@/types/finance';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ClosureForm, ClosureDetailDialog } from '@/components/closures';
import { BillingClosure } from '@/types/finance';

export default function ClosuresPage() {
  const { closures, metrics, isLoading, error, deleteClosure, updateStatus } = useClosures();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewClosure, setViewClosure] = useState<BillingClosure | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);

  const filteredClosures = closures.filter((c) => {
    const matchesSearch = c.folio.toLowerCase().includes(search.toLowerCase()) ||
      (c.client as any)?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-96" /></div>;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-destructive">Error al cargar cierres: {error.message}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cierres de Facturación</h1>
          <p className="text-muted-foreground">{closures.length} cierres • {metrics.pendingApproval} pendientes de aprobación</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} className="bg-violet-600 hover:bg-violet-700 text-white">
          <Plus className="w-4 h-4 mr-2" />Nuevo Cierre
        </Button>
      </div>

      <ClosureForm open={showNewDialog} onOpenChange={setShowNewDialog} />

      <ClosureDetailDialog 
        closure={viewClosure} 
        open={!!viewClosure} 
        onOpenChange={(open) => !open && setViewClosure(null)} 
      />

      {/* Status metric cards - only show if we have statuses */}
      {metrics.byStatus.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.byStatus.slice(0, 4).map(({ status, count, total }) => {
            const config = CLOSURE_STATUS_CONFIG[status];
            if (!config) return null;
            return (
              <Card key={status} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(status)}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{config.icon}</span>
                    <span className="text-sm text-muted-foreground">{config.label}</span>
                  </div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(total)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por folio o cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(CLOSURE_STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.icon} {config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Folio</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Servicios</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClosures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay cierres que mostrar
                </TableCell>
              </TableRow>
            ) : (
              filteredClosures.map((closure) => {
                const statusConfig = CLOSURE_STATUS_CONFIG[closure.status as ClosureStatus];
                const nextStatuses = getClosureNextStatuses(closure.status as ClosureStatus);
                return (
                  <TableRow key={closure.id}>
                    <TableCell className="font-mono font-medium">{closure.folio}</TableCell>
                    <TableCell>{(closure.client as any)?.name || '-'}</TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(closure.period_start), 'dd MMM', { locale: es })} - {format(new Date(closure.period_end), 'dd MMM yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>{closure.services_count}</TableCell>
                    <TableCell>
                      <Badge className={`${statusConfig?.bgColor} ${statusConfig?.textColor} border-0`}>
                        {statusConfig?.icon} {statusConfig?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(closure.total || 0)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {nextStatuses.map((status) => (
                            <DropdownMenuItem key={status} onClick={() => updateStatus.mutate({ id: closure.id, status: status as any })}>
                              <ArrowRight className="w-4 h-4 mr-2" />
                              {CLOSURE_STATUS_CONFIG[status].label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setViewClosure(closure)}>
                            <Search className="w-4 h-4 mr-2" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(closure.id)}><Trash2 className="w-4 h-4 mr-2" />Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Eliminar cierre?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteClosure.mutate(deleteId!); setDeleteId(null); }} className="bg-destructive text-destructive-foreground">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Plus, Search, MoreVertical, Pencil, Trash2, Eye, Send, CheckCircle, Clock, XCircle, AlertTriangle, CreditCard, Ban, FileSpreadsheet, FileText, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useInvoices, InvoiceWithRelations } from '@/hooks/useInvoices';
import { useClosures } from '@/hooks/useClosures';
import { INVOICE_STATUS_CONFIG, formatCurrency, getInvoiceNextStatuses } from '@/types/finance';
import type { InvoiceStatus } from '@/types/finance';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { InvoiceForm, InvoiceCancellationModal } from '@/components/invoices';
import { exportInvoicesToExcel, exportInvoicesToPDF } from '@/lib/invoiceExport';

const STATUS_ICONS: Record<InvoiceStatus, React.ElementType> = {
  draft: Pencil,
  pending: Clock,
  sent: Send,
  paid: CheckCircle,
  partial: CreditCard,
  overdue: AlertTriangle,
  cancelled: XCircle,
};

export default function InvoicesPage() {
  const { invoices, metrics, isLoading, createInvoice, deleteInvoice, updateStatus } = useInvoices();
  const { updateClosure } = useClosures();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [cancellingInvoice, setCancellingInvoice] = useState<InvoiceWithRelations | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sorting and Pagination
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch = inv.folio.toLowerCase().includes(search.toLowerCase()) ||
        inv.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
        inv.fiscal_folio?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      const matchesClient = clientFilter === 'all' || inv.client?.id === clientFilter;

      const issueDate = inv.issue_date;
      const matchesFrom = !dateFrom || issueDate >= dateFrom;
      const matchesTo = !dateTo || issueDate <= dateTo;

      return matchesSearch && matchesStatus && matchesClient && matchesFrom && matchesTo;
    });
  }, [invoices, search, statusFilter, clientFilter, dateFrom, dateTo]);

  const clients = useMemo(() => {
    const unique = new Map<string, string>();
    invoices.forEach((inv) => {
      if (inv.client) {
        unique.set(inv.client.id, inv.client.name);
      }
    });
    return Array.from(unique.entries());
  }, [invoices]);

  const sortedInvoices = useMemo(() => {
    const sorted = [...filteredInvoices];
    if (sortConfig) {
      sorted.sort((a, b) => {
        let aValue: string | number = a[sortConfig.key as keyof InvoiceWithRelations] as unknown as string | number;
        let bValue: string | number = b[sortConfig.key as keyof InvoiceWithRelations] as unknown as string | number;

        // Handle nested or specific fields
        if (sortConfig.key === 'client') {
          aValue = a.client?.name || '';
          bValue = b.client?.name || '';
        } else if (sortConfig.key === 'daysToMaturity') {
          aValue = differenceInDays(new Date(a.due_date), new Date());
          bValue = differenceInDays(new Date(b.due_date), new Date());
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [filteredInvoices, sortConfig]);

  const totalPages = Math.ceil(sortedInvoices.length / itemsPerPage);
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedInvoices.slice(start, start + itemsPerPage);
  }, [sortedInvoices, currentPage, itemsPerPage]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleCreateInvoice = async (data: {
    closureId: string;
    clientId: string;
    issueDate: string;
    dueDate: string;
    status: InvoiceStatus;
    paymentTermsId?: string;
    paymentDate?: string;
    numeroFiscal?: string;
    subtotal: number;
    vat: number;
    total: number;
  }) => {
    setIsSubmitting(true);
    try {
      const invoice = await createInvoice.mutateAsync({
        billing_closure_id: data.closureId,
        client_id: data.clientId,
        issue_date: data.issueDate,
        due_date: data.dueDate,
        status: data.status,
        payment_terms_id: data.paymentTermsId || null,
        fiscal_folio: data.numeroFiscal || null,
        subtotal: data.subtotal,
        vat: data.vat,
        tax_amount: data.vat,
        total: data.total,
        balance_due: data.total,
      });

      // Update closure status to invoicing
      await updateClosure.mutateAsync({
        id: data.closureId,
        invoice_id: invoice.id,
        status: 'invoicing',
      });

      setShowFormDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelInvoice = async (data: { creditNoteNumber: string; cancellationReason: string; reasonDetails?: string }) => {
    if (!cancellingInvoice) return;
    await updateStatus.mutateAsync({ id: cancellingInvoice.id, status: 'cancelled' });
    toast.success('Factura anulada', { description: `NC ${data.creditNoteNumber} registrada` });
  };

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-96" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Facturación</h1>
          <p className="text-muted-foreground">{invoices.length} facturas</p>
        </div>
        <Button onClick={() => setShowFormDialog(true)}><Plus className="w-4 h-4 mr-2" />Nueva Factura</Button>
      </div>

      {/* New Invoice Dialog with 3-step form */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-5xl max-h-[95vh] p-0 overflow-hidden">
          <InvoiceForm
            onSubmit={handleCreateInvoice}
            onCancel={() => setShowFormDialog(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Cancellation Modal */}
      <InvoiceCancellationModal
        invoice={cancellingInvoice}
        clientName={cancellingInvoice?.client?.name || ''}
        isOpen={!!cancellingInvoice}
        onClose={() => setCancellingInvoice(null)}
        onConfirm={handleCancelInvoice}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Pendientes</p><p className="text-2xl font-bold">{metrics.pending}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Vencidas</p><p className="text-2xl font-bold text-red-600">{metrics.overdue}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Por Cobrar</p><p className="text-2xl font-bold">{formatCurrency(metrics.totalPending)}</p></CardContent></Card>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Cobrado</p><p className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalPaid)}</p></CardContent></Card>
      </div>

      <div className="flex flex-col md:flex-row gap-2 justify-between items-center">
        <div className="flex gap-2 flex-1 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por folio, fiscal o cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(INVOICE_STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              {clients.map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[135px]"
            />
            <span className="text-muted-foreground text-sm">-</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[135px]"
            />
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={() => exportInvoicesToExcel(sortedInvoices)}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportInvoicesToPDF(sortedInvoices)}>
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => requestSort('created_at')}>
                Fecha <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('fiscal_folio')}>
                Nro. Fiscal <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('client')}>
                Cliente <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('issue_date')}>
                Emisión <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('due_date')}>
                Vencimiento <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('daysToMaturity')}>
                Días Venc. <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => requestSort('total')}>
                Total <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => requestSort('status')}>
                Estado <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices.map((inv) => {
              const statusConfig = INVOICE_STATUS_CONFIG[inv.status as InvoiceStatus];
              const nextStatuses = getInvoiceNextStatuses(inv.status as InvoiceStatus);
              const canCancel = inv.status !== 'cancelled' && inv.status !== 'paid';
              const daysToMaturity = differenceInDays(new Date(inv.due_date), new Date());
              
              return (
                <TableRow key={inv.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {inv.created_at ? format(new Date(inv.created_at), 'dd/MM/yyyy') : '—'}
                  </TableCell>
                  <TableCell className="font-mono">
                    {inv.fiscal_folio || '—'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {inv.client?.name || '—'}
                  </TableCell>
                  <TableCell>
                    {format(new Date(inv.issue_date), 'dd/MM/yyyy', { locale: es })}
                  </TableCell>
                  <TableCell>
                    {format(new Date(inv.due_date), 'dd/MM/yyyy', { locale: es })}
                  </TableCell>
                  <TableCell>
                    <span className={daysToMaturity < 0 && inv.status !== 'paid' ? 'text-red-600 font-bold' : ''}>
                      {inv.status === 'paid' ? '—' : daysToMaturity}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(inv.total || 0)}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${statusConfig.bgColor} ${statusConfig.textColor} border-0`}>
                      {statusConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toast.info('Vista detallada próximamente')}>
                          <Eye className="w-4 h-4 mr-2" />Ver
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info('Edición próximamente')}>
                          <Pencil className="w-4 h-4 mr-2" />Editar
                        </DropdownMenuItem>
                        {nextStatuses.length > 0 && <DropdownMenuSeparator />}
                        {nextStatuses.map((status) => {
                          const StatusIcon = STATUS_ICONS[status];
                          return (
                            <DropdownMenuItem key={status} onClick={() => updateStatus.mutate({ id: inv.id, status })}>
                              <StatusIcon className="w-4 h-4 mr-2" />
                              {INVOICE_STATUS_CONFIG[status].label}
                            </DropdownMenuItem>
                          );
                        })}
                        {canCancel && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => setCancellingInvoice(inv)}>
                              <Ban className="w-4 h-4 mr-2" />Anular con NC
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(inv.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, sortedInvoices.length)} de {sortedInvoices.length} facturas
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>¿Eliminar factura?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteInvoice.mutate(deleteId!); setDeleteId(null); }} className="bg-destructive text-destructive-foreground">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

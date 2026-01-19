import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useReconciliation } from '@/hooks/useReconciliation';
import { useInvoices } from '@/hooks/useInvoices';
import { formatCurrency } from '@/types/finance';
import { ReconciliationHistory, SmartPaymentDialog } from '@/components/reconciliation';
import { ArrowLeftRight, Clock, CheckCircle2, AlertCircle, DollarSign, Zap, Filter, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function ReconciliationPage() {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const { 
    transactions, 
    isLoading: isReconciliationLoading, 
    unmatchTransaction,
  } = useReconciliation();

  const {
    invoices,
    metrics: invoiceMetrics,
    isLoading: isInvoicesLoading,
    updateStatus,
  } = useInvoices();

  const isLoading = isReconciliationLoading || isInvoicesLoading;

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice => {
      // Filter by status (only pending/sent/overdue/partial)
      if (['paid', 'cancelled', 'draft'].includes(invoice.status)) return false;

      // Filter by search
      const searchLower = invoiceSearch.toLowerCase();
      const matchesSearch = 
        invoice.folio?.toLowerCase().includes(searchLower) ||
        invoice.client?.name?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Filter by date
      if (dateFilter !== 'all') {
        const date = new Date(invoice.due_date);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (dateFilter === 'today' && diffDays > 0) return false;
        if (dateFilter === '7d' && diffDays > 7) return false;
        if (dateFilter === '30d' && diffDays > 30) return false;
      }

      return true;
    });
  }, [invoices, invoiceSearch, dateFilter]);

  const toggleAllInvoices = () => {
    if (selectedInvoiceIds.length === filteredInvoices.length) {
      setSelectedInvoiceIds([]);
    } else {
      setSelectedInvoiceIds(filteredInvoices.map(i => i.id));
    }
  };

  const toggleInvoice = (id: string) => {
    if (selectedInvoiceIds.includes(id)) {
      setSelectedInvoiceIds(prev => prev.filter(i => i !== id));
    } else {
      setSelectedInvoiceIds(prev => [...prev, id]);
    }
  };

  const handleConfirmPayment = async () => {
    try {
      await Promise.all(selectedInvoiceIds.map(id => 
        updateStatus.mutateAsync({ id, status: 'paid' })
      ));
      setSelectedInvoiceIds([]);
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Error updating invoices:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowLeftRight className="h-6 w-6" />
            Conciliación de Facturas
          </h1>
          <p className="text-muted-foreground">
            Gestiona y marca facturas como pagadas
          </p>
        </div>
        <Button 
          onClick={() => setPaymentDialogOpen(true)}
          className="bg-violet-600 hover:bg-violet-700"
        >
          <Zap className="h-4 w-4 mr-2" />
          Registrar Pago
        </Button>
      </div>

      {/* Metrics Summary (Invoices) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Por Cobrar</p>
                <p className="text-2xl font-bold text-amber-600">{invoiceMetrics.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagadas</p>
                <p className="text-2xl font-bold text-green-600">{invoiceMetrics.totalPaid > 1000 ? `${(invoiceMetrics.totalPaid / 1000).toFixed(1)}k` : invoiceMetrics.totalPaid}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vencidas</p>
                <p className="text-2xl font-bold text-red-600">{invoiceMetrics.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monto Pendiente</p>
                <p className="text-xl font-bold">{formatCurrency(invoiceMetrics.totalPending)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices" className="gap-2">
            <FileText className="h-4 w-4" />
            Facturas
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="h-4 w-4" />
            Historial Bancario
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Facturas pendientes de cobro</p>
                  <p className="text-xs text-muted-foreground">
                    Selecciona las facturas para marcarlas como pagadas masivamente.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Buscar por folio o cliente..."
                      value={invoiceSearch}
                      onChange={(e) => setInvoiceSearch(e.target.value)}
                      className="pl-9"
                    />
                    <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as 'all' | 'today' | '7d' | '30d')}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Vencimiento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="today">Hoy</SelectItem>
                      <SelectItem value="7d">7 días</SelectItem>
                      <SelectItem value="30d">30 días</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={filteredInvoices.length > 0 && selectedInvoiceIds.length === filteredInvoices.length}
                          onCheckedChange={toggleAllInvoices}
                        />
                      </TableHead>
                      <TableHead>Folio</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Emisión</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No se encontraron facturas pendientes.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedInvoiceIds.includes(invoice.id)}
                              onCheckedChange={() => toggleInvoice(invoice.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{invoice.folio}</TableCell>
                          <TableCell>{invoice.client?.name || 'N/A'}</TableCell>
                          <TableCell>{format(new Date(invoice.issue_date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>{format(new Date(invoice.due_date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              invoice.status === 'overdue' ? 'text-red-500 border-red-500' :
                              invoice.status === 'pending' ? 'text-amber-500 border-amber-500' :
                              'text-blue-500 border-blue-500'
                            }>
                              {invoice.status === 'overdue' ? 'Vencida' :
                               invoice.status === 'pending' ? 'Pendiente' :
                               invoice.status === 'sent' ? 'Enviada' : invoice.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  {selectedInvoiceIds.length} facturas seleccionadas
                </div>
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={selectedInvoiceIds.length === 0 || updateStatus.isPending}
                >
                  {updateStatus.isPending ? 'Procesando...' : 'Marcar como Pagadas'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              <ReconciliationHistory
                transactions={transactions}
                onUnmatch={(transactionId) => unmatchTransaction.mutate(transactionId)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SmartPaymentDialog 
        open={paymentDialogOpen} 
        onOpenChange={setPaymentDialogOpen} 
      />

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar pagos?</AlertDialogTitle>
            <AlertDialogDescription>
              Se marcarán como pagadas {selectedInvoiceIds.length} facturas. Esta acción actualizará el estado y la fecha de pago.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPayment}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

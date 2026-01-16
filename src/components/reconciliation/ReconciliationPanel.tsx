import { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, pointerWithin } from '@dnd-kit/core';
import { Search, Upload, Filter, ArrowLeftRight, CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BankTransactionCard } from './BankTransactionCard';
import { PaymentDropZone } from './PaymentDropZone';
import { ImportBankStatementDialog } from './ImportBankStatementDialog';
import type { BankTransaction, Payment, BankTransactionInsert } from '@/types/finance';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatCurrency } from '@/types/finance';

interface ReconciliationPanelProps {
  transactions: BankTransaction[];
  pendingPayments: (Payment & { 
    client?: { id: string; name: string } | null;
    invoice?: { id: string; folio: string } | null;
  })[];
  onMatch: (transactionId: string, paymentId: string) => void;
  onUnmatch: (transactionId: string) => void;
  onConfirmPayment: (paymentId: string) => Promise<void>;
  onImport: (transactions: Omit<BankTransactionInsert, 'tenant_id'>[]) => void;
  isMatching?: boolean;
  isImporting?: boolean;
}

export function ReconciliationPanel({
  transactions,
  pendingPayments,
  onMatch,
  onUnmatch,
  onConfirmPayment,
  onImport,
  isMatching,
  isImporting,
}: ReconciliationPanelProps) {
  const [txSearch, setTxSearch] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [txFilter, setTxFilter] = useState<'all' | 'pending' | 'credit' | 'debit'>('pending');
  const [importOpen, setImportOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [confirmMatch, setConfirmMatch] = useState<{ transactionId: string; paymentId: string; transaction: BankTransaction; payment: any } | null>(null);

  const activeTransaction = useMemo(() => 
    transactions.find(t => t.id === activeId),
    [transactions, activeId]
  );

  const filteredTransactions = useMemo(() => 
    transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(txSearch.toLowerCase()) ||
        t.reference?.toLowerCase().includes(txSearch.toLowerCase());
      
      if (txFilter === 'pending') return matchesSearch && t.status === 'pending';
      if (txFilter === 'credit') return matchesSearch && t.is_credit && t.status === 'pending';
      if (txFilter === 'debit') return matchesSearch && !t.is_credit && t.status === 'pending';
      return matchesSearch;
    }),
    [transactions, txSearch, txFilter]
  );

  const filteredPayments = useMemo(() =>
    pendingPayments.filter(p => {
      const searchLower = paymentSearch.toLowerCase();
      return (
        p.client?.name?.toLowerCase().includes(searchLower) ||
        p.reference_number?.toLowerCase().includes(searchLower) ||
        p.invoice?.folio?.toLowerCase().includes(searchLower)
      );
    }),
    [pendingPayments, paymentSearch]
  );

  // Find suggested matches (amounts within 5%)
  const suggestedMatches = useMemo(() => {
    const suggestions = new Set<string>();
    filteredTransactions.forEach(tx => {
      if (tx.status !== 'pending' || !tx.is_credit) return;
      const hasMatch = pendingPayments.some(p => {
        const diff = Math.abs(tx.amount - p.amount);
        return diff <= tx.amount * 0.05;
      });
      if (hasMatch) suggestions.add(tx.id);
    });
    return suggestions;
  }, [filteredTransactions, pendingPayments]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !active.data.current?.transaction) return;

    const droppedPaymentId = (over.id as string).replace('payment-', '');
    const transaction = active.data.current.transaction as BankTransaction;
    const payment = pendingPayments.find(p => p.id === droppedPaymentId);

    if (!payment) return;

    setConfirmMatch({
      transactionId: transaction.id,
      paymentId: payment.id,
      transaction,
      payment,
    });
  };

  const handleConfirmMatch = () => {
    if (confirmMatch) {
      onMatch(confirmMatch.transactionId, confirmMatch.paymentId);
      setConfirmMatch(null);
    }
  };

  const amountDiff = confirmMatch 
    ? Math.abs(confirmMatch.transaction.amount - confirmMatch.payment.amount) 
    : 0;
  const isExactMatch = amountDiff === 0;
  const isCloseMatch = amountDiff <= (confirmMatch?.transaction.amount || 0) * 0.05;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={pointerWithin}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Transactions Panel */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ArrowLeftRight className="h-5 w-5" />
                Transacciones Bancarias
              </CardTitle>
              <Button size="sm" onClick={() => setImportOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar transacción..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={txFilter} onValueChange={(v) => setTxFilter(v as any)}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="credit">Abonos</SelectItem>
                  <SelectItem value="debit">Cargos</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ScrollArea className="h-[500px] pr-3">
              <div className="space-y-2">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ArrowLeftRight className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No hay transacciones</p>
                    <Button variant="link" onClick={() => setImportOpen(true)} className="mt-2">
                      Importar estado de cuenta
                    </Button>
                  </div>
                ) : (
                  filteredTransactions.map((tx) => (
                    <BankTransactionCard
                      key={tx.id}
                      transaction={tx}
                      onUnmatch={() => onUnmatch(tx.id)}
                      suggestedMatch={suggestedMatches.has(tx.id)}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Payments Panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              Pagos Pendientes de Conciliar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, factura o referencia..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[500px] pr-3">
              <div className="space-y-3">
                {filteredPayments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="mb-2">No hay pagos pendientes de conciliar</p>
                    <p className="text-sm">Registra un pago para comenzar a conciliar</p>
                  </div>
                ) : (
                  filteredPayments.map((payment) => (
                    <PaymentDropZone
                      key={payment.id}
                      payment={payment}
                      draggedAmount={activeTransaction?.amount}
                      onConfirm={onConfirmPayment}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <DragOverlay>
        {activeTransaction && (
          <BankTransactionCard transaction={activeTransaction} />
        )}
      </DragOverlay>

      <ImportBankStatementDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={(txs) => { onImport(txs); setImportOpen(false); }}
        isImporting={isImporting}
      />

      <AlertDialog open={!!confirmMatch} onOpenChange={() => setConfirmMatch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Conciliación</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>¿Deseas conciliar estas transacciones?</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium mb-1">Transacción Bancaria</p>
                    <p className="text-muted-foreground truncate">{confirmMatch?.transaction.description}</p>
                    <p className="font-bold text-green-600 mt-1">{formatCurrency(confirmMatch?.transaction.amount || 0)}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium mb-1">Pago en Sistema</p>
                    <p className="text-muted-foreground">{confirmMatch?.payment.client?.name}</p>
                    <p className="font-bold text-green-600 mt-1">{formatCurrency(confirmMatch?.payment.amount || 0)}</p>
                  </div>
                </div>

                {!isExactMatch && (
                  <div className={`p-3 rounded-lg ${isCloseMatch ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200' : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'}`}>
                    <p className="font-medium">
                      {isCloseMatch ? '⚠️ Diferencia menor:' : '⚠️ Diferencia significativa:'} {formatCurrency(amountDiff)}
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmMatch} disabled={isMatching}>
              {isMatching ? 'Conciliando...' : 'Confirmar Conciliación'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DndContext>
  );
}

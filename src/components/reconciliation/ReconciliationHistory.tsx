import { useState } from 'react';
import { Search, Undo2, ArrowUpDown, Calendar, CheckCircle2, CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, PAYMENT_METHODS } from '@/types/finance';
import { format } from 'date-fns';
import type { BankTransactionWithPayment, Payment } from '@/types/finance';
import { usePayments } from '@/hooks/usePayments';
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

interface ReconciliationHistoryProps {
  transactions: BankTransactionWithPayment[];
  onUnmatch: (transactionId: string) => void;
  isLoading?: boolean;
}

export function ReconciliationHistory({ transactions, onUnmatch, isLoading }: ReconciliationHistoryProps) {
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [confirmUnmatch, setConfirmUnmatch] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'reconciled' | 'confirmed'>('confirmed');

  const { payments } = usePayments();

  // Bank reconciled transactions
  const matchedTransactions = transactions.filter(t => t.status === 'matched');

  // Confirmed payments (with or without bank reconciliation)
  const confirmedPayments = payments?.filter(p => p.status === 'confirmed') || [];

  const filteredTransactions = matchedTransactions
    .filter(t => {
      const searchLower = search.toLowerCase();
      return (
        t.description.toLowerCase().includes(searchLower) ||
        t.reference?.toLowerCase().includes(searchLower) ||
        (t.matched_payment as any)?.client?.name?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.matched_at || a.transaction_date).getTime();
      const dateB = new Date(b.matched_at || b.transaction_date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const filteredPayments = confirmedPayments
    .filter(p => {
      const searchLower = search.toLowerCase();
      return (
        (p as any).client?.name?.toLowerCase().includes(searchLower) ||
        p.reference_number?.toLowerCase().includes(searchLower) ||
        (p as any).invoice?.folio?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.confirmed_at || a.payment_date).getTime();
      const dateB = new Date(b.confirmed_at || b.payment_date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descripción, referencia o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'desc' | 'asc')}>
          <SelectTrigger className="w-[180px]">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Más recientes primero</SelectItem>
            <SelectItem value="asc">Más antiguos primero</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'reconciled' | 'confirmed')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="confirmed" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Pagos Confirmados ({filteredPayments.length})
          </TabsTrigger>
          <TabsTrigger value="reconciled" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Conciliaciones Bancarias ({filteredTransactions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="confirmed" className="mt-4">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Fecha Confirmación</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Factura</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No hay pagos confirmados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map((payment) => {
                    const paymentWithRelations = payment as Payment & { 
                      client?: { name: string } | null;
                      invoice?: { folio: string } | null;
                    };
                    const methodConfig = PAYMENT_METHODS[payment.payment_method as keyof typeof PAYMENT_METHODS];
                    return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {payment.confirmed_at 
                                ? format(new Date(payment.confirmed_at), 'dd/MM/yyyy') 
                                : format(new Date(payment.payment_date), 'dd/MM/yyyy')}
                            </p>
                            {payment.confirmed_at && (
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(payment.confirmed_at), 'HH:mm')}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{paymentWithRelations.client?.name || 'Cliente'}</p>
                          {payment.reference_number && (
                            <p className="text-xs text-muted-foreground">Ref: {payment.reference_number}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          {paymentWithRelations.invoice?.folio ? (
                            <Badge variant="outline">{paymentWithRelations.invoice.folio}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sin factura</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {methodConfig?.icon} {methodConfig?.label || payment.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="font-mono text-green-600 border-green-200 bg-green-50">
                            {formatCurrency(payment.amount)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="reconciled" className="mt-4">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Fecha Conciliación</TableHead>
                  <TableHead>Transacción Bancaria</TableHead>
                  <TableHead>Pago Conciliado</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      No hay conciliaciones bancarias registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => {
                    const matchedPayment = tx.matched_payment as any;
                    return (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {tx.matched_at ? format(new Date(tx.matched_at), 'dd/MM/yyyy') : '-'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {tx.matched_at ? format(new Date(tx.matched_at), 'HH:mm') : ''}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium truncate max-w-[200px]">{tx.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(tx.transaction_date), 'dd/MM/yyyy')} • {tx.reference || 'Sin ref.'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {matchedPayment ? (
                            <div>
                              <p className="font-medium">{matchedPayment.client?.name || 'Cliente'}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(matchedPayment.payment_date), 'dd/MM/yyyy')}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="font-mono text-green-600 border-green-200 bg-green-50">
                            {formatCurrency(tx.amount)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmUnmatch(tx.id)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Undo2 className="h-4 w-4 mr-1" />
                            Deshacer
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!confirmUnmatch} onOpenChange={() => setConfirmUnmatch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Deshacer conciliación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción separará la transacción bancaria del pago registrado. 
              Ambos volverán al estado pendiente de conciliar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmUnmatch) {
                  onUnmatch(confirmUnmatch);
                  setConfirmUnmatch(null);
                }
              }}
            >
              Deshacer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

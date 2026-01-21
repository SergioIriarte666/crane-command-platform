import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Calendar, 
  Building2, 
  CreditCard, 
  Download,
  X,
  History,
  Clock,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { mapTenantToCompanyInfo } from '@/lib/pdfUtils';
import { InvoiceWithRelations, useInvoiceHistory } from '@/hooks/useInvoices';
import { useClosureServices } from '@/hooks/useClosures';
import { INVOICE_STATUS_CONFIG, formatCurrency } from '@/types/finance';
import { exportInvoicesToPDF } from '@/lib/invoiceExport';

interface InvoiceDetailModalProps {
  invoice: InvoiceWithRelations | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceDetailModal({ invoice, isOpen, onClose }: InvoiceDetailModalProps) {
  const { authUser } = useAuth();
  const { data: services, isLoading: loadingServices } = useClosureServices(invoice?.billing_closure?.id || null);
  const { data: history, isLoading: loadingHistory } = useInvoiceHistory(invoice?.id || null);

  if (!invoice) return null;

  const statusConfig = INVOICE_STATUS_CONFIG[invoice.status as keyof typeof INVOICE_STATUS_CONFIG];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Factura {invoice.folio}
              {invoice.fiscal_folio && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (Fiscal: {invoice.fiscal_folio})
                </span>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge className={`${statusConfig?.bgColor} ${statusConfig?.textColor} border-0`}>
                {statusConfig?.label}
              </Badge>
              <Button variant="outline" size="sm" onClick={async () => {
                const companyInfo = mapTenantToCompanyInfo(authUser?.tenant);
                await exportInvoicesToPDF([invoice], companyInfo);
              }}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col">
          <div className="px-6 pt-2">
            <TabsList>
              <TabsTrigger value="details">Detalles</TabsTrigger>
              <TabsTrigger value="history">Historial</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="details" className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cliente */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Información del Cliente</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Nombre:</span>
                      <span className="col-span-2 font-medium">{invoice.client?.name || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">RUT/Tax ID:</span>
                      <span className="col-span-2">{invoice.client?.tax_id || 'N/A'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Código:</span>
                      <span className="col-span-2">{invoice.client?.code || 'N/A'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fechas y Pagos */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold">Fechas y Detalles</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Emisión:</span>
                      <span className="col-span-2">
                        {format(new Date(invoice.issue_date), 'dd/MM/yyyy', { locale: es })}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Vencimiento:</span>
                      <span className="col-span-2">
                        {format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: es })}
                      </span>
                    </div>
                    {invoice.paid_at && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-muted-foreground">Pagado el:</span>
                        <span className="col-span-2 text-green-600 font-medium">
                          {format(new Date(invoice.paid_at), 'dd/MM/yyyy', { locale: es })}
                        </span>
                      </div>
                    )}
                    {invoice.billing_closure && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-muted-foreground">Cierre Origen:</span>
                        <span className="col-span-2">
                          <Badge variant="secondary">{invoice.billing_closure.folio}</Badge>
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Servicios / Detalle */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Detalle de Servicios</h3>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Folio</TableHead>
                      <TableHead>Descripción / Vehículo</TableHead>
                      <TableHead>Ruta</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingServices ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                          Cargando servicios...
                        </TableCell>
                      </TableRow>
                    ) : services && services.length > 0 ? (
                      services.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell className="text-sm">
                            {service.service_date ? format(new Date(service.service_date), 'dd/MM/yyyy') : '-'}
                          </TableCell>
                          <TableCell className="font-mono text-sm">{service.service_folio}</TableCell>
                          <TableCell className="text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium">{service.service_type || 'Servicio'}</span>
                              <span className="text-xs text-muted-foreground">{service.vehicle_info}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {service.origin_destination || '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(service.total || 0)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No hay servicios asociados a este cierre.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Totales */}
            <div className="flex justify-end">
              <div className="w-full md:w-1/3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal Neto:</span>
                  <span>{formatCurrency(invoice.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">IVA (19%):</span>
                  <span>{formatCurrency(invoice.vat || invoice.tax_amount || 0)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-primary">{formatCurrency(invoice.total || 0)}</span>
                </div>
                {invoice.balance_due !== undefined && invoice.balance_due !== null && invoice.balance_due > 0 && (
                  <div className="flex justify-between text-sm text-red-600 font-medium pt-2">
                    <span>Saldo Pendiente:</span>
                    <span>{formatCurrency(invoice.balance_due)}</span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-hidden p-6 pt-0">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6 mt-4">
                {loadingHistory ? (
                  <div className="flex items-center justify-center h-24 text-muted-foreground">
                    Cargando historial...
                  </div>
                ) : history && history.length > 0 ? (
                  history.map((entry) => (
                    <div key={entry.id} className="relative pl-6 border-l-2 border-muted pb-6 last:pb-0">
                      <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-background border-2 border-primary" />
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(entry.changed_at), "dd 'de' MMMM, HH:mm", { locale: es })}</span>
                          <span>•</span>
                          <span className="font-medium text-foreground">{entry.user?.full_name || 'Usuario'}</span>
                        </div>
                        
                        <div className="mt-2 bg-muted/30 p-3 rounded-md text-sm">
                          {entry.action_type === 'create' && (
                            <span className="text-green-600 font-medium">Factura creada</span>
                          )}
                          {entry.action_type === 'status_change' && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Cambio de estado:</span>
                              <Badge variant="outline" className="text-xs">
                                {INVOICE_STATUS_CONFIG[entry.changes.status?.old as keyof typeof INVOICE_STATUS_CONFIG]?.label || entry.changes.status?.old}
                              </Badge>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <Badge className={`${INVOICE_STATUS_CONFIG[entry.changes.status?.new as keyof typeof INVOICE_STATUS_CONFIG]?.bgColor} ${INVOICE_STATUS_CONFIG[entry.changes.status?.new as keyof typeof INVOICE_STATUS_CONFIG]?.textColor} border-0 text-xs`}>
                                {INVOICE_STATUS_CONFIG[entry.changes.status?.new as keyof typeof INVOICE_STATUS_CONFIG]?.label || entry.changes.status?.new}
                              </Badge>
                            </div>
                          )}
                          {entry.action_type === 'update' && (
                            <div className="space-y-2">
                              <p className="font-medium text-blue-600">Actualización de datos:</p>
                              {Object.entries(entry.changes).map(([key, change]) => (
                                <div key={key} className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center text-xs">
                                  <span className="text-muted-foreground truncate font-mono">{key}</span>
                                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                  <span className="truncate font-medium">
                                    {typeof change.new === 'object' ? JSON.stringify(change.new) : String(change.new)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground border-2 border-dashed rounded-lg">
                    <History className="h-8 w-8 mb-2 opacity-50" />
                    <p>No hay historial registrado para esta factura.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

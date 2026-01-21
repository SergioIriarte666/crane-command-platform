import { useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, ShoppingCart, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCLP } from '@/types/clients';
import type { VipService, BatchUpdateData } from '@/types/vipPipeline';

interface BatchUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedServices: VipService[];
  onBatchUpdate: (data: BatchUpdateData) => Promise<void>;
  clientName: string;
}

export function BatchUpdateModal({
  open,
  onOpenChange,
  selectedServices,
  onBatchUpdate,
  clientName,
}: BatchUpdateModalProps) {
  const [enableQuote, setEnableQuote] = useState(true);
  const [enablePurchaseOrder, setEnablePurchaseOrder] = useState(false);
  const [autoUpdateStatus, setAutoUpdateStatus] = useState(true);
  const [excludedServices, setExcludedServices] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [batchData, setBatchData] = useState({
    quote: { baseNumber: '', startingNumber: '', prefix: 'COT-' },
    purchase_order: { baseNumber: '', startingNumber: '', prefix: 'OC-' },
  });

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setExcludedServices(new Set());
      setEnableQuote(true);
      setEnablePurchaseOrder(false);
      setAutoUpdateStatus(true);
      setBatchData({
        quote: { baseNumber: '', startingNumber: '', prefix: 'COT-' },
        purchase_order: { baseNumber: '', startingNumber: '', prefix: 'OC-' },
      });
    }
  }, [open]);

  // Active services (not excluded)
  const activeServices = useMemo(
    () => selectedServices.filter((s) => !excludedServices.has(s.id)),
    [selectedServices, excludedServices]
  );

  const totalValue = useMemo(
    () => activeServices.reduce((sum, s) => sum + (s.total || 0), 0),
    [activeServices]
  );

  const toggleExclusion = (serviceId: string) => {
    setExcludedServices((prev) => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  // Generate preview numbers
  const previewNumbers = useMemo(() => {
    return activeServices.map((service, index) => {
      let quote = '';
      let po = '';

      if (enableQuote) {
        if (batchData.quote.baseNumber) {
          quote = `${batchData.quote.prefix}${batchData.quote.baseNumber}`;
        } else if (batchData.quote.startingNumber) {
          const startNum = parseInt(batchData.quote.startingNumber) || 0;
          quote = `${batchData.quote.prefix}${startNum + index}`;
        }
      }

      if (enablePurchaseOrder) {
        if (batchData.purchase_order.baseNumber) {
          po = `${batchData.purchase_order.prefix}${batchData.purchase_order.baseNumber}`;
        } else if (batchData.purchase_order.startingNumber) {
          const startNum = parseInt(batchData.purchase_order.startingNumber) || 0;
          po = `${batchData.purchase_order.prefix}${startNum + index}`;
        }
      }

      return { serviceId: service.id, folio: service.folio, quote, po };
    });
  }, [activeServices, enableQuote, enablePurchaseOrder, batchData]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const services = activeServices.map((service, index) => {
        const serviceData: BatchUpdateData['services'][0] = { id: service.id };

        if (enableQuote) {
          if (batchData.quote.baseNumber) {
            serviceData.quote_number = `${batchData.quote.prefix}${batchData.quote.baseNumber}`;
          } else if (batchData.quote.startingNumber) {
            const startNum = parseInt(batchData.quote.startingNumber) || 0;
            serviceData.quote_number = `${batchData.quote.prefix}${startNum + index}`;
          }
        }

        if (enablePurchaseOrder) {
          if (batchData.purchase_order.baseNumber) {
            serviceData.purchase_order_number = `${batchData.purchase_order.prefix}${batchData.purchase_order.baseNumber}`;
          } else if (batchData.purchase_order.startingNumber) {
            const startNum = parseInt(batchData.purchase_order.startingNumber) || 0;
            serviceData.purchase_order_number = `${batchData.purchase_order.prefix}${startNum + index}`;
          }
        }

        if (autoUpdateStatus) {
          serviceData.target_status = enablePurchaseOrder
            ? 'with_purchase_order'
            : 'quoted';
        }

        return serviceData;
      });

      await onBatchUpdate({
        types: [
          ...(enableQuote ? ['quote' as const] : []),
          ...(enablePurchaseOrder ? ['purchase_order' as const] : []),
        ],
        services,
        auto_update_status: autoUpdateStatus,
      });

      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = activeServices.length > 0 && (enableQuote || enablePurchaseOrder);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Actualización por Lotes - {clientName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Services List */}
          <div className="w-[35%] border-r flex flex-col">
            <div className="px-4 py-3 border-b bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Servicios</span>
                <Badge variant="secondary">
                  {activeServices.length} de {selectedServices.length}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatCLP(totalValue)} total
              </p>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {selectedServices.map((service) => {
                  const isExcluded = excludedServices.has(service.id);
                  const preview = previewNumbers.find((p) => p.serviceId === service.id);
                  
                  return (
                    <div
                      key={service.id}
                      onClick={() => toggleExclusion(service.id)}
                      className={cn(
                        'flex items-start gap-3 p-2 rounded-md cursor-pointer transition-colors',
                        isExcluded 
                          ? 'bg-muted/50 opacity-50' 
                          : 'hover:bg-accent'
                      )}
                    >
                      <Checkbox 
                        checked={!isExcluded} 
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">
                            {service.folio}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatCLP(service.total || 0)}
                          </span>
                        </div>
                        {!isExcluded && (preview?.quote || preview?.po) && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {preview?.quote && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                {preview.quote}
                              </Badge>
                            )}
                            {preview?.po && (
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                {preview.po}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel: Configuration */}
          <div className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                {/* Quote Card */}
                <Card className={cn(
                  'transition-all',
                  enableQuote ? 'border-blue-500 shadow-sm' : ''
                )}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <CardTitle className="text-sm">Cotizaciones</CardTitle>
                      </div>
                      <Switch
                        checked={enableQuote}
                        onCheckedChange={setEnableQuote}
                      />
                    </div>
                  </CardHeader>
                  {enableQuote && (
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Prefijo</Label>
                          <Input
                            value={batchData.quote.prefix}
                            onChange={(e) =>
                              setBatchData((prev) => ({
                                ...prev,
                                quote: { ...prev.quote, prefix: e.target.value },
                              }))
                            }
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">N° Base (mismo)</Label>
                          <Input
                            placeholder="2024001"
                            value={batchData.quote.baseNumber}
                            onChange={(e) =>
                              setBatchData((prev) => ({
                                ...prev,
                                quote: { 
                                  ...prev.quote, 
                                  baseNumber: e.target.value,
                                  startingNumber: e.target.value ? '' : prev.quote.startingNumber,
                                },
                              }))
                            }
                            className="h-8"
                            disabled={!!batchData.quote.startingNumber}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">N° Inicial (secuencial)</Label>
                          <Input
                            placeholder="1001"
                            value={batchData.quote.startingNumber}
                            onChange={(e) =>
                              setBatchData((prev) => ({
                                ...prev,
                                quote: { 
                                  ...prev.quote, 
                                  startingNumber: e.target.value,
                                  baseNumber: e.target.value ? '' : prev.quote.baseNumber,
                                },
                              }))
                            }
                            className="h-8"
                            disabled={!!batchData.quote.baseNumber}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {batchData.quote.baseNumber 
                          ? 'Todos los servicios tendrán el mismo número'
                          : batchData.quote.startingNumber
                            ? 'Los números incrementarán secuencialmente'
                            : 'Ingrese un número base o inicial'}
                      </p>
                    </CardContent>
                  )}
                </Card>

                {/* Purchase Order Card */}
                <Card className={cn(
                  'transition-all',
                  enablePurchaseOrder ? 'border-green-500 shadow-sm' : ''
                )}>
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-green-600" />
                        <CardTitle className="text-sm">Órdenes de Compra</CardTitle>
                      </div>
                      <Switch
                        checked={enablePurchaseOrder}
                        onCheckedChange={setEnablePurchaseOrder}
                      />
                    </div>
                  </CardHeader>
                  {enablePurchaseOrder && (
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Prefijo</Label>
                          <Input
                            value={batchData.purchase_order.prefix}
                            onChange={(e) =>
                              setBatchData((prev) => ({
                                ...prev,
                                purchase_order: { ...prev.purchase_order, prefix: e.target.value },
                              }))
                            }
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">N° Base (mismo)</Label>
                          <Input
                            placeholder="2024001"
                            value={batchData.purchase_order.baseNumber}
                            onChange={(e) =>
                              setBatchData((prev) => ({
                                ...prev,
                                purchase_order: { 
                                  ...prev.purchase_order, 
                                  baseNumber: e.target.value,
                                  startingNumber: e.target.value ? '' : prev.purchase_order.startingNumber,
                                },
                              }))
                            }
                            className="h-8"
                            disabled={!!batchData.purchase_order.startingNumber}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">N° Inicial (secuencial)</Label>
                          <Input
                            placeholder="1001"
                            value={batchData.purchase_order.startingNumber}
                            onChange={(e) =>
                              setBatchData((prev) => ({
                                ...prev,
                                purchase_order: { 
                                  ...prev.purchase_order, 
                                  startingNumber: e.target.value,
                                  baseNumber: e.target.value ? '' : prev.purchase_order.baseNumber,
                                },
                              }))
                            }
                            className="h-8"
                            disabled={!!batchData.purchase_order.baseNumber}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {batchData.purchase_order.baseNumber 
                          ? 'Todos los servicios tendrán el mismo número'
                          : batchData.purchase_order.startingNumber
                            ? 'Los números incrementarán secuencialmente'
                            : 'Ingrese un número base o inicial'}
                      </p>
                    </CardContent>
                  )}
                </Card>

                <Separator />

                {/* Auto Update Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Actualizar estado automáticamente</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {enablePurchaseOrder 
                        ? 'Los servicios pasarán a "Con Orden de Compra"'
                        : enableQuote
                          ? 'Los servicios pasarán a "Cotizado"'
                          : 'Seleccione una opción arriba'}
                    </p>
                  </div>
                  <Switch
                    checked={autoUpdateStatus}
                    onCheckedChange={setAutoUpdateStatus}
                    disabled={!enableQuote && !enablePurchaseOrder}
                  />
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? 'Procesando...' : `Confirmar Actualización (${activeServices.length} servicios)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

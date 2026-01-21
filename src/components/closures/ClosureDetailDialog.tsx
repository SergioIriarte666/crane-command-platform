import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, FileText, Calendar, Building2, Receipt } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { formatCurrency, CLOSURE_STATUS_CONFIG } from "@/types/finance";
import type { BillingClosure, ClosureStatus } from "@/types/finance";
import { useClosureServices } from "@/hooks/useClosures";

interface ClosureDetailDialogProps {
  closure: BillingClosure | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClosureDetailDialog({
  closure,
  open,
  onOpenChange,
}: ClosureDetailDialogProps) {
  const { data: services, isLoading } = useClosureServices(closure?.id || null);

  if (!closure) return null;

  const statusConfig = CLOSURE_STATUS_CONFIG[closure.status as ClosureStatus];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between mr-8">
            <DialogTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Cierre {closure.folio}
            </DialogTitle>
            <Badge className={`${statusConfig?.bgColor} ${statusConfig?.textColor} border-0`}>
              {statusConfig?.icon} {statusConfig?.label}
            </Badge>
          </div>
          <DialogDescription>
            Detalle de servicios incluidos en el cierre de facturación
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y bg-muted/20 -mx-6 px-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              Cliente
            </div>
            <p className="font-medium text-sm truncate">
              {(closure as any).client?.name || '—'}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Período
            </div>
            <p className="font-medium text-sm">
              {format(new Date(closure.period_start), 'dd MMM', { locale: es })} - {format(new Date(closure.period_end), 'dd MMM yyyy', { locale: es })}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Receipt className="h-3.5 w-3.5" />
              Servicios
            </div>
            <p className="font-medium text-sm">{closure.services_count}</p>
          </div>
          <div className="space-y-1 text-right">
            <div className="text-xs text-muted-foreground">Total</div>
            <p className="font-bold text-lg text-violet-600">
              {formatCurrency(closure.total || 0)}
            </p>
          </div>
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Folio</TableHead>
                  <TableHead>Equipo / Info</TableHead>
                  <TableHead>Ruta / Ubicación</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay servicios asociados a este cierre
                    </TableCell>
                  </TableRow>
                ) : (
                  services?.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="text-sm">
                        {service.service_date ? format(new Date(service.service_date), 'dd/MM/yyyy') : '—'}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {service.service_folio}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="font-medium">{service.service_type || 'Servicio'}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {service.vehicle_info}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {service.origin_destination || '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(service.total || 0)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

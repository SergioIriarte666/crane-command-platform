import { useState, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { format, differenceInDays, isPast, addDays, parseISO } from 'date-fns';
import { 
  ArrowUpDown, 
  Search,
  Download,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { InvoiceWithRelations, useInvoices } from '@/hooks/useInvoices';
import { InvoiceStatus, INVOICE_STATUS_CONFIG, INVOICE_TRANSITIONS } from '@/types/finance';
import { safeDateFormat, safeCurrencyFormat } from '@/lib/pdfUtils';
import { exportInvoicesToExcel, exportInvoicesToPDF } from '@/lib/invoiceExport';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface InvoicesTableProps {
  invoices: InvoiceWithRelations[];
  isLoading: boolean;
  onView: (invoice: InvoiceWithRelations) => void;
}

type SortConfig = {
  key: keyof InvoiceWithRelations | 'clientName' | 'daysToDue' | 'total';
  direction: 'asc' | 'desc';
};

export function InvoicesTable({ 
  invoices, 
  isLoading, 
  onView 
}: InvoicesTableProps) {
  const { updateStatus } = useInvoices();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc' });
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });

  // Filter and Sort Logic
  const filteredAndSortedInvoices = useMemo(() => {
    let result = [...invoices];

    // Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(inv => 
        inv.fiscal_folio?.toLowerCase().includes(lowerSearch) ||
        inv.folio.toLowerCase().includes(lowerSearch) ||
        inv.client?.name?.toLowerCase().includes(lowerSearch) ||
        inv.client?.code?.toLowerCase().includes(lowerSearch)
      );
    }

    // Status Filter
    if (selectedStatus && selectedStatus !== 'all') {
      result = result.filter(inv => inv.status === selectedStatus);
    }

    // Client Filter (simple implementation matching client name)
    if (selectedClient && selectedClient !== 'all') {
      result = result.filter(inv => inv.client?.id === selectedClient);
    }

    // Date Range Filter (applies to created_at or issue_date? "Fecha" usually refers to issue_date for invoices, but let's use created_at as generic or issue_date)
    // User requirement: "Fecha: ... Mismas características que en costos". Costs used cost_date. Here we probably use issue_date.
    if (dateRange.from) {
      result = result.filter(inv => inv.issue_date >= dateRange.from);
    }
    if (dateRange.to) {
      result = result.filter(inv => inv.issue_date <= dateRange.to);
    }

    // Sort
    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'clientName':
          aValue = a.client?.name?.toLowerCase() || '';
          bValue = b.client?.name?.toLowerCase() || '';
          break;
        case 'daysToDue':
          aValue = differenceInDays(new Date(a.due_date), new Date());
          bValue = differenceInDays(new Date(b.due_date), new Date());
          break;
        case 'total':
          aValue = a.total || 0;
          bValue = b.total || 0;
          break;
        default:
          aValue = a[sortConfig.key as keyof InvoiceWithRelations];
          bValue = b[sortConfig.key as keyof InvoiceWithRelations];
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [invoices, searchTerm, selectedStatus, selectedClient, sortConfig, dateRange]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedInvoices.length / pageSize);
  const paginatedInvoices = filteredAndSortedInvoices.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (key: SortConfig['key']) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleStatusChange = (id: string, newStatus: InvoiceStatus) => {
    updateStatus.mutate({ id, status: newStatus });
  };

  const getDaysToDueColor = (days: number, status: string) => {
    if (status === 'paid' || status === 'cancelled') return 'text-gray-500';
    if (days < 0) return 'text-red-600 font-bold';
    if (days <= 7) return 'text-amber-600 font-medium';
    return 'text-green-600';
  };

  // Unique clients for filter
  const clients = useMemo(() => {
    const uniqueClients = new Map();
    invoices.forEach(inv => {
      if (inv.client) {
        uniqueClients.set(inv.client.id, inv.client.name);
      }
    });
    return Array.from(uniqueClients.entries());
  }, [invoices]);

  const handleExportExcel = () => {
    const success = exportInvoicesToExcel(filteredAndSortedInvoices);
    if (success) toast.success('Exportado a Excel');
  };

  const handleExportPDF = async () => {
    const success = await exportInvoicesToPDF(filteredAndSortedInvoices);
    if (success) toast.success('PDF Generado');
  };

  if (isLoading) {
    return <div className="p-8 text-center">Cargando facturas...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-1 gap-4 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar por folio, cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[150px]">
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

          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[180px]">
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
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="w-auto"
              />
              <span className="text-gray-500">-</span>
              <Input 
                type="date" 
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="w-auto"
              />
          </div>
        </div>

        <div className="flex gap-2">
            <Button onClick={handleExportExcel} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" /> Excel
            </Button>
            <Button onClick={handleExportPDF} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" /> PDF
            </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead onClick={() => handleSort('issue_date')} className="cursor-pointer hover:text-primary">
                Fecha Emisión <ArrowUpDown className="h-3 w-3 inline ml-1" />
              </TableHead>
              <TableHead onClick={() => handleSort('fiscal_folio')} className="cursor-pointer hover:text-primary">
                Nro. Fiscal <ArrowUpDown className="h-3 w-3 inline ml-1" />
              </TableHead>
              <TableHead onClick={() => handleSort('clientName')} className="cursor-pointer hover:text-primary">
                Cliente <ArrowUpDown className="h-3 w-3 inline ml-1" />
              </TableHead>
              <TableHead onClick={() => handleSort('due_date')} className="cursor-pointer hover:text-primary">
                Vencimiento <ArrowUpDown className="h-3 w-3 inline ml-1" />
              </TableHead>
              <TableHead onClick={() => handleSort('daysToDue')} className="cursor-pointer hover:text-primary text-center">
                Días Venc. <ArrowUpDown className="h-3 w-3 inline ml-1" />
              </TableHead>
              <TableHead onClick={() => handleSort('total')} className="cursor-pointer hover:text-primary text-right">
                Total <ArrowUpDown className="h-3 w-3 inline ml-1" />
              </TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No se encontraron facturas
                </TableCell>
              </TableRow>
            ) : (
              paginatedInvoices.map((inv) => {
                const daysToDue = differenceInDays(new Date(inv.due_date), new Date());
                const isOverdue = inv.status !== 'paid' && inv.status !== 'cancelled' && isPast(new Date(inv.due_date)) && daysToDue < 0;

                return (
                  <TableRow key={inv.id} className={cn("hover:bg-gray-50/50", isOverdue && "bg-red-50/50")}>
                    <TableCell className="font-medium">
                      {safeDateFormat(inv.issue_date)}
                    </TableCell>
                    <TableCell>
                      {inv.fiscal_folio || <span className="text-gray-400 italic">Pendiente</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{inv.client?.name}</span>
                        <span className="text-xs text-gray-500">{inv.client?.tax_id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={cn(isOverdue && "text-red-600 font-bold")}>
                        {safeDateFormat(inv.due_date)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={getDaysToDueColor(daysToDue, inv.status)}>
                        {inv.status === 'paid' || inv.status === 'cancelled' ? '-' : daysToDue}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {safeCurrencyFormat(inv.total)}
                    </TableCell>
                    <TableCell>
                        <Select 
                            value={inv.status} 
                            onValueChange={(val) => handleStatusChange(inv.id, val as InvoiceStatus)}
                        >
                            <SelectTrigger className={cn(
                                "h-8 w-[130px]", 
                                INVOICE_STATUS_CONFIG[inv.status as InvoiceStatus]?.bgColor,
                                INVOICE_STATUS_CONFIG[inv.status as InvoiceStatus]?.textColor
                            )}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(INVOICE_STATUS_CONFIG).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>
                                        {config.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => onView(inv)}>
                        <Calendar className="h-4 w-4" /> {/* Using Calendar icon as placeholder for details */}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <Button 
                variant="ghost" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
            </PaginationItem>
            <PaginationItem>
              <span className="px-4 text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
               <Button 
                variant="ghost" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

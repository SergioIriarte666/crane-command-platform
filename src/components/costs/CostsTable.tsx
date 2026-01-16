import { useState, useMemo, useEffect } from 'react';
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { format } from 'date-fns';
import { 
  ArrowUpDown, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Copy, 
  Trash2, 
  Search,
  Download,
  Check,
  X
} from 'lucide-react';
import { CostWithRelations, CostCategory, COST_CATEGORY_CONFIG } from '@/types/costs';
import { safeDateFormat, safeCurrencyFormat } from '@/lib/pdfUtils';
import { exportCostsToCSV } from '@/lib/costExport';
import { toast } from 'sonner';

interface CostsTableProps {
  costs: CostWithRelations[];
  isLoading: boolean;
  filters: {
    search: string;
    category: string;
    dateFrom: string;
    dateTo: string;
  };
  onFilterChange: (filters: { search: string; category: string; dateFrom: string; dateTo: string }) => void;
  onEdit: (cost: CostWithRelations) => void;
  onUpdate: (id: string, data: Partial<CostWithRelations>) => Promise<void>;
  onDelete: (id: string) => void;
  onDuplicate: (cost: CostWithRelations) => void;
  onView: (cost: CostWithRelations) => void;
}

type SortConfig = {
  key: keyof CostWithRelations | 'amount' | 'date';
  direction: 'asc' | 'desc';
};

export function CostsTable({ 
  costs, 
  isLoading, 
  filters,
  onFilterChange,
  onEdit, 
  onUpdate,
  onDelete, 
  onDuplicate, 
  onView 
}: CostsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });
  
  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Sort Logic (Client-side, as data is already filtered by parent)
  const sortedCosts = useMemo(() => {
    let result = [...costs];

    result.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'date':
          aValue = new Date(a.cost_date).getTime();
          bValue = new Date(b.cost_date).getTime();
          break;
        case 'amount':
          aValue = a.total || 0;
          bValue = b.total || 0;
          break;
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        default:
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [costs, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedCosts.length / pageSize);
  const paginatedCosts = sortedCosts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalAmount = useMemo(() => {
    return sortedCosts.reduce((sum, cost) => sum + (cost.total || 0), 0);
  }, [sortedCosts]);

  const handleSort = (key: SortConfig['key']) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleExport = () => {
    const success = exportCostsToCSV(sortedCosts);
    if (success) {
      toast.success('Costos exportados correctamente');
    }
  };

  const startEditing = (cost: CostWithRelations) => {
    setEditingId(cost.id);
    setEditDescription(cost.description);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDescription('');
  };

  const saveDescription = async (id: string) => {
    if (editDescription.trim() === '') {
      toast.error('La descripción no puede estar vacía');
      return;
    }
    if (editDescription.length > 255) {
      toast.error('La descripción no puede superar los 255 caracteres');
      return;
    }

    try {
      await onUpdate(id, { description: editDescription });
      setEditingId(null);
    } catch (error) {
      toast.error('Error al actualizar la descripción');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Cargando costos...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-1 gap-4 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 md:max-w-xs min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar por descripción, código..."
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              className="pl-8"
            />
          </div>
          
          <Select 
            value={filters.category} 
            onValueChange={(val) => onFilterChange({ ...filters, category: val })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {Object.entries(COST_CATEGORY_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Subcategory Filter - Dependent on Category (Mocked as we don't have subcategories yet) */}
          {filters.category !== 'all' && (
             <Select disabled>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Subcategoría (N/A)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                </SelectContent>
             </Select>
          )}

          <div className="flex items-center gap-2">
             <Input 
                type="date" 
                value={filters.dateFrom}
                onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value })}
                className="w-auto"
              />
              <span className="text-gray-500">-</span>
              <Input 
                type="date" 
                value={filters.dateTo}
                onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value })}
                className="w-auto"
              />
          </div>
        </div>

        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              <TableHead onClick={() => handleSort('date')} className="cursor-pointer hover:text-primary">
                <div className="flex items-center gap-1">
                  Fecha <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead onClick={() => handleSort('description')} className="cursor-pointer hover:text-primary">
                <div className="flex items-center gap-1">
                  Descripción <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Subcategoría</TableHead>
              <TableHead onClick={() => handleSort('amount')} className="cursor-pointer hover:text-primary text-right">
                <div className="flex items-center justify-end gap-1">
                  Monto <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead>Asociado a</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCosts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron resultados
                </TableCell>
              </TableRow>
            ) : (
              paginatedCosts.map((cost) => (
                <TableRow key={cost.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium">
                    {safeDateFormat(cost.cost_date)}
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    {editingId === cost.id ? (
                      <div className="flex items-center gap-2">
                        <Input 
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveDescription(cost.id);
                            if (e.key === 'Escape') cancelEditing();
                          }}
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => saveDescription(cost.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={cancelEditing}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="truncate cursor-pointer hover:text-blue-600 flex items-center gap-2 group"
                        title={cost.description}
                        onClick={() => startEditing(cost)}
                      >
                        {cost.description}
                        <Edit className="h-3 w-3 opacity-0 group-hover:opacity-50" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-gray-100 font-normal">
                      {COST_CATEGORY_CONFIG[cost.category]?.label || cost.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {cost.subcategory_id ? 'Definido' : '-'} 
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {safeCurrencyFormat(cost.total)}
                  </TableCell>
                  <TableCell>
                    {cost.service ? (
                      <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:text-blue-700 p-0 font-normal">
                        Servicio #{cost.service.folio}
                      </Button>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(cost)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(cost)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(cost)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDelete(cost.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          {/* Footer with Totals */}
          {paginatedCosts.length > 0 && (
            <tfoot className="bg-gray-50 border-t font-medium">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right">Total:</td>
                <td className="px-4 py-3 text-right font-mono text-lg">
                  {safeCurrencyFormat(totalAmount)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
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

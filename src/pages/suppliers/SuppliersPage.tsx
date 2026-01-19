import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building2, Search, Filter, MoreVertical, Pencil, Trash2, Eye, Phone, Mail, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useSuppliers } from '@/hooks/useSuppliers';
import { SUPPLIER_CATEGORIES, getRatingColor } from '@/types/suppliers';
import { formatCLP } from '@/types/clients';
import type { SupplierCategory } from '@/types/suppliers';

export default function SuppliersPage() {
  const { suppliers, isLoading, deleteSupplier } = useSuppliers();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(search.toLowerCase()) ||
      supplier.code.toLowerCase().includes(search.toLowerCase()) ||
      supplier.trade_name?.toLowerCase().includes(search.toLowerCase()) ||
      supplier.contact_name?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || supplier.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleDelete = async () => {
    if (deleteId) {
      await deleteSupplier.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const RatingStars = ({ rating }: { rating: number | null }) => {
    if (!rating) return <span className="text-muted-foreground text-sm">Sin calificar</span>;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proveedores</h1>
          <p className="text-muted-foreground">
            {suppliers.length} proveedores registrados
          </p>
        </div>
        <Button asChild>
          <Link to="/proveedores/nuevo">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Proveedor
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, código o contacto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {Object.entries(SUPPLIER_CATEGORIES).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.icon} {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {filteredSuppliers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No hay proveedores</h3>
            <p className="text-muted-foreground text-center max-w-sm mt-1">
              {search || categoryFilter !== 'all'
                ? 'No se encontraron proveedores con los filtros aplicados.'
                : 'Comienza agregando tu primer proveedor.'}
            </p>
            {!search && categoryFilter === 'all' && (
              <Button asChild className="mt-4">
                <Link to="/proveedores/nuevo">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Proveedor
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier) => {
            const categoryConfig = SUPPLIER_CATEGORIES[supplier.category as SupplierCategory];

            return (
              <Card key={supplier.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
                        {categoryConfig.icon}
                      </div>
                      <div>
                        <h3 className="font-bold">{supplier.name}</h3>
                        <p className="text-sm text-muted-foreground font-mono">
                          {supplier.code}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/proveedores/${supplier.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/proveedores/${supplier.id}/editar`}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(supplier.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 space-y-3">
                    <Badge variant="secondary">
                      {categoryConfig.label}
                    </Badge>

                    <div className="space-y-2 text-sm">
                      {supplier.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{supplier.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                      <div>
                        <p className="text-muted-foreground">Plazo de Pago</p>
                        <p className="font-medium">{supplier.payment_terms} días</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Límite Crédito</p>
                        <p className="font-medium">{formatCLP(supplier.credit_limit || 0)}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Calificación</p>
                      <RatingStars rating={supplier.rating} />
                    </div>

                    {supplier.contact_name && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">Contacto</p>
                        <p className="text-sm font-medium">{supplier.contact_name}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los registros
              asociados a este proveedor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

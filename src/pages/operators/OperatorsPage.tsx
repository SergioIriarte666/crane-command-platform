import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, User, Search, Filter, MoreVertical, Pencil, Trash2, Eye, FileText, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { QueryErrorState } from '@/components/common/QueryErrorState';
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
import { useOperators } from '@/hooks/useOperators';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { OPERATOR_STATUS_CONFIG, formatCommission, getInitials } from '@/types/operators';
import { getDaysUntilExpiry, getExpiryColor } from '@/types/fleet';
import type { OperatorStatus } from '@/types/operators';

export default function OperatorsPage() {
  const { operators, isLoading, error, refetch, deleteOperator } = useOperators();
  const { canCreateOperator } = usePlanLimits();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredOperators = operators.filter((op) => {
    const matchesSearch =
      op.full_name.toLowerCase().includes(search.toLowerCase()) ||
      op.employee_number.toLowerCase().includes(search.toLowerCase()) ||
      op.phone?.toLowerCase().includes(search.toLowerCase()) ||
      op.email?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || op.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDelete = async () => {
    if (deleteId) {
      await deleteOperator.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const LicenseIndicator = ({ expiryDate }: { expiryDate: string | null }) => {
    const days = getDaysUntilExpiry(expiryDate);
    const color = getExpiryColor(days);
    const colorClasses = {
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      gray: 'bg-gray-400',
    };
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${colorClasses[color]}`} />
        <span className="text-xs text-muted-foreground">
          {days === null ? 'Sin fecha' : days <= 0 ? 'Vencida' : `${days} días`}
        </span>
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

  if (error) {
    return (
      <QueryErrorState
        title="No se pudieron cargar los operadores"
        description="Se guardaron registros, pero falló la carga de la lista."
        error={error}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Operadores</h1>
          <p className="text-muted-foreground">
            {operators.length} operadores registrados
          </p>
        </div>
        {canCreateOperator ? (
          <Button asChild>
            <Link to="/operadores/nuevo">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Operador
            </Link>
          </Button>
        ) : (
          <Button disabled variant="outline">
            Límite de plan alcanzado
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, número, teléfono o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(OPERATOR_STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid de operadores */}
      {filteredOperators.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No hay operadores</h3>
            <p className="text-muted-foreground text-center max-w-sm mt-1">
              {search || statusFilter !== 'all'
                ? 'No se encontraron operadores con los filtros aplicados.'
                : 'Comienza agregando tu primer operador.'}
            </p>
            {!search && statusFilter === 'all' && (
              canCreateOperator ? (
                <Button asChild className="mt-4">
                  <Link to="/operadores/nuevo">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Operador
                  </Link>
                </Button>
              ) : (
                <Button disabled variant="outline" className="mt-4">
                  Límite de plan alcanzado
                </Button>
              )
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOperators.map((operator) => {
            const statusConfig = OPERATOR_STATUS_CONFIG[operator.status as OperatorStatus];

            return (
              <Card key={operator.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={operator.photo_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(operator.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold">{operator.full_name}</h3>
                        <p className="text-sm text-muted-foreground font-mono">
                          {operator.employee_number}
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
                          <Link to={`/operadores/${operator.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/operadores/${operator.id}/editar`}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to={`/operadores/${operator.id}/documentos`}>
                            <FileText className="w-4 h-4 mr-2" />
                            Documentos
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(operator.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 space-y-3">
                    <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                      {statusConfig.label}
                    </Badge>

                    <div className="space-y-2 text-sm">
                      {operator.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          <span>{operator.phone}</span>
                        </div>
                      )}
                      {operator.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{operator.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                      <div>
                        <p className="text-muted-foreground">Licencia</p>
                        <p className="font-medium">{operator.license_type || 'N/A'}</p>
                        <LicenseIndicator expiryDate={operator.license_expiry} />
                      </div>
                      <div>
                        <p className="text-muted-foreground">Comisión</p>
                        <p className="font-medium">{formatCommission(operator)}</p>
                      </div>
                    </div>

                    {operator.assigned_crane && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">Grúa Asignada</p>
                        <p className="text-sm font-medium">
                          {operator.assigned_crane.unit_number} - {operator.assigned_crane.brand} {operator.assigned_crane.model}
                        </p>
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
            <AlertDialogTitle>¿Eliminar operador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los registros
              asociados a este operador, incluyendo documentos.
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

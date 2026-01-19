import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Truck, Search, Filter, MoreVertical, Pencil, Trash2, Eye, Wrench, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { useCranes } from '@/hooks/useCranes';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { CRANE_TYPES, CRANE_STATUS_CONFIG, formatKm, formatTons, getDaysUntilExpiry, getExpiryColor } from '@/types/fleet';
import type { CraneStatus, CraneType } from '@/types/fleet';

export default function CranesPage() {
  const { cranes, isLoading, error, refetch, deleteCrane } = useCranes();
  const { canCreateCrane } = usePlanLimits();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredCranes = cranes.filter((crane) => {
    const matchesSearch =
      crane.unit_number.toLowerCase().includes(search.toLowerCase()) ||
      crane.brand?.toLowerCase().includes(search.toLowerCase()) ||
      crane.model?.toLowerCase().includes(search.toLowerCase()) ||
      crane.plates?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || crane.status === statusFilter;
    const matchesType = typeFilter === 'all' || crane.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleDelete = async () => {
    if (deleteId) {
      await deleteCrane.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const getDocumentStatus = (crane: typeof cranes[0]) => {
    const insuranceDays = getDaysUntilExpiry(crane.insurance_expiry);
    const permitDays = getDaysUntilExpiry(crane.permit_expiry);
    const verificationDays = getDaysUntilExpiry(crane.next_verification);

    const colors = [
      getExpiryColor(insuranceDays),
      getExpiryColor(permitDays),
      getExpiryColor(verificationDays),
    ];

    if (colors.includes('red')) return 'red';
    if (colors.includes('yellow')) return 'yellow';
    if (colors.includes('green')) return 'green';
    return 'gray';
  };

  const DocumentIndicator = ({ color }: { color: 'green' | 'yellow' | 'red' | 'gray' }) => {
    const colorClasses = {
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      gray: 'bg-gray-400',
    };
    return <div className={`w-3 h-3 rounded-full ${colorClasses[color]}`} />;
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
        title="No se pudieron cargar las grúas"
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
          <h1 className="text-2xl font-bold text-foreground">Flota de Grúas</h1>
          <p className="text-muted-foreground">
            {cranes.length} grúas registradas
          </p>
        </div>
        {canCreateCrane ? (
          <Button asChild>
            <Link to="/flota/gruas/nuevo">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Grúa
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
            placeholder="Buscar por unidad, marca, modelo o placas..."
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
            {Object.entries(CRANE_STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Truck className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(CRANE_TYPES).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid de grúas */}
      {filteredCranes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No hay grúas</h3>
            <p className="text-muted-foreground text-center max-w-sm mt-1">
              {search || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'No se encontraron grúas con los filtros aplicados.'
                : 'Comienza agregando tu primera grúa a la flota.'}
            </p>
            {!search && statusFilter === 'all' && typeFilter === 'all' && (
              canCreateCrane ? (
                <Button asChild className="mt-4">
                  <Link to="/flota/gruas/nuevo">
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Grúa
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
          {filteredCranes.map((crane) => {
            const statusConfig = CRANE_STATUS_CONFIG[crane.status as CraneStatus];
            const typeConfig = CRANE_TYPES[crane.type as CraneType];
            const docStatus = getDocumentStatus(crane);

            return (
              <Card key={crane.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                {/* Status indicator bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${statusConfig.bgColor.replace('bg-', 'bg-')}`} />
                
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Truck className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{crane.unit_number}</h3>
                        <p className="text-sm text-muted-foreground">
                          {crane.brand} {crane.model} {crane.year}
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
                          <Link to={`/flota/gruas/${crane.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/flota/gruas/${crane.id}/editar`}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to={`/flota/gruas/${crane.id}/mantenimiento`}>
                            <Wrench className="w-4 h-4 mr-2" />
                            Mantenimiento
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/flota/gruas/${crane.id}/documentos`}>
                            <FileText className="w-4 h-4 mr-2" />
                            Documentos
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(crane.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                        {statusConfig.label}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Docs</span>
                        <DocumentIndicator color={docStatus} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Tipo</p>
                        <p className="font-medium">{typeConfig.label}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Capacidad</p>
                        <p className="font-medium">{formatTons(crane.capacity_tons)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Placas</p>
                        <p className="font-medium font-mono">{crane.plates || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Kilometraje</p>
                        <p className="font-medium">{formatKm(crane.current_km)}</p>
                      </div>
                    </div>

                    {crane.assigned_operator && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">Operador Asignado</p>
                        <p className="text-sm font-medium">
                          {crane.assigned_operator.full_name}
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
            <AlertDialogTitle>¿Eliminar grúa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los registros
              asociados a esta grúa, incluyendo mantenimientos y documentos.
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

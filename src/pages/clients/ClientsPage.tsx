import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  Plus,
  Search,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Building2,
  User,
  Shield,
  Landmark,
  Loader2,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import {
  Client,
  ClientType,
  CLIENT_TYPE_LABELS,
} from '@/types/clients';

type SortKey = 'name' | 'tax_id' | 'city' | 'contact' | 'email' | 'phone' | 'is_active';

const TYPE_ICONS: Record<ClientType, React.ElementType> = {
  particular: User,
  empresa: Building2,
  aseguradora: Shield,
  gobierno: Landmark,
};

export default function ClientsPage() {
  const { clients, isLoading, deleteClient, toggleClientStatus } = useClients();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc',
  });

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.code?.toLowerCase().includes(search.toLowerCase()) ||
      client.tax_id?.toLowerCase().includes(search.toLowerCase()) ||
      client.email?.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'all' || client.type === typeFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && client.is_active) ||
      (statusFilter === 'inactive' && !client.is_active);

    return matchesSearch && matchesType && matchesStatus;
  });

  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a, b) => {
      let aValue: string | boolean = '';
      let bValue: string | boolean = '';

      switch (sortConfig.key) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'tax_id':
          aValue = a.tax_id?.toLowerCase() || '';
          bValue = b.tax_id?.toLowerCase() || '';
          break;
        case 'city':
          aValue = a.city?.toLowerCase() || '';
          bValue = b.city?.toLowerCase() || '';
          break;
        case 'contact':
          const aContact = a.contacts?.find(c => c.is_primary) || a.contacts?.[0];
          const bContact = b.contacts?.find(c => c.is_primary) || b.contacts?.[0];
          aValue = aContact?.name?.toLowerCase() || '';
          bValue = bContact?.name?.toLowerCase() || '';
          break;
        case 'email':
          aValue = a.email?.toLowerCase() || '';
          bValue = b.email?.toLowerCase() || '';
          break;
        case 'phone':
          aValue = a.phone || '';
          bValue = b.phone || '';
          break;
        case 'is_active':
          aValue = a.is_active;
          bValue = b.is_active;
          break;
      }

      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        if (aValue === bValue) return 0;
        if (sortConfig.direction === 'asc') return aValue ? -1 : 1;
        return aValue ? 1 : -1;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredClients, sortConfig]);

  const toggleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleDelete = async () => {
    if (clientToDelete) {
      await deleteClient.mutateAsync(clientToDelete.id);
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.is_active).length,
    empresas: clients.filter((c) => c.type === 'empresa').length,
    aseguradoras: clients.filter((c) => c.type === 'aseguradora').length,
  };

  const SortableHeader = ({ label, sortKey }: { label: string; sortKey: SortKey }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => toggleSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortConfig.key === sortKey ? (
          sortConfig.direction === 'asc' ? (
            <ChevronUp className="w-3 h-3 text-primary" />
          ) : (
            <ChevronDown className="w-3 h-3 text-primary" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
        )}
      </div>
    </TableHead>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona tu cartera de clientes
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90" asChild>
          <Link to="/clientes/nuevo">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Activos</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <ToggleRight className="w-5 h-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Empresas</p>
                <p className="text-2xl font-bold">{stats.empresas}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aseguradoras</p>
                <p className="text-2xl font-bold">{stats.aseguradoras}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, código, RUT o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="particular">Particular</SelectItem>
            <SelectItem value="empresa">Empresa</SelectItem>
            <SelectItem value="aseguradora">Aseguradora</SelectItem>
            <SelectItem value="gobierno">Gobierno</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Client List - Table */}
      {sortedClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No hay clientes</h3>
            <p className="text-muted-foreground mb-4">
              {search || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'No se encontraron clientes con los filtros seleccionados.'
                : 'Comienza agregando tu primer cliente.'}
            </p>
            {!search && typeFilter === 'all' && statusFilter === 'all' && (
              <Button asChild>
                <Link to="/clientes/nuevo">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Cliente
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader label="Nombre" sortKey="name" />
                <SortableHeader label="RUT" sortKey="tax_id" />
                <SortableHeader label="Departamento" sortKey="city" />
                <SortableHeader label="Contacto" sortKey="contact" />
                <SortableHeader label="Email" sortKey="email" />
                <SortableHeader label="Teléfono" sortKey="phone" />
                <SortableHeader label="Estado" sortKey="is_active" />
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedClients.map((client) => {
                const primaryContact = client.contacts?.find((c) => c.is_primary) || client.contacts?.[0];
                const TypeIcon = TYPE_ICONS[client.type];
                return (
                  <TableRow
                    key={client.id}
                    className={!client.is_active ? 'opacity-60' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <TypeIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <Link
                          to={`/clientes/${client.id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {client.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {client.tax_id || '-'}
                    </TableCell>
                    <TableCell>
                      {client.city && client.city.toLowerCase() !== 'general' ? (
                        <Badge variant="outline" className="bg-info/10 text-info border-info/20">
                          {client.city}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">General</span>
                      )}
                    </TableCell>
                    <TableCell>{primaryContact?.name || '-'}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {client.email || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {client.phone || '-'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          client.is_active
                            ? 'text-success font-medium'
                            : 'text-muted-foreground'
                        }
                      >
                        {client.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                          <Link to={`/vip/${client.id}`}>
                            <TrendingUp className="w-4 h-4" />
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem asChild>
                              <Link to={`/clientes/${client.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver detalle
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/clientes/${client.id}/editar`}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toggleClientStatus.mutate({
                                  id: client.id,
                                  is_active: !client.is_active,
                                })
                              }
                            >
                              {client.is_active ? (
                                <>
                                  <ToggleLeft className="w-4 h-4 mr-2" />
                                  Desactivar
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="w-4 h-4 mr-2" />
                                  Activar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setClientToDelete(client);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el cliente{' '}
              <strong>{clientToDelete?.name}</strong> y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteClient.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Eliminar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

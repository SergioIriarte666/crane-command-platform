import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wrench, Calendar, Plus, FileText, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCranes } from '@/hooks/useCranes';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipos locales para el MVP
type MaintenanceType = 'preventivo' | 'correctivo' | 'inspeccion';
type MaintenanceStatus = 'programado' | 'en_proceso' | 'completado' | 'cancelado';

interface MaintenanceRecord {
  id: string;
  crane_id: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  date: string;
  description: string;
  cost: number;
  performer: string; // Taller o mecánico
  next_maintenance_date?: string;
}

// Datos simulados
const MOCK_MAINTENANCE: MaintenanceRecord[] = [
  {
    id: '1',
    crane_id: '1',
    type: 'preventivo',
    status: 'completado',
    date: '2024-01-15',
    description: 'Cambio de aceite y filtros. Revisión de frenos.',
    cost: 150000,
    performer: 'Taller Central',
    next_maintenance_date: '2024-04-15',
  },
  {
    id: '2',
    crane_id: '1',
    type: 'correctivo',
    status: 'completado',
    date: '2023-12-10',
    description: 'Reparación de sistema hidráulico.',
    cost: 450000,
    performer: 'Hidráulica Express',
  },
  {
    id: '3',
    crane_id: '1',
    type: 'programado',
    status: 'programado',
    date: '2024-04-15',
    description: 'Mantenimiento preventivo trimestral.',
    cost: 0,
    performer: 'Taller Central',
  }
] as any[]; // Type assertion for mock data flexibility

export default function CraneMaintenancePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cranes } = useCranes();
  const crane = cranes.find(c => c.id === id);

  const [records, setRecords] = useState<MaintenanceRecord[]>(MOCK_MAINTENANCE);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<MaintenanceRecord>>({
    type: 'preventivo',
    status: 'programado',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSave = () => {
    if (!newRecord.date || !newRecord.description) return;

    const record: MaintenanceRecord = {
      id: Math.random().toString(36).substr(2, 9),
      crane_id: id!,
      type: newRecord.type as MaintenanceType || 'preventivo',
      status: newRecord.status as MaintenanceStatus || 'programado',
      date: newRecord.date,
      description: newRecord.description,
      cost: Number(newRecord.cost) || 0,
      performer: newRecord.performer || '',
      next_maintenance_date: newRecord.next_maintenance_date,
    };

    setRecords([record, ...records]);
    setIsDialogOpen(false);
    setNewRecord({
      type: 'preventivo',
      status: 'programado',
      date: new Date().toISOString().split('T')[0],
    });
  };

  if (!crane) return <div>Cargando...</div>;

  const getStatusBadge = (status: MaintenanceStatus) => {
    switch (status) {
      case 'completado':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Completado</Badge>;
      case 'en_proceso':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">En Proceso</Badge>;
      case 'programado':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Programado</Badge>;
      case 'cancelado':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/flota/gruas')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mantenimiento</h1>
            <p className="text-muted-foreground">
              Historial y programación para {crane.brand} {crane.model} ({crane.unit_number})
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Mantenimiento</DialogTitle>
              <DialogDescription>
                Agrega un nuevo registro de mantenimiento preventivo o correctivo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select 
                    value={newRecord.type} 
                    onValueChange={(v) => setNewRecord({...newRecord, type: v as MaintenanceType})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventivo">Preventivo</SelectItem>
                      <SelectItem value="correctivo">Correctivo</SelectItem>
                      <SelectItem value="inspeccion">Inspección</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select 
                    value={newRecord.status} 
                    onValueChange={(v) => setNewRecord({...newRecord, status: v as MaintenanceStatus})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="programado">Programado</SelectItem>
                      <SelectItem value="en_proceso">En Proceso</SelectItem>
                      <SelectItem value="completado">Completado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input 
                    type="date" 
                    value={newRecord.date}
                    onChange={(e) => setNewRecord({...newRecord, date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Costo Estimado</Label>
                  <Input 
                    type="number" 
                    placeholder="0"
                    onChange={(e) => setNewRecord({...newRecord, cost: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea 
                  placeholder="Detalles del trabajo realizado o a realizar..."
                  value={newRecord.description || ''}
                  onChange={(e) => setNewRecord({...newRecord, description: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Realizado por / Taller</Label>
                <Input 
                  placeholder="Nombre del taller o mecánico"
                  value={newRecord.performer || ''}
                  onChange={(e) => setNewRecord({...newRecord, performer: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Guardar Registro</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Mantenimiento</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Hace 15 días</div>
            <p className="text-xs text-muted-foreground">Preventivo - 15 Ene 2024</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Servicio</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15 Abr 2024</div>
            <p className="text-xs text-muted-foreground">Faltan 85 días</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gasto Total (Año)</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$600,000</div>
            <p className="text-xs text-muted-foreground">+12% vs año anterior</p>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance List */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Servicios</CardTitle>
          <CardDescription>Registro completo de actividades de mantenimiento.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {format(new Date(record.date), 'dd MMM yyyy', { locale: es })}
                  </TableCell>
                  <TableCell className="capitalize">{record.type}</TableCell>
                  <TableCell>{record.description}</TableCell>
                  <TableCell>{record.performer}</TableCell>
                  <TableCell>
                    {record.cost.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}
                  </TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
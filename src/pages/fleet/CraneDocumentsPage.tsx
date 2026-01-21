import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Upload, Download, Trash2, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCranes } from '@/hooks/useCranes';
import { format, addDays, isPast, isFuture } from 'date-fns';
import { es } from 'date-fns/locale';

type DocumentType = 'seguro' | 'revision_tecnica' | 'permiso_circulacion' | 'factura' | 'otro';

interface CraneDocument {
  id: string;
  name: string;
  type: DocumentType;
  upload_date: string;
  expiry_date?: string;
  size: string;
  status: 'vigente' | 'por_vencer' | 'vencido' | 'na';
}

const MOCK_DOCUMENTS: CraneDocument[] = [
  {
    id: '1',
    name: 'Póliza de Seguro 2024.pdf',
    type: 'seguro',
    upload_date: '2024-01-01',
    expiry_date: '2024-12-31',
    size: '2.4 MB',
    status: 'vigente',
  },
  {
    id: '2',
    name: 'Revisión Técnica.pdf',
    type: 'revision_tecnica',
    upload_date: '2023-11-15',
    expiry_date: '2024-02-15',
    size: '1.1 MB',
    status: 'por_vencer',
  },
  {
    id: '3',
    name: 'Permiso Circulación 2023.pdf',
    type: 'permiso_circulacion',
    upload_date: '2023-03-01',
    expiry_date: '2024-03-31',
    size: '0.8 MB',
    status: 'vigente',
  },
];

export default function CraneDocumentsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cranes } = useCranes();
  const crane = cranes.find(c => c.id === id);

  const [documents, setDocuments] = useState<CraneDocument[]>(MOCK_DOCUMENTS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDoc, setNewDoc] = useState<Partial<CraneDocument>>({
    type: 'otro',
    upload_date: new Date().toISOString().split('T')[0],
  });

  const handleSave = () => {
    if (!newDoc.name) return;

    let status: CraneDocument['status'] = 'na';
    if (newDoc.expiry_date) {
      const expiry = new Date(newDoc.expiry_date);
      const today = new Date();
      const warningDate = addDays(today, 30);

      if (isPast(expiry)) {
        status = 'vencido';
      } else if (expiry <= warningDate) {
        status = 'por_vencer';
      } else {
        status = 'vigente';
      }
    }

    const doc: CraneDocument = {
      id: Math.random().toString(36).substr(2, 9),
      name: newDoc.name,
      type: newDoc.type as DocumentType || 'otro',
      upload_date: newDoc.upload_date!,
      expiry_date: newDoc.expiry_date,
      size: '0.5 MB', // Simulado
      status,
    };

    setDocuments([doc, ...documents]);
    setIsDialogOpen(false);
    setNewDoc({
      type: 'otro',
      upload_date: new Date().toISOString().split('T')[0],
    });
  };

  if (!crane) return <div>Cargando...</div>;

  const getStatusBadge = (status: CraneDocument['status']) => {
    switch (status) {
      case 'vigente':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Vigente</Badge>;
      case 'por_vencer':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Por Vencer</Badge>;
      case 'vencido':
        return <Badge variant="destructive">Vencido</Badge>;
      default:
        return null;
    }
  };

  const getDocTypeLabel = (type: DocumentType) => {
    switch (type) {
      case 'seguro': return 'Seguro';
      case 'revision_tecnica': return 'Revisión Técnica';
      case 'permiso_circulacion': return 'Permiso Circulación';
      case 'factura': return 'Factura';
      case 'otro': return 'Otro';
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
            <h1 className="text-2xl font-bold tracking-tight">Documentación</h1>
            <p className="text-muted-foreground">
              Gestión de archivos para {crane.brand} {crane.model} ({crane.unit_number})
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Subir Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Subir Documento</DialogTitle>
              <DialogDescription>
                Agrega un nuevo documento al expediente digital de la grúa.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nombre del Archivo</Label>
                <Input 
                  placeholder="Ej: Póliza 2024.pdf"
                  value={newDoc.name || ''}
                  onChange={(e) => setNewDoc({...newDoc, name: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Documento</Label>
                  <Select 
                    value={newDoc.type} 
                    onValueChange={(v) => setNewDoc({...newDoc, type: v as DocumentType})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seguro">Seguro</SelectItem>
                      <SelectItem value="revision_tecnica">Revisión Técnica</SelectItem>
                      <SelectItem value="permiso_circulacion">Permiso Circulación</SelectItem>
                      <SelectItem value="factura">Factura/Compra</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Vencimiento (Opcional)</Label>
                  <Input 
                    type="date" 
                    value={newDoc.expiry_date || ''}
                    onChange={(e) => setNewDoc({...newDoc, expiry_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Arrastra tu archivo aquí o haz clic para seleccionar
                </p>
                <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG hasta 10MB</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Subir Archivo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos Totales</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Vencer (30 días)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.status === 'por_vencer').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.status === 'vencido').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Archivos</CardTitle>
          <CardDescription>Expediente digital organizado.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha Subida</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Tamaño</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    {doc.name}
                  </TableCell>
                  <TableCell>{getDocTypeLabel(doc.type)}</TableCell>
                  <TableCell>
                    {format(new Date(doc.upload_date), 'dd MMM yyyy', { locale: es })}
                  </TableCell>
                  <TableCell>
                    {doc.expiry_date ? format(new Date(doc.expiry_date), 'dd MMM yyyy', { locale: es }) : '-'}
                  </TableCell>
                  <TableCell>{doc.size}</TableCell>
                  <TableCell>{getStatusBadge(doc.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
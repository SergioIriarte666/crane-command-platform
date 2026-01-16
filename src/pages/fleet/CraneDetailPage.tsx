import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Truck,
  Gauge,
  Calendar,
  Fuel,
  MapPin,
  FileText,
  User,
  ClipboardList,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useCranes } from '@/hooks/useCranes';
import {
  CRANE_TYPES,
  CRANE_STATUS_CONFIG,
  formatKm,
  formatTons,
  getDaysUntilExpiry,
  getExpiryColor,
} from '@/types/fleet';
import type { CraneStatus, CraneType } from '@/types/fleet';

export default function CraneDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cranes, isLoading } = useCranes();

  const crane = cranes.find((c) => c.id === id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!crane) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-semibold mb-2">Grúa no encontrada</h2>
        <p className="text-muted-foreground mb-4">
          La grúa que buscas no existe o fue eliminada.
        </p>
        <Button onClick={() => navigate('/flota/gruas')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Flota de Grúas
        </Button>
      </div>
    );
  }

  const statusConfig = CRANE_STATUS_CONFIG[crane.status as CraneStatus];
  const typeConfig = CRANE_TYPES[crane.type as CraneType];

  const insuranceDays = getDaysUntilExpiry(crane.insurance_expiry);
  const permitDays = getDaysUntilExpiry(crane.permit_expiry);
  const verificationDays = getDaysUntilExpiry(crane.next_verification);

  const DocumentIndicator = ({ label, days }: { label: string; days: number | null }) => {
    const color = getExpiryColor(days);
    const colorClasses = {
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      gray: 'bg-gray-400',
    } as const;

    let text = 'Sin fecha';
    if (days !== null) {
      if (days < 0) text = 'Vencido';
      else if (days === 0) text = 'Vence hoy';
      else text = `Vence en ${days} días`;
    }

    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{text}</span>
          <span className={`w-3 h-3 rounded-full ${colorClasses[color]}`} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/flota/gruas')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Truck className="w-8 h-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{crane.unit_number}</h1>
                <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                  {statusConfig.label}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
                <span>
                  {crane.brand} {crane.model} {crane.year}
                </span>
                <span>•</span>
                <Badge variant="outline">{typeConfig.label}</Badge>
                {crane.plates && (
                  <>
                    <span>•</span>
                    <span className="font-mono">{crane.plates}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <Button asChild>
          <Link to={`/flota/gruas/${crane.id}/editar`}>
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="operacion">Operación</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Especificaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <p className="font-medium">{typeConfig.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {typeConfig.description}
                    </p>
                  </div>
                </div>

                {(crane.brand || crane.model || crane.year) && (
                  <div className="flex items-start gap-3">
                    <ClipboardList className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Unidad</p>
                      <p className="font-medium">
                        {[crane.brand, crane.model, crane.year]
                          .filter(Boolean)
                          .join(' ')}
                      </p>
                    </div>
                  </div>
                )}

                {crane.serial_number && (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Número de Serie</p>
                      <p className="font-mono font-medium">{crane.serial_number}</p>
                    </div>
                  </div>
                )}

                {crane.capacity_tons !== null && (
                  <div className="flex items-start gap-3">
                    <Gauge className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Capacidad</p>
                      <p className="font-medium">{formatTons(crane.capacity_tons)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información adicional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {crane.acquisition_date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha de adquisición</p>
                      <p className="font-medium">
                        {new Date(crane.acquisition_date).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                  </div>
                )}

                {crane.acquisition_cost !== null && (
                  <div className="flex items-start gap-3">
                    <CreditCardIcon />
                    <div>
                      <p className="text-sm text-muted-foreground">Costo de adquisición</p>
                      <p className="font-medium">
                        {crane.acquisition_cost.toLocaleString('es-CL', {
                          style: 'currency',
                          currency: 'CLP',
                          maximumFractionDigits: 0,
                        })}
                      </p>
                    </div>
                  </div>
                )}

                {crane.notes && (
                  <div className="flex items-start gap-3">
                    <ClipboardList className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Notas</p>
                      <p className="font-medium whitespace-pre-wrap">{crane.notes}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operacion" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Operación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Gauge className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Kilometraje actual</p>
                    <p className="font-medium">{formatKm(crane.current_km)}</p>
                  </div>
                </div>

                {crane.fuel_type && (
                  <div className="flex items-start gap-3">
                    <Fuel className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Combustible</p>
                      <p className="font-medium">{crane.fuel_type}</p>
                      {crane.fuel_efficiency && (
                        <p className="text-xs text-muted-foreground">
                          Rendimiento: {crane.fuel_efficiency} km/lt
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {crane.gps_device_id && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Dispositivo GPS</p>
                      <p className="font-mono font-medium">{crane.gps_device_id}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Operador asignado</CardTitle>
              </CardHeader>
              <CardContent>
                {crane.assigned_operator ? (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Operador</p>
                      <p className="font-medium">
                        {crane.assigned_operator.full_name}
                      </p>
                      {crane.assigned_operator.employee_number && (
                        <p className="text-xs text-muted-foreground">
                          Legajo {crane.assigned_operator.employee_number}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No hay operador asignado actualmente.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documentación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DocumentIndicator label="Seguro" days={insuranceDays} />
              <Separator />
              <DocumentIndicator label="Permiso de circulación" days={permitDays} />
              <Separator />
              <DocumentIndicator label="Verificación" days={verificationDays} />
              {crane.insurance_policy && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Póliza de seguro</p>
                      <p className="font-mono text-sm">{crane.insurance_policy}</p>
                    </div>
                  </div>
                </>
              )}
              {crane.circulation_permit && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Permiso de circulación</p>
                      <p className="font-mono text-sm">{crane.circulation_permit}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CreditCardIcon() {
  return <span className="w-5 h-5 text-muted-foreground mt-0.5 flex items-center justify-center">💳</span>;
}

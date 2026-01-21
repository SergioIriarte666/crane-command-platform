import { Link, useParams, useNavigate } from 'react-router-dom';
import { useOperators } from '@/hooks/useOperators';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  Truck,
  Loader2,
  Calendar,
  Contact,
  Banknote,
  User,
  Heart
} from 'lucide-react';
import { 
  OPERATOR_STATUS_CONFIG, 
  getInitials, 
  formatCommission, 
  COMMISSION_TYPES,
  OperatorWithCrane
} from '@/types/operators';
import { getDaysUntilExpiry, getExpiryColor } from '@/types/fleet';
import type { OperatorStatus } from '@/types/operators';

export default function OperatorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { operators, isLoading } = useOperators();
  
  // Find operator from the list
  const operator = operators.find((op) => op.id === id) as OperatorWithCrane | undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-semibold mb-2">Operador no encontrado</h2>
        <p className="text-muted-foreground mb-4">
          El operador que buscas no existe o fue eliminado.
        </p>
        <Button onClick={() => navigate('/operadores')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Operadores
        </Button>
      </div>
    );
  }

  const statusConfig = OPERATOR_STATUS_CONFIG[operator.status as OperatorStatus];
  const licenseDays = getDaysUntilExpiry(operator.license_expiry);
  const licenseColor = getExpiryColor(licenseDays);

  const DocumentIndicator = ({ label, days }: { label: string; days: number | null }) => {
    const color = getExpiryColor(days);
    const colorClasses = {
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      gray: 'bg-gray-400',
    };
    
    let text = 'Sin fecha';
    if (days !== null) {
      if (days <= 0) text = 'Vencido';
      else if (days <= 30) text = `Vence en ${days} días`;
      else text = 'Vigente';
    }

    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{text}</span>
          <div className={`w-3 h-3 rounded-full ${colorClasses[color]}`} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/operadores')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={operator.photo_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {getInitials(operator.full_name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{operator.full_name}</h1>
                <Badge className={`${statusConfig.bgColor} ${statusConfig.color} border-0`}>
                  {statusConfig.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-mono text-sm">{operator.employee_number}</span>
              </div>
            </div>
          </div>
        </div>
        <Button asChild>
          <Link to={`/operadores/${operator.id}/editar`}>
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </Link>
        </Button>
      </div>

      {/* Content */}
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="laboral">Datos Laborales</TabsTrigger>
          <TabsTrigger value="documentos">Documentación</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Contact className="w-5 h-5" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {operator.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <p className="font-medium">{operator.phone}</p>
                    </div>
                  </div>
                )}

                {operator.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a
                        href={`mailto:${operator.email}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {operator.email}
                      </a>
                    </div>
                  </div>
                )}

                {operator.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Dirección</p>
                      <p className="font-medium">{operator.address}</p>
                    </div>
                  </div>
                )}

                {operator.emergency_phone && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <Heart className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Contacto de Emergencia</p>
                        <p className="font-medium">{operator.emergency_phone}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Personal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5" />
                  Datos Personales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {operator.birth_date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha de Nacimiento</p>
                      <p className="font-medium">
                        {new Date(operator.birth_date).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                  </div>
                )}

                {operator.blood_type && (
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de Sangre</p>
                      <p className="font-medium">{operator.blood_type}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="laboral" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Work Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Banknote className="w-5 h-5" />
                  Datos Contractuales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {operator.hire_date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha de Contratación</p>
                      <p className="font-medium">
                        {new Date(operator.hire_date).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex items-start gap-3">
                  <Banknote className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Esquema de Comisión</p>
                    <p className="font-medium">
                      {operator.commission_type ? COMMISSION_TYPES[operator.commission_type].label : 'No asignado'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCommission(operator)}
                    </p>
                  </div>
                </div>

                {(operator.bank_name || operator.bank_account) && (
                  <>
                    <Separator />
                    <div className="flex items-start gap-3">
                      <CreditCard className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Datos Bancarios</p>
                        {operator.bank_name && <p className="font-medium">{operator.bank_name}</p>}
                        {operator.bank_account && (
                          <p className="font-mono text-sm">{operator.bank_account}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Assigned Crane */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="w-5 h-5" />
                  Grúa Asignada
                </CardTitle>
              </CardHeader>
              <CardContent>
                {operator.assigned_crane ? (
                  <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Truck className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">
                        {operator.assigned_crane.unit_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {operator.assigned_crane.brand} {operator.assigned_crane.model}
                      </p>
                      <Button variant="link" asChild className="p-0 h-auto mt-1">
                        <Link to={`/flota/gruas/${operator.assigned_crane.id}`}>
                          Ver grúa
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Truck className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No tiene grúa asignada actualmente</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Documentación</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link to={`/operadores/${operator.id}/documentos`}>
                  Gestionar Documentos
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <DocumentIndicator label="Licencia de Conducir" days={licenseDays} />
              
              {operator.license_number && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Número de Licencia</p>
                      <p className="font-mono text-sm">{operator.license_number}</p>
                      {operator.license_type && (
                        <Badge variant="outline" className="mt-1">
                          Clase {operator.license_type}
                        </Badge>
                      )}
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

import { Link, useParams, useNavigate } from 'react-router-dom';
import { useClient } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Pencil,
  Building2,
  User,
  Shield,
  Landmark,
  Phone,
  Mail,
  Globe,
  MapPin,
  FileText,
  CreditCard,
  Clock,
  Users,
  Loader2,
  ClipboardList,
  LayoutList,
} from 'lucide-react';
import {
  ClientType,
  CLIENT_TYPE_LABELS,
  CLIENT_TYPE_COLORS,
  TAX_REGIMES,
  formatCLP,
} from '@/types/clients';

const TYPE_ICONS: Record<ClientType, React.ElementType> = {
  particular: User,
  empresa: Building2,
  aseguradora: Shield,
  gobierno: Landmark,
};

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: client, isLoading } = useClient(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-semibold mb-2">Cliente no encontrado</h2>
        <p className="text-muted-foreground mb-4">
          El cliente que buscas no existe o fue eliminado.
        </p>
        <Button onClick={() => navigate('/clientes')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Clientes
        </Button>
      </div>
    );
  }

  const TypeIcon = TYPE_ICONS[client.type];
  const taxRegimeLabel = TAX_REGIMES.find((r) => r.value === client.tax_regime)?.label;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/clientes')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center ${CLIENT_TYPE_COLORS[client.type]}`}
            >
              <TypeIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{client.name}</h1>
                {!client.is_active && (
                  <Badge variant="secondary">Inactivo</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-mono text-sm">{client.code}</span>
                <span>•</span>
                <Badge variant="outline" className={CLIENT_TYPE_COLORS[client.type]}>
                  {CLIENT_TYPE_LABELS[client.type]}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/vip/cliente/${client.id}`}>
              <LayoutList className="w-4 h-4 mr-2" />
              Ver Pipeline
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/clientes/${client.id}/editar`}>
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="services">Servicios</TabsTrigger>
          <TabsTrigger value="invoices">Facturación</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.trade_name && (
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre Comercial</p>
                      <p className="font-medium">{client.trade_name}</p>
                    </div>
                  </div>
                )}

                {client.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <p className="font-medium">{client.phone}</p>
                      {client.phone_alt && (
                        <p className="text-sm text-muted-foreground">{client.phone_alt}</p>
                      )}
                    </div>
                  </div>
                )}

                {client.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a
                        href={`mailto:${client.email}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {client.email}
                      </a>
                    </div>
                  </div>
                )}

                {client.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Sitio Web</p>
                      <a
                        href={client.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline"
                      >
                        {client.website}
                      </a>
                    </div>
                  </div>
                )}

                {client.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Dirección</p>
                      <p className="font-medium">{client.address}</p>
                      <p className="text-sm text-muted-foreground">
                        {[client.city, client.state, client.zip_code]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fiscal Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Datos Fiscales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.tax_id ? (
                  <>
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">RUT</p>
                        <p className="font-mono font-medium">{client.tax_id}</p>
                      </div>
                    </div>

                    {taxRegimeLabel && (
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Régimen Fiscal</p>
                          <p className="font-medium">{taxRegimeLabel}</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No hay datos fiscales registrados
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Commercial Terms */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Condiciones Comerciales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Días de Crédito</p>
                    <p className="font-medium">
                      {client.payment_terms === 0
                        ? 'Contado'
                        : `${client.payment_terms} días`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Límite de Crédito</p>
                    <p className="font-medium">
                      {formatCLP(client.credit_limit)}
                    </p>
                  </div>
                </div>

                {client.default_discount > 0 && (
                  <div className="flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Descuento Default</p>
                      <p className="font-medium">{client.default_discount}%</p>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex flex-wrap gap-2">
                  {client.requires_po && (
                    <Badge variant="outline">Requiere Orden de Compra</Badge>
                  )}
                  {client.requires_approval && (
                    <Badge variant="outline">Requiere Cierre de Facturación</Badge>
                  )}
                  {!client.requires_po && !client.requires_approval && (
                    <span className="text-sm text-muted-foreground">
                      Sin requisitos especiales
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contacts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Contactos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {client.contacts && client.contacts.length > 0 ? (
                  <div className="space-y-4">
                    {client.contacts.map((contact, index) => (
                      <div
                        key={contact.id || index}
                        className="p-3 rounded-lg border bg-muted/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{contact.name}</span>
                          {contact.is_primary && (
                            <Badge variant="secondary" className="text-xs">
                              Principal
                            </Badge>
                          )}
                        </div>
                        {contact.position && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {contact.position}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm">
                          {contact.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {contact.phone}
                            </span>
                          )}
                          {contact.email && (
                            <a
                              href={`mailto:${contact.email}`}
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <Mail className="w-3 h-3" />
                              {contact.email}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No hay contactos adicionales
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <ClipboardList className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Historial de Servicios</h3>
              <p className="text-muted-foreground mb-4">
                El historial de servicios estará disponible próximamente.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Facturación</h3>
              <p className="text-muted-foreground mb-4">
                El historial de facturación estará disponible próximamente.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

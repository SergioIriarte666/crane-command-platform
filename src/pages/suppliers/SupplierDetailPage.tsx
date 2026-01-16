import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Pencil,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  Clock,
  Loader2,
  Star,
  User,
  Banknote,
  ClipboardList,
} from 'lucide-react';
import { SUPPLIER_CATEGORIES, RATING_LABELS } from '@/types/suppliers';
import { formatCLP } from '@/types/clients';
import type { SupplierCategory, Supplier } from '@/types/suppliers';

function useSupplier(id: string | undefined) {
  return useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Supplier;
    },
    enabled: !!id,
  });
}

export default function SupplierDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: supplier, isLoading } = useSupplier(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-semibold mb-2">Proveedor no encontrado</h2>
        <p className="text-muted-foreground mb-4">
          El proveedor que buscas no existe o fue eliminado.
        </p>
        <Button onClick={() => navigate('/proveedores')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Proveedores
        </Button>
      </div>
    );
  }

  const categoryConfig = SUPPLIER_CATEGORIES[supplier.category as SupplierCategory];

  const RatingStars = ({ rating }: { rating: number | null }) => {
    if (!rating) return <span className="text-muted-foreground">Sin calificar</span>;
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">
          {RATING_LABELS[rating]}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/proveedores')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">
              {categoryConfig?.icon || '📦'}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{supplier.name}</h1>
                {!supplier.is_active && (
                  <Badge variant="secondary">Inactivo</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="font-mono text-sm">{supplier.code}</span>
                <span>•</span>
                <Badge variant="outline">
                  {categoryConfig?.label || 'Otro'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <Button asChild>
          <Link to={`/proveedores/${supplier.id}/editar`}>
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </Link>
        </Button>
      </div>

      {/* Content */}
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="purchases">Compras</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {supplier.trade_name && (
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Nombre Comercial</p>
                      <p className="font-medium">{supplier.trade_name}</p>
                    </div>
                  </div>
                )}

                {supplier.contact_name && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Contacto Principal</p>
                      <p className="font-medium">{supplier.contact_name}</p>
                    </div>
                  </div>
                )}

                {supplier.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Teléfono</p>
                      <p className="font-medium">{supplier.phone}</p>
                    </div>
                  </div>
                )}

                {supplier.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <a
                        href={`mailto:${supplier.email}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {supplier.email}
                      </a>
                    </div>
                  </div>
                )}

                {supplier.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Dirección</p>
                      <p className="font-medium">{supplier.address}</p>
                      {(supplier.city || supplier.state) && (
                        <p className="text-sm text-muted-foreground">
                          {[supplier.city, supplier.state].filter(Boolean).join(', ')}
                        </p>
                      )}
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
                {supplier.tax_id ? (
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">RUT</p>
                      <p className="font-mono font-medium">{supplier.tax_id}</p>
                    </div>
                  </div>
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
                    <p className="text-sm text-muted-foreground">Plazo de Pago</p>
                    <p className="font-medium">
                      {supplier.payment_terms === 0
                        ? 'Contado'
                        : `${supplier.payment_terms} días`}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Límite de Crédito</p>
                    <p className="font-medium">
                      {formatCLP(supplier.credit_limit || 0)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Calificación</p>
                  <RatingStars rating={supplier.rating} />
                </div>
              </CardContent>
            </Card>

            {/* Bank Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Banknote className="w-5 h-5" />
                  Datos Bancarios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {supplier.bank_name || supplier.bank_account ? (
                  <>
                    {supplier.bank_name && (
                      <div>
                        <p className="text-sm text-muted-foreground">Banco</p>
                        <p className="font-medium">{supplier.bank_name}</p>
                      </div>
                    )}
                    {supplier.bank_account && (
                      <div>
                        <p className="text-sm text-muted-foreground">Número de Cuenta</p>
                        <p className="font-mono font-medium">{supplier.bank_account}</p>
                      </div>
                    )}
                    {supplier.clabe && (
                      <div>
                        <p className="text-sm text-muted-foreground">CLABE</p>
                        <p className="font-mono font-medium">{supplier.clabe}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No hay datos bancarios registrados
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {supplier.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{supplier.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="purchases">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                <ClipboardList className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Historial de Compras</h3>
              <p className="text-muted-foreground mb-4">
                El historial de compras y costos asociados estará disponible próximamente.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
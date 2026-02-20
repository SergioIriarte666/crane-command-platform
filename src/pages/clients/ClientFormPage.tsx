import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useClients, useClient } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Loader2, Save, Plus, Trash2 } from 'lucide-react';
import { useCatalogOptions } from '@/hooks/useCatalogs';
import {
  ClientFormData,
  ClientContact,
  formatRUT,
  validateRUT,
} from '@/types/clients';

const initialFormData: ClientFormData = {
  type: 'particular',
  name: '',
  trade_name: '',
  tax_id: '',
  tax_regime: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  phone: '',
  phone_alt: '',
  email: '',
  website: '',
  contacts: [],
  payment_terms: 0,
  credit_limit: 0,
  requires_po: false,
  requires_approval: false,
  default_discount: 0,
  notes: '',
};

export default function ClientFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createClient, updateClient } = useClients();
  const { data: existingClient, isLoading: isLoadingClient } = useClient(id);
  
  const { data: clientTypes = [] } = useCatalogOptions('client_type');
  const { data: regions = [] } = useCatalogOptions('region');
  const { data: taxRegimes = [] } = useCatalogOptions('tax_regime');
  
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [rutError, setRutError] = useState<string | null>(null);

  const handleRUTChange = (value: string) => {
    const formatted = formatRUT(value.toUpperCase());
    handleChange('tax_id', formatted);
    
    // Validate only when it has a complete format (at least 9 chars: 12.345.678-9)
    if (formatted.replace(/[^0-9kK]/g, '').length >= 8) {
      if (!validateRUT(formatted)) {
        setRutError('RUT inválido. Verifique el dígito verificador.');
      } else {
        setRutError(null);
      }
    } else {
      setRutError(null);
    }
  };

  const isFormValid = !rutError || formData.tax_id === '';

  const isEditing = !!id;

  useEffect(() => {
    if (existingClient) {
      setFormData({
        type: existingClient.type,
        name: existingClient.name,
        trade_name: existingClient.trade_name || '',
        tax_id: existingClient.tax_id || '',
        tax_regime: (existingClient as any).tax_regime || '',
        address: existingClient.address || '',
        city: existingClient.city || '',
        state: existingClient.state || '',
        zip_code: existingClient.zip_code || '',
        phone: existingClient.phone || '',
        phone_alt: existingClient.phone_alt || '',
        email: existingClient.email || '',
        website: existingClient.website || '',
        contacts: existingClient.contacts || [],
        payment_terms: existingClient.payment_terms,
        credit_limit: existingClient.credit_limit,
        requires_po: existingClient.requires_po,
        requires_approval: existingClient.requires_approval,
        default_discount: existingClient.default_discount,
        notes: existingClient.notes || '',
      });
    }
  }, [existingClient]);

  const handleChange = (
    field: keyof ClientFormData,
    value: string | number | boolean | ClientContact[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addContact = () => {
    const newContact: ClientContact = {
      id: crypto.randomUUID(),
      name: '',
      position: '',
      phone: '',
      email: '',
      is_primary: formData.contacts.length === 0,
    };
    handleChange('contacts', [...formData.contacts, newContact]);
  };

  const updateContact = (id: string, field: keyof ClientContact, value: string | boolean) => {
    const updatedContacts = formData.contacts.map((c) =>
      c.id === id ? { ...c, [field]: value } : c
    );
    handleChange('contacts', updatedContacts);
  };

  const removeContact = (id: string) => {
    handleChange(
      'contacts',
      formData.contacts.filter((c) => c.id !== id)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (isEditing && id) {
        await updateClient.mutateAsync({ id, ...formData });
      } else {
        await createClient.mutateAsync(formData);
      }
      navigate('/clientes');
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing && isLoadingClient) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clientes')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing
              ? `Editando: ${existingClient?.name}`
              : 'Complete la información del cliente'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="fiscal">Datos Fiscales</TabsTrigger>
            <TabsTrigger value="contacts">Contactos</TabsTrigger>
            <TabsTrigger value="commercial">Comercial</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información General</CardTitle>
                <CardDescription>Datos básicos del cliente</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Cliente *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => handleChange('type', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {clientTypes.map((type) => (
                        <SelectItem key={type.code} value={type.code}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Nombre / Razón Social *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Nombre completo o razón social"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="trade_name">Nombre Comercial</Label>
                  <Input
                    id="trade_name"
                    value={formData.trade_name}
                    onChange={(e) => handleChange('trade_name', e.target.value)}
                    placeholder="Nombre comercial (opcional)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+56 9 1234 5678"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="contacto@empresa.com"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dirección</CardTitle>
                <CardDescription>Domicilio del cliente</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Calle y Número</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Av. Libertador B. O'Higgins #1234, Providencia"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Santiago"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Región</Label>
                  <Select
                    value={formData.state}
                    onValueChange={(v) => handleChange('state', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar región" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region.code} value={region.name}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fiscal Tab */}
          <TabsContent value="fiscal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Datos Fiscales</CardTitle>
                <CardDescription>Información para facturación</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tax_id">RUT</Label>
                  <Input
                    id="tax_id"
                    value={formData.tax_id}
                    onChange={(e) => handleRUTChange(e.target.value)}
                    placeholder="12.345.678-9"
                    maxLength={12}
                    className={rutError ? 'border-destructive focus-visible:ring-destructive' : ''}
                  />
                  {rutError && (
                    <p className="text-sm text-destructive">{rutError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax_regime">Régimen Fiscal</Label>
                  <Select
                    value={formData.tax_regime}
                    onValueChange={(v) => handleChange('tax_regime', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar régimen" />
                    </SelectTrigger>
                    <SelectContent>
                      {taxRegimes.map((regime) => (
                        <SelectItem key={regime.code} value={regime.code}>
                          {regime.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Contactos Adicionales</CardTitle>
                  <CardDescription>
                    Personas de contacto dentro de la organización
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" onClick={addContact}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Contacto
                </Button>
              </CardHeader>
              <CardContent>
                {formData.contacts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No hay contactos adicionales.</p>
                    <p className="text-sm">Haz clic en "Agregar Contacto" para añadir uno.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.contacts.map((contact, index) => (
                      <Card key={contact.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium">Contacto {index + 1}</h4>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Switch
                                  id={`primary-${contact.id}`}
                                  checked={contact.is_primary}
                                  onCheckedChange={(v) =>
                                    updateContact(contact.id, 'is_primary', v)
                                  }
                                />
                                <Label htmlFor={`primary-${contact.id}`} className="text-sm">
                                  Principal
                                </Label>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeContact(contact.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>Nombre</Label>
                              <Input
                                value={contact.name}
                                onChange={(e) =>
                                  updateContact(contact.id, 'name', e.target.value)
                                }
                                placeholder="Nombre completo"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Cargo</Label>
                              <Input
                                value={contact.position}
                                onChange={(e) =>
                                  updateContact(contact.id, 'position', e.target.value)
                                }
                                placeholder="Director, Gerente, etc."
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Teléfono</Label>
                              <Input
                                value={contact.phone}
                                onChange={(e) =>
                                  updateContact(contact.id, 'phone', e.target.value)
                                }
                                placeholder="(55) 1234-5678"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Email</Label>
                              <Input
                                type="email"
                                value={contact.email}
                                onChange={(e) =>
                                  updateContact(contact.id, 'email', e.target.value)
                                }
                                placeholder="contacto@empresa.com"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commercial Tab */}
          <TabsContent value="commercial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Condiciones Comerciales</CardTitle>
                <CardDescription>Términos de pago y crédito</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="payment_terms">Días de Crédito</Label>
                  <Input
                    id="payment_terms"
                    type="number"
                    min="0"
                    value={formData.payment_terms}
                    onChange={(e) => handleChange('payment_terms', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credit_limit">Límite de Crédito ($)</Label>
                  <Input
                    id="credit_limit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.credit_limit}
                    onChange={(e) => handleChange('credit_limit', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_discount">Descuento por Defecto (%)</Label>
                  <Input
                    id="default_discount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.default_discount}
                    onChange={(e) =>
                      handleChange('default_discount', parseFloat(e.target.value) || 0)
                    }
                    placeholder="0.00"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Requisitos de Facturación</CardTitle>
                <CardDescription>
                  Configuración para el proceso de facturación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Requiere Orden de Compra</Label>
                    <p className="text-sm text-muted-foreground">
                      El cliente debe proporcionar una OC antes de facturar
                    </p>
                  </div>
                  <Switch
                    checked={formData.requires_po}
                    onCheckedChange={(v) => handleChange('requires_po', v)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Requiere Cierre de Facturación</Label>
                    <p className="text-sm text-muted-foreground">
                      Los servicios deben ser aprobados antes de generar factura
                    </p>
                  </div>
                  <Switch
                    checked={formData.requires_approval}
                    onCheckedChange={(v) => handleChange('requires_approval', v)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notas</CardTitle>
                <CardDescription>Observaciones adicionales del cliente</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Notas internas sobre el cliente..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t">
          <Button type="button" variant="outline" onClick={() => navigate('/clientes')}>
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-gradient-primary hover:opacity-90"
            disabled={isSaving || !formData.name || !isFormValid}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface InvitationData {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  tenant: {
    name: string;
  };
}

export default function InvitationAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyInvitation = async () => {
      if (!token) {
        setError('Token de invitación no válido');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('invitations')
          .select(`
            id,
            email,
            role,
            expires_at,
            tenant:tenants!tenant_id(name)
          `)
          .eq('token', token)
          .is('accepted_at', null)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!data) {
          setError('La invitación no es válida, ya fue utilizada o ha expirado');
        } else {
          // Type assertion for the nested tenant object
          const invitationData: InvitationData = {
            id: data.id,
            email: data.email,
            role: data.role ?? 'operator',
            expires_at: data.expires_at,
            tenant: data.tenant as unknown as { name: string },
          };
          setInvitation(invitationData);
        }
      } catch (err: any) {
        console.error('Error verifying invitation:', err);
        setError('Error al verificar la invitación');
      } finally {
        setLoading(false);
      }
    };

    verifyInvitation();
  }, [token]);

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'super_admin': 'Super Administrador',
      'admin': 'Administrador',
      'dispatcher': 'Despachador',
      'operator': 'Operador',
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Verificando invitación...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
        <Card className="w-full max-w-md shadow-2xl border-destructive/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-xl">Invitación no válida</CardTitle>
              <CardDescription className="mt-2">
                {error || 'La invitación no existe o ha expirado'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link to="/login">Ir al inicio de sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">¡Has sido invitado!</CardTitle>
            <CardDescription className="mt-2">
              Has recibido una invitación para unirte a una empresa
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Empresa:</span>
              <span className="font-medium">{invitation.tenant?.name || 'Sin nombre'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tu rol:</span>
              <span className="font-medium">{getRoleLabel(invitation.role)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{invitation.email}</span>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <p className="text-sm text-green-700 dark:text-green-400">
                Para aceptar la invitación, regístrate con el email <strong>{invitation.email}</strong>. 
                Tu cuenta será automáticamente asociada a la empresa.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild size="lg" className="w-full">
              <Link to={`/auth/register?email=${encodeURIComponent(invitation.email)}`}>
                Crear mi cuenta
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link to="/auth/login">
                Ya tengo cuenta
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

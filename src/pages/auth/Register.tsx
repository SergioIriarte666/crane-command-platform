import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Loader2, Eye, EyeOff, CheckCircle, Mail, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface InvitationData {
  id: string;
  email: string;
  role: string;
  tenant: {
    name: string;
  };
}

export default function Register() {
  const [searchParams] = useSearchParams();
  const invitationEmail = searchParams.get('email');
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(invitationEmail || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [checkingInvitation, setCheckingInvitation] = useState(!!invitationEmail);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if there's a valid invitation for this email
  useEffect(() => {
    const checkInvitation = async () => {
      if (!invitationEmail) {
        setCheckingInvitation(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('invitations')
          .select(`
            id,
            email,
            role,
            tenant:tenants!tenant_id(name)
          `)
          .eq('email', invitationEmail)
          .is('accepted_at', null)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (!error && data) {
          setInvitation({
            id: data.id,
            email: data.email,
            role: data.role ?? 'operator',
            tenant: data.tenant as unknown as { name: string },
          });
        }
      } catch (err) {
        console.error('Error checking invitation:', err);
      } finally {
        setCheckingInvitation(false);
      }
    };

    checkInvitation();
  }, [invitationEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Require invitation for registration
    if (!invitation) {
      toast({
        variant: 'destructive',
        title: 'Registro no permitido',
        description: 'Necesitas una invitación válida para registrarte.',
      });
      return;
    }

    // Ensure email matches invitation
    if (email.toLowerCase() !== invitation.email.toLowerCase()) {
      toast({
        variant: 'destructive',
        title: 'Email incorrecto',
        description: 'Debes registrarte con el email de la invitación.',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Las contraseñas no coinciden.',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'La contraseña debe tener al menos 6 caracteres.',
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password, fullName);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error al registrarse',
        description: error.message,
      });
      setIsLoading(false);
    } else {
      setIsSuccess(true);
      toast({
        title: '¡Registro exitoso!',
        description: 'Tu cuenta ha sido creada. Redirigiendo...',
      });
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'super_admin': 'Super Administrador',
      'admin': 'Administrador',
      'dispatcher': 'Despachador',
      'operator': 'Operador',
    };
    return labels[role] || role;
  };

  if (checkingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-dark p-4">
        <Card className="w-full max-w-md glass border-0 shadow-xl">
          <CardContent className="pt-10 pb-10 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Verificando invitación...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no invitation email provided, show message that invitation is required
  if (!invitationEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-dark p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-info/20 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-md relative z-10 glass border-0 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center">
              <Mail className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Invitación Requerida</CardTitle>
              <CardDescription className="text-base mt-2">
                Para registrarte en NTMS necesitas una invitación de un administrador.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Contacta al administrador de tu empresa para solicitar una invitación.
              </p>
            </div>

            <div className="text-center">
              <Link to="/auth/login" className="text-primary hover:underline font-medium">
                ← Volver al inicio de sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If invitation email but no valid invitation found
  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-dark p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-info/20 rounded-full blur-3xl" />
        </div>

        <Card className="w-full max-w-md relative z-10 glass border-0 shadow-xl border-destructive/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Invitación no válida</CardTitle>
              <CardDescription className="text-base mt-2">
                La invitación para <strong>{invitationEmail}</strong> no existe, ya fue utilizada o ha expirado.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link to="/auth/login">Ir al inicio de sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-dark p-4">
        <Card className="w-full max-w-md glass border-0 shadow-xl">
          <CardContent className="pt-10 pb-10 text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-success rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-success-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">¡Cuenta creada!</h2>
            <p className="text-muted-foreground">
              Tu cuenta ha sido creada exitosamente. Serás redirigido en un momento...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-dark p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-info/20 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 glass border-0 shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-colored">
            <Truck className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Crear Cuenta</CardTitle>
            <CardDescription className="text-base">
              Completa tu registro para unirte a <strong>{invitation.tenant?.name}</strong>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Invitation info banner */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-primary" />
              <span>
                Serás registrado como <strong>{getRoleLabel(invitation.role)}</strong>
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="h-11 bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Debes usar el email de la invitación
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-primary hover:opacity-90 transition-opacity"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/auth/login" className="text-primary hover:underline font-medium">
              Inicia sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

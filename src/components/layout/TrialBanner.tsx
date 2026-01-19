
import { useAuth } from '@/contexts/AuthContext';
import { trialService } from '@/services/trialService';
import { AlertCircle, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function TrialBanner() {
  const { authUser } = useAuth();
  const navigate = useNavigate();

  if (!authUser?.tenant?.is_trial) return null;

  const trialStatus = trialService.checkTrialStatus(authUser.tenant.trial_ends_at || null);
  const trialEndsAt = authUser.tenant.trial_ends_at ? new Date(authUser.tenant.trial_ends_at) : null;
  const daysRemaining = trialEndsAt 
    ? Math.ceil((trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) 
    : 0;

  if (trialStatus === 'none') return null;

  if (trialStatus === 'expired') {
    return (
      <div className="bg-destructive text-destructive-foreground px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">Tu período de prueba ha finalizado.</span>
        </div>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => navigate('/configuracion?tab=plans')}
          className="whitespace-nowrap"
        >
          Suscribirse ahora
        </Button>
      </div>
    );
  }

  return (
    <div className={`px-4 py-2 flex items-center justify-between text-sm shadow-sm ${
      trialStatus === 'expiring_soon' 
        ? 'bg-amber-100 text-amber-900 border-b border-amber-200' 
        : 'bg-indigo-50 text-indigo-900 border-b border-indigo-200'
    }`}>
      <div className="flex items-center gap-2">
        {trialStatus === 'expiring_soon' ? (
          <Clock className="h-4 w-4" />
        ) : (
          <Star className="h-4 w-4" />
        )}
        <span>
          {trialStatus === 'expiring_soon' 
            ? `¡Tu prueba gratuita termina en ${daysRemaining} día(s)!` 
            : `Estás disfrutando de tu prueba gratuita. Quedan ${daysRemaining} días.`
          }
        </span>
      </div>
      <Button 
        variant="link" 
        size="sm" 
        onClick={() => navigate('/configuracion?tab=plans')}
        className={`h-auto p-0 ${
          trialStatus === 'expiring_soon' ? 'text-amber-900' : 'text-indigo-900'
        } underline decoration-current font-medium`}
      >
        Elegir un plan
      </Button>
    </div>
  );
}

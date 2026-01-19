
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { trialService } from '@/services/trialService';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';

export function useTrialNotifications() {
  const { authUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || !authUser?.tenant?.is_trial) return;

    const trialEndsAt = authUser.tenant.trial_ends_at;
    const status = trialService.checkTrialStatus(trialEndsAt || null);
    
    // Check if we already notified in this session to avoid spam
    const hasNotified = sessionStorage.getItem('trial_notification_shown');

    if (status === 'expiring_soon' && !hasNotified) {
      toast.warning('¡Tu periodo de prueba termina pronto!', {
        description: 'Te quedan menos de 24 horas. Suscríbete para mantener el acceso.',
        action: {
          label: 'Suscribirse',
          onClick: () => navigate('/configuracion?tab=plans')
        },
        duration: 10000,
      });
      sessionStorage.setItem('trial_notification_shown', 'true');
    } else if (status === 'expired') {
      // If expired, ensure they are redirected or blocked
      // We allow access to settings page to subscribe
      if (!location.pathname.includes('/configuracion')) {
        toast.error('Periodo de prueba finalizado', {
          description: 'Tu prueba ha expirado. Por favor suscríbete para continuar.',
          action: {
            label: 'Ir a Planes',
            onClick: () => navigate('/configuracion?tab=plans')
          },
          duration: Infinity, // Persistent until clicked
        });
        
        // Optional: Force redirect if strict blocking is needed
        // navigate('/configuracion?tab=plans'); 
      }
    }
  }, [authUser, loading, navigate, location.pathname]);
}

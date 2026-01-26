
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Notification, NotificationPreferences, NotificationType } from '@/types/notifications';
import { NotificationService } from '@/services/notificationService';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  preferences: NotificationPreferences | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  refetch: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, authUser } = useAuth();
  const { toast } = useToast();

  const fetchNotifications = async () => {
    if (!user || !authUser?.tenant_id) return;

    try {
      // Fetch Notifications (In-App only)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('tenant_id', authUser.tenant_id)
        .or('channel.eq.in_app,channel.is.null') // Handle existing nulls as in_app
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotifications(data as unknown as Notification[]); // Cast because of potential type mismatch with new columns if not fully generated

      // Fetch Preferences
      const prefs = await NotificationService.getPreferences();
      setPreferences(prefs);

    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await NotificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Error marking as read:', error);
      toast({
        title: 'Error',
        description: 'No se pudo marcar como leída',
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: 'Error',
        description: 'No se pudo marcar todo como leído',
        variant: 'destructive',
      });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la notificación',
        variant: 'destructive',
      });
    }
  };

  const updatePreferences = async (prefs: Partial<NotificationPreferences>) => {
    try {
      await NotificationService.updatePreferences(prefs);
      const newPrefs = await NotificationService.getPreferences();
      setPreferences(newPrefs);
      toast({
        title: 'Preferencias actualizadas',
        description: 'Tus preferencias de notificaciones han sido guardadas.',
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron actualizar las preferencias',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (user && authUser?.tenant_id) {
      fetchNotifications();

      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `tenant_id=eq.${authUser.tenant_id}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newNotification = payload.new as unknown as Notification;
              // Filter for current user and channel
              if (
                (!newNotification.user_id || newNotification.user_id === user.id) &&
                (newNotification.channel === 'in_app' || !newNotification.channel)
              ) {
                setNotifications((prev) => [newNotification, ...prev]);
                toast({
                  title: newNotification.title,
                  description: newNotification.message,
                  variant: newNotification.type === 'error' ? 'destructive' : 'default',
                });
              }
            } else if (payload.eventType === 'UPDATE') {
              setNotifications((prev) => 
                prev.map((n) => (n.id === payload.new.id ? (payload.new as unknown as Notification) : n))
              );
            } else if (payload.eventType === 'DELETE') {
              setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setNotifications([]);
      setPreferences(null);
      setLoading(false);
    }
  }, [user, authUser, toast]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationsContext.Provider value={{ 
      notifications, 
      unreadCount, 
      loading, 
      preferences,
      markAsRead, 
      markAllAsRead, 
      deleteNotification,
      updatePreferences,
      refetch: fetchNotifications
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

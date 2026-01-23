import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type NotificationType = 'info' | 'warning' | 'error' | 'success';

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, authUser } = useAuth();
  const { toast } = useToast();

  const fetchNotifications = async () => {
    if (!user || !authUser?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('tenant_id', authUser.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotifications(data as Notification[]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
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
               // Only add if it belongs to this user or is global for tenant
               const newNotification = payload.new as Notification;
               if (!newNotification.user_id || newNotification.user_id === user.id) {
                 setNotifications((prev) => [newNotification, ...prev]);
                 toast({
                   title: newNotification.title,
                   description: newNotification.message,
                   variant: newNotification.type === 'error' ? 'destructive' : 'default',
                 });
               }
            } else if (payload.eventType === 'UPDATE') {
               setNotifications((prev) => 
                 prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n))
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
      setLoading(false);
    }
  }, [user, authUser]);

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
      
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Error',
        description: 'No se pudo marcar como leída',
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = async () => {
    if (!authUser?.tenant_id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('tenant_id', authUser.tenant_id)
        .eq('read', false)
        // Only update user's own notifications or null user_id? 
        // For simplicity, let's assume we filter by ID in the context of the user if needed, 
        // but the RLS policy should handle what they can update.
        // If user_id is null, it's for everyone, so maybe marking it read is per-user?
        // Wait, if user_id is null, marking it read changes it for everyone?
        // The table schema has 'read' column. If it's a shared notification, 'read' is shared.
        // This suggests shared notifications should probably be copied or have a separate read_receipts table.
        // But for now, let's assume personal notifications mostly.
        .or(`user_id.eq.${user?.id},user_id.is.null`);

      if (error) throw error;

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron marcar como leídas',
        variant: 'destructive',
      });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Optimistic update
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la notificación',
        variant: 'destructive',
      });
    }
  };

  const refetch = async () => {
    await fetchNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refetch,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotificationsContext must be used within a NotificationsProvider');
  }
  return context;
}

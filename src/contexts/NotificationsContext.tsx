import React, { createContext, useContext, useState } from 'react';

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
  // Placeholder implementation until notifications table is created
  const [notifications] = useState<Notification[]>([]);
  const [loading] = useState(false);

  const markAsRead = async (_id: string) => {
    // TODO: Implement when notifications table exists
    console.log('markAsRead called - notifications table not yet created');
  };

  const markAllAsRead = async () => {
    // TODO: Implement when notifications table exists
    console.log('markAllAsRead called - notifications table not yet created');
  };

  const deleteNotification = async (_id: string) => {
    // TODO: Implement when notifications table exists
    console.log('deleteNotification called - notifications table not yet created');
  };

  const refetch = async () => {
    // TODO: Implement when notifications table exists
    console.log('refetch called - notifications table not yet created');
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

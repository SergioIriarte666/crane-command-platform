
import React from 'react';
import { useNotifications } from '@/contexts/NotificationsContext';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, Trash2, Info, AlertTriangle, XCircle, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { NotificationType } from '@/types/notifications';

export default function NotificationsPage() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    loading 
  } = useNotifications();

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notificaciones</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona tus avisos y preferencias de notificación.
          </p>
        </div>
      </div>

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="inbox" className="relative">
            Bandeja de Entrada
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inbox" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <CardTitle>Mis Notificaciones</CardTitle>
                <CardDescription>
                  Historial de alertas y mensajes del sistema.
                </CardDescription>
              </div>
              {notifications.length > 0 && (
                <div className="flex gap-2">
                   {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
                      <Check className="w-4 h-4 mr-2" />
                      Marcar todo leído
                    </Button>
                   )}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-medium">No hay notificaciones</h3>
                  <p className="text-muted-foreground mt-1 max-w-sm">
                    No tienes notificaciones pendientes en este momento. Te avisaremos cuando ocurra algo importante.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-lg border transition-all hover:bg-muted/50",
                        !notification.read ? "bg-muted/30 border-l-4 border-l-primary" : "bg-card"
                      )}
                    >
                      <div className={cn("mt-1 p-2 rounded-full bg-background border shadow-sm")}>
                        {getIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <h4 className={cn("font-medium text-sm", !notification.read && "font-semibold")}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-muted-foreground flex items-center whitespace-nowrap ml-2">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {notification.message}
                        </p>
                        
                        {!notification.read && (
                          <div className="pt-2">
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="h-auto px-0 text-xs text-primary hover:text-primary/80 hover:bg-transparent p-0"
                               onClick={() => markAsRead(notification.id)}
                             >
                               Marcar como leída
                             </Button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

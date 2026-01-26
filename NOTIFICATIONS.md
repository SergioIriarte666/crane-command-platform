
# Módulo de Notificaciones

Este módulo proporciona un sistema completo para gestionar y enviar notificaciones a través de múltiples canales (In-App, Email, Push).

## Arquitectura

### Base de Datos
- **`notifications`**: Tabla principal que almacena el historial y estado de las notificaciones. Se ha extendido para soportar canales, estados (`pending`, `sent`, `failed`), metadatos y programación.
- **`notification_preferences`**: Almacena las preferencias de los usuarios por canal y tipo de notificación.
- **`notification_templates`**: (Opcional) Para plantillas de notificaciones configurables.

### Backend (Edge Functions)
- **`send-notification`**: Función principal para enviar notificaciones.
  - Acepta `userIds`, `templateCode` o contenido explícito (`title`, `message`).
  - Resuelve preferencias de usuario.
  - Inserta en la base de datos y despacha a proveedores externos (Email/Push).
  - Soporta envío inmediato o programado.
- **`process-notifications`**: Función para procesar notificaciones en cola (`status: pending` o `scheduled_for` vencido). Ideal para ejecutar vía Cron.

### Frontend
- **`NotificationService`**: Servicio TypeScript (`src/services/notificationService.ts`) que interactúa con las Edge Functions y la base de datos.
- **`NotificationsContext`**: Contexto de React que gestiona el estado global de notificaciones y la suscripción a tiempo real (Realtime).
- **`NotificationsPopover`**: Componente UI para visualizar notificaciones in-app.
- **`NotificationSettings`**: Componente UI para que los usuarios configuren sus preferencias.

## Uso

### Enviar una notificación desde el Frontend

```typescript
import { NotificationService } from '@/services/notificationService';

await NotificationService.send({
  userIds: ['uuid-usuario-1', 'uuid-usuario-2'],
  title: 'Nuevo Servicio Asignado',
  message: 'Se te ha asignado el servicio #12345',
  type: 'info',
  data: { serviceId: '12345' }, // Metadatos
  channels: ['in_app', 'email'] // Opcional: fuerza canales específicos
});
```

### Configuración de Preferencias

El componente `<NotificationSettings />` permite a los usuarios activar/desactivar notificaciones por tipo y canal.

### Sistema de Colas

Para notificaciones asíncronas, enviar con `scheduledFor` o usar la lógica interna de `send-notification` que puede marcar como `pending` si el canal requiere procesamiento pesado.
La función `process-notifications` debe ser invocada periódicamente (ej. cada minuto) para procesar la cola.

## Pruebas

Se han incluido pruebas unitarias para el servicio en `src/services/notificationService.test.ts`.
```bash
npm test src/services/notificationService.test.ts
```

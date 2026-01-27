# Estrategia de Implementación Rápida: WhatsApp Sandbox + Magic Link

Este documento detalla la estrategia seleccionada para desplegar notificaciones de WhatsApp a los operadores de manera **inmediata**, evitando los tiempos de espera y burocracia asociados a la verificación de cuentas de WhatsApp Business (Producción).

## Contexto
Para operar con la API oficial de WhatsApp Business en modo Producción, Meta (Facebook) requiere un proceso de verificación de negocio que puede tardar semanas. Para permitir la operación inmediata de la flota (aprox. 10 operadores), utilizaremos el entorno **Sandbox de Twilio** con una estrategia de enrolamiento simplificada.

## La Estrategia "Fast Track"

En lugar de esperar la aprobación de plantillas y verificación de negocio, utilizaremos el Sandbox de Twilio. Para eliminar la fricción de que los operadores tengan que escribir códigos manuales, utilizaremos un **"Magic Link"**.

### Paso 1: Generar el Enlace de Invitación (Magic Link)

Twilio permite crear un enlace URL que, al ser pulsado, abre la aplicación de WhatsApp con el mensaje de configuración precargado.

**Formato del Enlace:**
```
https://wa.me/14155238886?text=join%20<TU_CODIGO_DE_SANDBOX>
```

*   **`14155238886`**: Es el número oficial del Sandbox de Twilio (constante).
*   **`<TU_CODIGO_DE_SANDBOX>`**: Es la "palabra clave" única de tu cuenta de Twilio (ej. `join heavy-metal`).
    *   *Ubicación:* Consola de Twilio > Messaging > Try it out > Send a WhatsApp message.

### Paso 2: Distribución a Operadores

Envía el siguiente mensaje a tus operadores (por Email, SMS, o Grupo de WhatsApp interno):

> **Asunto: Activación de Notificaciones de Grúas**
>
> "Equipo, para comenzar a recibir las asignaciones de servicios directamente en su WhatsApp, por favor sigan este único paso:
>
> 1. Hagan clic en el siguiente enlace: **[PEGAR_TU_MAGIC_LINK_AQUÍ]**
> 2. Se abrirá su WhatsApp con un mensaje escrito.
> 3. Solo presionen **"Enviar"**.
>
> ¡Listo! Con eso quedarán activados para recibir las notificaciones del sistema."

### Paso 3: Operación

*   **Costo:** Gratis (mientras se use el Sandbox).
*   **Restricciones:** Solo los números que hayan enviado el mensaje "join" recibirán notificaciones.
*   **Funcionalidad:** Idéntica a producción. El código del sistema no cambia.

## Transición a Producción (Futuro)

Cuando la operación crezca o se requiera una imagen corporativa propia (nombre y logo propio en WhatsApp en lugar del logo de Twilio), se procederá a:

1.  **Verificación del Negocio:** Iniciar trámite en Meta Business Manager (requiere documentos legales).
2.  **Registro de Plantillas:** Aprobar las plantillas de mensajes (Templates) en Twilio que coincidan exactamente con las notificaciones del sistema.
3.  **Cambio de Número:** Actualizar la variable de entorno `TWILIO_WHATSAPP_NUMBER` en Supabase con el nuevo número verificado.

> **Nota Técnica:** El código fuente (Edge Functions, Triggers SQL) **NO requiere cambios** al pasar a producción, siempre y cuando las plantillas de texto coincidan.

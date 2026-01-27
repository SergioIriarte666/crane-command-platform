# Guía de Configuración e Integración de Twilio

Este documento detalla paso a paso cómo crear una cuenta en Twilio, configurarla y obtener las credenciales necesarias para integrar el sistema de notificaciones en tiempo real de **Crane Command Platform**.

## 1. Crear una Cuenta en Twilio

1.  Ve al sitio web de Twilio: [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio).
2.  Completa el formulario de registro con tu nombre, correo electrónico y una contraseña segura.
3.  Acepta los términos de servicio y haz clic en **"Start your free trial"**.
4.  **Verificación de Correo**: Recibirás un email de confirmación. Haz clic en el enlace para verificar tu cuenta.
5.  **Verificación de Teléfono**: Deberás ingresar tu número de teléfono personal para recibir un código SMS de verificación. Esto es necesario para activar la cuenta de prueba.

## 2. Configuración Inicial del Dashboard

Al ingresar por primera vez, Twilio te hará algunas preguntas para personalizar tu experiencia. Puedes responder lo siguiente:

*   **Which Twilio product are you here to use?**: SMS o WhatsApp.
*   **What do you plan to build?**: Alerts & Notifications.
*   **How do you want to build with Twilio?**: With code.
*   **What is your preferred coding language?**: Node.js (ya que usamos Edge Functions con TypeScript/Deno).

## 3. Obtener Credenciales de API

Una vez en el **Twilio Console (Dashboard)**, desplázate hacia abajo hasta encontrar la sección **"Account Info"**. Aquí encontrarás las claves vitales para la integración:

*   **Account SID**: Es el identificador único de tu cuenta (empieza con `AC...`).
*   **Auth Token**: Es tu llave secreta. Haz clic en "Show" para verla.

> ⚠️ **IMPORTANTE**: Guarda estas credenciales en un lugar seguro. Nunca las compartas públicamente ni las subas a repositorios de código públicos.

## 4. Obtener un Número de Teléfono (SMS)

Para enviar SMS, necesitas un número de Twilio.

1.  En el Dashboard, haz clic en el botón **"Get a trial phone number"**.
2.  Twilio te asignará un número gratuito (ej. `+1 234 567 8901`).
3.  Anota este número, ya que será el **remitente** de tus notificaciones SMS.

> **Nota sobre Cuentas de Prueba (Trial)**: En modo prueba, solo puedes enviar SMS a números que hayas verificado previamente en la sección "Verified Caller IDs" de Twilio. Para producción, deberás actualizar la cuenta (pagar) para enviar a cualquier número.

## 5. Configurar WhatsApp (Sandbox)

Para evitar el complejo proceso de aprobación de WhatsApp Business API durante el desarrollo, utilizaremos el **WhatsApp Sandbox**.

1.  En el menú lateral izquierdo, ve a **Messaging > Try it out > Send a WhatsApp message**.
2.  Sigue las instrucciones para unirte al Sandbox:
    *   Envía un mensaje de WhatsApp desde tu teléfono al número que muestra la pantalla con el código que te indican (ej. `join something-random`).
    *   Si recibes una respuesta de confirmación, ¡ya estás conectado!
3.  Anota el número de teléfono del Sandbox (será el remitente de WhatsApp).

## 6. Integración en el Proyecto (Supabase)

Para que la plataforma pueda usar estas credenciales, debemos agregarlas como "Secretos" en nuestras Edge Functions de Supabase.

### Opción A: Vía Dashboard de Supabase
1.  Ve a tu proyecto en Supabase.
2.  Navega a **Settings > Edge Functions**.
3.  Agrega las siguientes variables:
    *   `TWILIO_ACCOUNT_SID`: (Tu Account SID)
    *   `TWILIO_AUTH_TOKEN`: (Tu Auth Token)
    *   `TWILIO_PHONE_NUMBER`: (Tu número de Twilio para SMS)
    *   `TWILIO_WHATSAPP_NUMBER`: (El número del Sandbox, ej. `whatsapp:+14155238886`)

### Opción B: Vía Archivo `.env` (Desarrollo Local)
Agrega estas líneas a tu archivo `.env` en la raíz del proyecto:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## 7. Próximos Pasos

Una vez configurado:
1.  El sistema detectará automáticamente cuando se crea un nuevo servicio.
2.  La Edge Function `process-notifications` leerá estas credenciales.
3.  Se enviará una notificación al operador asignado vía WhatsApp o SMS (según configuración).

## Recursos Adicionales

*   [Documentación Oficial de Twilio](https://www.twilio.com/docs)
*   [Twilio API para WhatsApp](https://www.twilio.com/docs/whatsapp/api)
*   [Precios de Twilio](https://www.twilio.com/pricing)

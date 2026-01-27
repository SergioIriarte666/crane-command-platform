-- Agregar canales de mensajería al enum existente
ALTER TYPE public.notification_channel ADD VALUE IF NOT EXISTS 'whatsapp';
ALTER TYPE public.notification_channel ADD VALUE IF NOT EXISTS 'sms';

-- Función para generar notificación automática al crear servicio
CREATE OR REPLACE FUNCTION public.handle_new_service_notification()
RETURNS TRIGGER AS $$
DECLARE
  operator_phone TEXT;
  operator_user_id UUID;
  service_url TEXT;
BEGIN
  -- Solo proceder si hay un operador asignado
  IF NEW.assigned_operator_id IS NOT NULL THEN
    -- Obtener datos del operador
    SELECT phone, user_id INTO operator_phone, operator_user_id
    FROM public.operators
    WHERE id = NEW.assigned_operator_id;

    -- Construir URL del servicio (ajustar dominio según entorno o usar variable)
    -- Por defecto asumimos la ruta del frontend
    service_url := '/services/' || NEW.id;

    -- Insertar notificación
    -- Se inserta como 'pending' para que la Edge Function la procese
    INSERT INTO public.notifications (
      tenant_id,
      user_id,
      title,
      message,
      type,
      channel,
      metadata,
      status
    ) VALUES (
      NEW.tenant_id,
      operator_user_id, -- Puede ser NULL si el operador no tiene usuario vinculado
      'Nueva Solicitud: ' || NEW.service_folio,
      'Nuevo servicio asignado en ' || COALESCE(NEW.origin_destination, 'ubicación pendiente') || '. Folio: ' || NEW.service_folio,
      'info',
      -- Lógica simple: si tiene teléfono, intentar WhatsApp, si no, In-App
      CASE 
        WHEN operator_phone IS NOT NULL AND LENGTH(operator_phone) > 0 THEN 'whatsapp'::public.notification_channel
        ELSE 'in_app'::public.notification_channel 
      END,
      jsonb_build_object(
        'service_id', NEW.id,
        'folio', NEW.service_folio,
        'phone', operator_phone,
        'url', service_url,
        'urgency', 'high'
      ),
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS on_service_created ON public.services;

CREATE TRIGGER on_service_created
  AFTER INSERT ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_service_notification();

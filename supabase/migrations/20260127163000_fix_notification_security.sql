-- Fix handle_new_service_notification (Trigger on services table)
-- Add SECURITY DEFINER to bypass RLS on notifications table insert
CREATE OR REPLACE FUNCTION public.handle_new_service_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_operator_phone TEXT;
  v_operator_user_id UUID;
  v_service_url TEXT;
BEGIN
  -- Solo proceder si hay un operador asignado (usando la columna correcta operator_id)
  IF NEW.operator_id IS NOT NULL THEN
    -- Obtener datos del operador
    SELECT phone, user_id INTO v_operator_phone, v_operator_user_id
    FROM public.operators
    WHERE id = NEW.operator_id;

    -- Construir URL
    v_service_url := '/services/' || NEW.id;

    -- Insertar notificación
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
      v_operator_user_id, -- Usar el user_id del operador (auth.users)
      'Nueva Solicitud: ' || NEW.folio,
      'Nuevo servicio asignado en ' || COALESCE(NEW.origin_city, NEW.origin_address, 'ubicación pendiente') || '. Folio: ' || NEW.folio,
      'info',
      CASE 
        WHEN v_operator_phone IS NOT NULL AND LENGTH(v_operator_phone) > 0 THEN 'whatsapp'::public.notification_channel
        ELSE 'in_app'::public.notification_channel 
      END,
      jsonb_build_object(
        'service_id', NEW.id,
        'folio', NEW.folio,
        'phone', v_operator_phone,
        'url', v_service_url,
        'urgency', 'high'
      ),
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

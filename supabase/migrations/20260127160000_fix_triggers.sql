-- Fix handle_new_service_notification (Trigger on services table)
-- Resolves error: record "new" has no field "assigned_operator_id"
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
$$ LANGUAGE plpgsql;

-- Fix handle_new_service_assignment (Trigger on service_operators table)
-- Resolves potential FK error and incorrect operator ID usage
CREATE OR REPLACE FUNCTION public.handle_new_service_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_service_folio TEXT;
    v_service_client_name TEXT;
    v_service_origin TEXT;
    v_service_destination TEXT;
    v_service_date TIMESTAMP WITH TIME ZONE;
    v_tenant_id UUID;
    v_operator_phone TEXT;
    v_operator_user_id UUID;
    v_operator_prefs JSONB;
    v_channel TEXT := 'in_app';
    v_message TEXT;
BEGIN
    -- 0. Get Operator User ID and Phone from Operators table
    -- Correctly link operator record to auth user
    SELECT user_id, phone INTO v_operator_user_id, v_operator_phone
    FROM public.operators
    WHERE id = NEW.operator_id;

    -- 1. Get Service Details
    SELECT 
        s.folio,
        c.name,
        s.origin_city,
        s.destination_city,
        s.scheduled_date,
        s.tenant_id
    INTO 
        v_service_folio,
        v_service_client_name,
        v_service_origin,
        v_service_destination,
        v_service_date,
        v_tenant_id
    FROM public.services s
    LEFT JOIN public.clients c ON s.client_id = c.id
    WHERE s.id = NEW.service_id;

    -- 2. Get Operator Preferences (using user_id)
    IF v_operator_user_id IS NOT NULL THEN
        SELECT settings INTO v_operator_prefs
        FROM public.notification_preferences
        WHERE user_id = v_operator_user_id;
    END IF;

    -- 3. Determine Channel
    IF v_operator_phone IS NOT NULL THEN
        IF (v_operator_prefs IS NULL) OR 
           (v_operator_prefs->'service_assigned' IS NULL) OR
           (v_operator_prefs->'service_assigned'->>'whatsapp' IS NULL) OR 
           ((v_operator_prefs->'service_assigned'->>'whatsapp')::boolean = true) THEN
            v_channel := 'whatsapp';
        ELSIF ((v_operator_prefs->'service_assigned'->>'sms')::boolean = true) THEN
            v_channel := 'sms';
        END IF;
    END IF;

    -- 4. Build Message
    v_message := format(
        '🔔 Crane Command: Se te ha asignado el servicio %s. Cliente: %s. Origen: %s. Destino: %s. Fecha: %s.',
        COALESCE(v_service_folio, 'N/A'),
        COALESCE(v_service_client_name, 'N/A'),
        COALESCE(v_service_origin, 'N/A'),
        COALESCE(v_service_destination, 'N/A'),
        COALESCE(to_char(v_service_date, 'DD/MM/YYYY HH24:MI'), 'N/A')
    );

    -- 5. Insert Notification
    INSERT INTO public.notifications (
        tenant_id,
        user_id,
        title,
        message,
        type,
        channel,
        status,
        metadata
    ) VALUES (
        v_tenant_id,
        v_operator_user_id,
        'Nuevo Servicio Asignado',
        v_message,
        'info',
        v_channel::public.notification_channel,
        'pending',
        jsonb_build_object(
            'service_id', NEW.service_id,
            'phone', v_operator_phone
        )
    );

    RETURN NEW;
END;
$$;

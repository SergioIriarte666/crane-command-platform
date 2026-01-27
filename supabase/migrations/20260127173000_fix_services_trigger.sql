-- Asegurar que existen los canales
ALTER TYPE public.notification_channel ADD VALUE IF NOT EXISTS 'whatsapp';
ALTER TYPE public.notification_channel ADD VALUE IF NOT EXISTS 'sms';

CREATE OR REPLACE FUNCTION public.handle_new_service_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_service_id UUID;
    v_operator_id UUID;
    v_service_folio TEXT;
    v_service_client_name TEXT;
    v_service_origin TEXT;
    v_service_destination TEXT;
    v_service_date TIMESTAMP WITH TIME ZONE;
    v_tenant_id UUID;
    v_operator_phone TEXT;
    v_operator_prefs JSONB;
    v_auth_user_id UUID;
    v_channel TEXT := 'in_app';
    v_message TEXT;
BEGIN
    -- 0. Determinar IDs según tabla origen
    IF TG_TABLE_NAME = 'services' THEN
        v_service_id := NEW.id;
        v_operator_id := NEW.operator_id;
        
        -- Si no hay operador asignado, salir
        IF v_operator_id IS NULL THEN
            RETURN NEW;
        END IF;

        -- Si es UPDATE, verificar que cambió el operador
        IF (TG_OP = 'UPDATE') THEN
            IF (OLD.operator_id IS NOT DISTINCT FROM NEW.operator_id) THEN
                RETURN NEW;
            END IF;
        END IF;
    ELSE
        -- service_operators (Siempre es INSERT o asignación explícita)
        v_service_id := NEW.service_id;
        v_operator_id := NEW.operator_id;
    END IF;

    -- 1. Obtener datos del servicio
    SELECT 
        s.folio, c.name, s.origin_city, s.destination_city, s.scheduled_date, s.tenant_id
    INTO 
        v_service_folio, v_service_client_name, v_service_origin, v_service_destination, v_service_date, v_tenant_id
    FROM public.services s
    LEFT JOIN public.clients c ON s.client_id = c.id
    WHERE s.id = v_service_id;

    -- 2. Obtener teléfono y ID de usuario (si existe)
    SELECT 
        COALESCE(o.phone, p.phone),
        np.settings,
        o.user_id
    INTO 
        v_operator_phone, v_operator_prefs, v_auth_user_id
    FROM public.operators o
    LEFT JOIN public.profiles p ON p.id = o.user_id
    LEFT JOIN public.notification_preferences np ON np.user_id = o.user_id
    WHERE o.id = v_operator_id;

    -- 3. Canal
    IF v_operator_phone IS NOT NULL THEN
        -- Lógica de preferencias (si no tiene prefs, asume whatsapp activo)
        IF (v_operator_prefs IS NULL) OR 
           (v_operator_prefs->'service_assigned' IS NULL) OR
           (v_operator_prefs->'service_assigned'->>'whatsapp' IS NULL) OR 
           ((v_operator_prefs->'service_assigned'->>'whatsapp')::boolean = true) THEN
            v_channel := 'whatsapp';
        ELSIF ((v_operator_prefs->'service_assigned'->>'sms')::boolean = true) THEN
            v_channel := 'sms';
        END IF;
    END IF;

    -- 4. Mensaje
    v_message := format(
        '🔔 Crane Command: Se te ha asignado el servicio %s. Cliente: %s. Origen: %s. Destino: %s. Fecha: %s.',
        COALESCE(v_service_folio, 'N/A'),
        COALESCE(v_service_client_name, 'N/A'),
        COALESCE(v_service_origin, 'N/A'),
        COALESCE(v_service_destination, 'N/A'),
        COALESCE(to_char(v_service_date, 'DD/MM/YYYY HH24:MI'), 'N/A')
    );

    -- 5. Insertar (Permitimos user_id NULL si tenemos teléfono para enviar WhatsApp)
    IF v_auth_user_id IS NOT NULL OR (v_operator_phone IS NOT NULL AND v_channel IN ('whatsapp', 'sms')) THEN
        INSERT INTO public.notifications (
            tenant_id, user_id, title, message, type, channel, status, metadata
        ) VALUES (
            v_tenant_id, 
            v_auth_user_id, -- Puede ser NULL (sin usuario vinculado)
            'Nuevo Servicio Asignado', v_message, 'info', 
            v_channel::public.notification_channel, 'pending',
            jsonb_build_object('service_id', v_service_id, 'phone', v_operator_phone)
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Trigger para services (ACTUALIZADO: INSERT OR UPDATE)
DROP TRIGGER IF EXISTS trigger_notify_service_assignment_update ON public.services;
CREATE TRIGGER trigger_notify_service_assignment_update
    AFTER INSERT OR UPDATE OF operator_id ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_service_assignment();
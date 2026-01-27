-- SOLUCIÓN A MENSAJES DUPLICADOS
-- 1. Eliminar triggers antiguos que causan notificaciones duplicadas (Formato antiguo y disparos múltiples)
DROP TRIGGER IF EXISTS on_service_created ON public.services; -- Culpable del mensaje formato antiguo
DROP TRIGGER IF EXISTS trigger_notify_service_assignment ON public.service_operators; -- Posible duplicado si se usa esta tabla
DROP TRIGGER IF EXISTS notify_service_assignment ON public.services; -- Limpieza general

-- 2. Actualizar la función principal con lógica de DEDUPLICACIÓN robusta
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
    v_client_phone TEXT;
    v_service_origin TEXT;
    v_service_destination TEXT;
    v_service_date TIMESTAMP WITH TIME ZONE;
    v_tenant_id UUID;
    v_operator_phone TEXT;
    v_operator_name TEXT;
    v_auth_user_id UUID;
    v_channel TEXT := 'in_app';
    v_message TEXT;
BEGIN
    -- 1. Identificar IDs según la tabla origen (services o service_operators)
    IF TG_TABLE_NAME = 'services' THEN
        v_service_id := NEW.id;
        v_operator_id := NEW.operator_id;
        
        -- Si no hay operador, salir
        IF v_operator_id IS NULL THEN RETURN NEW; END IF;

        -- Si es UPDATE, solo notificar si cambió el operador
        IF (TG_OP = 'UPDATE') AND (OLD.operator_id IS NOT DISTINCT FROM NEW.operator_id) THEN
            RETURN NEW;
        END IF;
    ELSE
        -- service_operators
        v_service_id := NEW.service_id;
        v_operator_id := NEW.operator_id;
    END IF;

    -- 2. DEDUPLICACIÓN: Verificar si ya se envió una notificación para este servicio y operador en el último minuto
    -- Esto previene disparos múltiples si el trigger se ejecuta varias veces por transacción o reintentos
    IF EXISTS (
        SELECT 1 FROM public.notifications 
        WHERE metadata->>'service_id' = v_service_id::text
        AND (
            (user_id IS NOT NULL AND user_id = (SELECT user_id FROM public.operators WHERE id = v_operator_id))
            OR 
            (metadata->>'phone' = (SELECT COALESCE(o.phone, p.phone) FROM public.operators o LEFT JOIN public.profiles p ON p.id = o.user_id WHERE o.id = v_operator_id))
        )
        AND created_at > now() - interval '1 minute'
        AND title = 'Nuevo Servicio Asignado'
    ) THEN
        RETURN NEW;
    END IF;

    -- 3. Obtener datos del servicio Y DEL CLIENTE
    SELECT 
        s.folio, 
        c.name, 
        c.phone,
        s.origin_city, 
        s.destination_city, 
        s.scheduled_date, 
        s.tenant_id
    INTO 
        v_service_folio, 
        v_service_client_name, 
        v_client_phone,
        v_service_origin, 
        v_service_destination, 
        v_service_date, 
        v_tenant_id
    FROM public.services s
    LEFT JOIN public.clients c ON s.client_id = c.id
    WHERE s.id = v_service_id;

    -- 4. Obtener datos del operador
    SELECT COALESCE(o.phone, p.phone), p.full_name, o.user_id
    INTO v_operator_phone, v_operator_name, v_auth_user_id
    FROM public.operators o
    LEFT JOIN public.profiles p ON p.id = o.user_id
    WHERE o.id = v_operator_id;

    -- 5. Definir canal (Si tiene teléfono -> WhatsApp)
    IF v_operator_phone IS NOT NULL AND length(v_operator_phone) > 8 THEN
        v_channel := 'whatsapp';
    END IF;

    -- 6. CONSTRUIR EL MENSAJE
    v_message := format(
        '🆕 *NUEVA ASIGNACIÓN DE SERVICIO*' || chr(10) || chr(10) ||
        '📄 *Folio:* %s' || chr(10) ||
        '👤 *Cliente:* %s' || chr(10) ||
        '📞 *Tel. Cliente:* %s' || chr(10) ||
        '🚛 *Ruta:* %s ➡️ %s' || chr(10) ||
        '📅 *Fecha:* %s' || chr(10) || chr(10) ||
        'Por favor, ingresa a la App para ver más detalles y confirmar.',
        COALESCE(v_service_folio, 'S/N'),
        COALESCE(v_service_client_name, 'Cliente General'),
        COALESCE(v_client_phone, 'No registrado'),
        COALESCE(v_service_origin, 'Origen'),
        COALESCE(v_service_destination, 'Destino'),
        COALESCE(to_char(v_service_date, 'DD/MM/YYYY HH24:MI'), 'Por definir')
    );

    -- 7. Insertar notificación
    IF v_auth_user_id IS NOT NULL OR v_channel = 'whatsapp' THEN
        INSERT INTO public.notifications (
            tenant_id, user_id, title, message, type, channel, status, metadata
        ) VALUES (
            v_tenant_id, 
            v_auth_user_id, 
            'Nuevo Servicio Asignado', 
            v_message, 
            'info', 
            v_channel::public.notification_channel, 
            'pending',
            jsonb_build_object(
                'service_id', v_service_id, 
                'phone', v_operator_phone,
                'client_phone', v_client_phone
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

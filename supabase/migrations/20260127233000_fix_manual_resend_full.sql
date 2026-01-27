-- ==============================================================================
-- SOLUCIÓN COMPLETA: REENVÍO MANUAL DE NOTIFICACIONES (CORREGIDO)
-- ==============================================================================

-- 0. LIMPIEZA PREVIA (Crucial para evitar error 42P13)
DROP FUNCTION IF EXISTS public.manual_notify_service_assignment_by_folio(text);
DROP FUNCTION IF EXISTS public.manual_notify_service_assignment(UUID);

-- 1. Función base que recibe UUID (Identificador interno)
CREATE OR REPLACE FUNCTION public.manual_notify_service_assignment(p_service_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
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
    -- Obtener datos básicos del servicio
    SELECT operator_id, tenant_id INTO v_operator_id, v_tenant_id
    FROM public.services WHERE id = p_service_id;

    IF v_operator_id IS NULL THEN
        RETURN 'Error: El servicio no tiene operador asignado. Asigna uno primero.';
    END IF;

    -- Obtener detalles del servicio y cliente
    SELECT 
        s.folio, 
        c.name, 
        c.phone,
        s.origin_city, 
        s.destination_city, 
        s.scheduled_date
    INTO 
        v_service_folio, 
        v_service_client_name, 
        v_client_phone,
        v_service_origin, 
        v_service_destination, 
        v_service_date
    FROM public.services s
    LEFT JOIN public.clients c ON s.client_id = c.id
    WHERE s.id = p_service_id;

    -- Obtener datos del operador
    SELECT COALESCE(o.phone, p.phone), p.full_name, o.user_id
    INTO v_operator_phone, v_operator_name, v_auth_user_id
    FROM public.operators o
    LEFT JOIN public.profiles p ON p.id = o.user_id
    WHERE o.id = v_operator_id;

    -- Definir canal
    IF v_operator_phone IS NOT NULL AND length(v_operator_phone) > 8 THEN
        v_channel := 'whatsapp';
    END IF;

    -- Construir mensaje
    v_message := format(
        '🔔 *RECORDATORIO DE ASIGNACIÓN*' || chr(10) || chr(10) ||
        '📄 *Folio:* %s' || chr(10) ||
        '👤 *Cliente:* %s' || chr(10) ||
        '📞 *Tel. Cliente:* %s' || chr(10) ||
        '🚛 *Ruta:* %s ➡️ %s' || chr(10) ||
        '📅 *Fecha:* %s' || chr(10) || chr(10) ||
        'Por favor, ingresa a la App para confirmar.',
        COALESCE(v_service_folio, 'S/N'),
        COALESCE(v_service_client_name, 'Cliente General'),
        COALESCE(v_client_phone, 'No registrado'),
        COALESCE(v_service_origin, 'Origen'),
        COALESCE(v_service_destination, 'Destino'),
        COALESCE(to_char(v_service_date, 'DD/MM/YYYY HH24:MI'), 'Por definir')
    );

    -- Insertar notificación
    INSERT INTO public.notifications (
        tenant_id, user_id, title, message, type, channel, status, metadata
    ) VALUES (
        v_tenant_id, 
        v_auth_user_id, 
        'Recordatorio de Asignación', 
        v_message, 
        'info', 
        v_channel::public.notification_channel, 
        'pending',
        jsonb_build_object(
            'service_id', p_service_id, 
            'phone', v_operator_phone,
            'client_phone', v_client_phone,
            'manual_retry', true
        )
    );

    RETURN 'Notificación reenviada correctamente a ' || COALESCE(v_operator_phone, 'Sin teléfono');
END;
$$;

-- 2. Función Wrapper que recibe FOLIO (Texto) - Esta es la que usa el Frontend
CREATE OR REPLACE FUNCTION public.manual_notify_service_assignment_by_folio(service_folio text)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_service_id UUID;
BEGIN
    -- Buscar ID por Folio
    SELECT id INTO v_service_id FROM public.services WHERE folio = service_folio LIMIT 1;
    
    IF v_service_id IS NULL THEN
        RETURN 'Error: No se encontró un servicio con el folio ' || service_folio;
    END IF;

    -- Llamar a la función principal
    RETURN public.manual_notify_service_assignment(v_service_id);
END;
$$;

-- 3. Otorgar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.manual_notify_service_assignment(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manual_notify_service_assignment(UUID) TO service_role;

GRANT EXECUTE ON FUNCTION public.manual_notify_service_assignment_by_folio(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.manual_notify_service_assignment_by_folio(text) TO service_role;

-- 4. Recargar caché del esquema
NOTIFY pgrst, 'reload config';

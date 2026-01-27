-- Script de Diagnóstico y Prueba Manual
-- Ejecuta esto para verificar por qué no se generan notificaciones

DO $$
DECLARE
    v_service_count integer;
    v_notif_count integer;
    v_latest_service record;
    v_operator record;
    v_profile_phone text;
BEGIN
    -- 1. Contar registros
    SELECT count(*) INTO v_service_count FROM services;
    SELECT count(*) INTO v_notif_count FROM notifications;
    
    RAISE NOTICE '---------------- DIAGNÓSTICO ----------------';
    RAISE NOTICE 'Total Servicios: %', v_service_count;
    RAISE NOTICE 'Total Notificaciones: %', v_notif_count;

    -- 2. Analizar el último servicio creado/modificado
    SELECT * INTO v_latest_service 
    FROM services 
    ORDER BY updated_at DESC 
    LIMIT 1;

    IF v_latest_service.id IS NOT NULL THEN
        RAISE NOTICE 'Último Servicio: % (ID: %)', v_latest_service.folio, v_latest_service.id;
        RAISE NOTICE 'Operador Asignado ID: %', v_latest_service.operator_id;

        IF v_latest_service.operator_id IS NOT NULL THEN
            -- Verificar datos del operador
            SELECT * INTO v_operator 
            FROM operators 
            WHERE id = v_latest_service.operator_id;
            
            RAISE NOTICE 'Operador encontrado: %', (v_operator.id IS NOT NULL);
            RAISE NOTICE 'Teléfono en Operador: %', v_operator.phone;
            RAISE NOTICE 'User ID del Operador: %', v_operator.user_id;

            -- Verificar teléfono en perfil si existe usuario vinculado
            IF v_operator.user_id IS NOT NULL THEN
                SELECT phone INTO v_profile_phone 
                FROM profiles 
                WHERE id = v_operator.user_id;
                RAISE NOTICE 'Teléfono en Perfil (Auth): %', v_profile_phone;
            ELSE
                RAISE NOTICE 'Operador sin usuario de sistema vinculado';
            END IF;
        ELSE
            RAISE NOTICE 'ALERTA: El último servicio no tiene operador asignado.';
        END IF;
    ELSE
        RAISE NOTICE 'No hay servicios en la base de datos.';
    END IF;
    RAISE NOTICE '---------------------------------------------';
END $$;

-- 3. FORZAR una notificación de prueba para el último servicio con operador
-- Esto nos dirá si el problema es el Trigger (creación) o la Edge Function (envío)
INSERT INTO public.notifications (
    tenant_id,
    user_id,
    title,
    message,
    type,
    channel,
    status,
    metadata
)
SELECT 
    s.tenant_id,
    o.user_id,
    'Prueba Diagnóstico Manual',
    'Mensaje de prueba forzado desde SQL para validar envío WhatsApp. ' || to_char(now(), 'HH24:MI:SS'),
    'info',
    'whatsapp',
    'pending',
    jsonb_build_object(
        'service_id', s.id, 
        'phone', COALESCE(o.phone, '+56987696972') -- Usar teléfono del operador o fallback al tuyo
    )
FROM services s
JOIN operators o ON s.operator_id = o.id
WHERE s.operator_id IS NOT NULL
ORDER BY s.updated_at DESC
LIMIT 1
RETURNING id, status, channel, metadata;

-- SOLUCIÓN DEFINITIVA V2 (CORREGIDA): Arreglo de Trigger + Recuperación Segura

-- 1. Asegurar que la tabla notifications tiene la estructura correcta
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Asegurar que los tipos de canal existen
ALTER TYPE public.notification_channel ADD VALUE IF NOT EXISTS 'whatsapp';
ALTER TYPE public.notification_channel ADD VALUE IF NOT EXISTS 'sms';

-- 3. Actualizar la función del Trigger para que sea A PRUEBA DE FALLOS
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
    v_auth_user_id UUID;
    v_channel TEXT := 'in_app';
    v_message TEXT;
BEGIN
    -- Identificar IDs según la tabla (services o service_operators)
    IF TG_TABLE_NAME = 'services' THEN
        v_service_id := NEW.id;
        v_operator_id := NEW.operator_id;
        
        -- Si no hay operador, no hacemos nada
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

    -- Obtener datos del servicio
    SELECT s.folio, c.name, s.origin_city, s.destination_city, s.scheduled_date, s.tenant_id
    INTO v_service_folio, v_service_client_name, v_service_origin, v_service_destination, v_service_date, v_tenant_id
    FROM public.services s
    LEFT JOIN public.clients c ON s.client_id = c.id
    WHERE s.id = v_service_id;

    -- Obtener datos del operador (Teléfono: Prioridad Operador > Perfil)
    SELECT COALESCE(o.phone, p.phone), o.user_id
    INTO v_operator_phone, v_auth_user_id
    FROM public.operators o
    LEFT JOIN public.profiles p ON p.id = o.user_id
    WHERE o.id = v_operator_id;

    -- Definir canal (Si tiene teléfono -> WhatsApp, sino -> In-App)
    IF v_operator_phone IS NOT NULL AND length(v_operator_phone) > 8 THEN
        v_channel := 'whatsapp';
    END IF;

    -- Construir mensaje
    v_message := format(
        '🔔 Crane Command: Asignación de Servicio %s. Cliente: %s. Ruta: %s -> %s. Fecha: %s.',
        COALESCE(v_service_folio, 'S/N'),
        COALESCE(v_service_client_name, 'Cliente General'),
        COALESCE(v_service_origin, 'Origen'),
        COALESCE(v_service_destination, 'Destino'),
        COALESCE(to_char(v_service_date, 'DD/MM/YYYY HH24:MI'), 'Por definir')
    );

    -- Insertar notificación
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
            jsonb_build_object('service_id', v_service_id, 'phone', v_operator_phone)
        );
    END IF;

    RETURN NEW;
END;
$$;

-- 4. Re-conectar el Trigger
DROP TRIGGER IF EXISTS trigger_notify_service_assignment_update ON public.services;
CREATE TRIGGER trigger_notify_service_assignment_update
    AFTER INSERT OR UPDATE OF operator_id ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_service_assignment();

-- 5. RECUPERACIÓN DE DATOS CORREGIDA (Sin error UUID)
INSERT INTO public.notifications (
    tenant_id, user_id, title, message, type, channel, status, metadata
)
SELECT 
    s.tenant_id,
    o.user_id,
    'Nuevo Servicio Asignado (Recuperado)',
    format('🔔 Crane Command: Asignación de Servicio %s. Cliente: %s. Ruta: %s -> %s.', 
        COALESCE(s.folio, 'S/N'), 
        COALESCE(c.name, 'Cliente'),
        COALESCE(s.origin_city, 'Origen'),
        COALESCE(s.destination_city, 'Destino')
    ),
    'info',
    CASE 
        WHEN COALESCE(o.phone, p.phone) IS NOT NULL THEN 'whatsapp'::public.notification_channel
        ELSE 'in_app'::public.notification_channel
    END,
    'pending',
    jsonb_build_object('service_id', s.id, 'phone', COALESCE(o.phone, p.phone))
FROM services s
JOIN operators o ON s.operator_id = o.id
LEFT JOIN profiles p ON o.user_id = p.id
LEFT JOIN clients c ON s.client_id = c.id
WHERE s.updated_at > (now() - interval '24 hours')
AND s.operator_id IS NOT NULL
-- Corrección aquí: Comparamos como TEXTO para evitar error con "test-service-id"
AND NOT EXISTS (
    SELECT 1 FROM notifications n 
    WHERE n.metadata->>'service_id' = s.id::text
);

-- Habilitar extensión para hacer llamadas HTTP
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Función que invoca a la Edge Function
CREATE OR REPLACE FUNCTION public.trigger_process_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_url TEXT := 'https://qfopiqsqufravywakdpa.supabase.co/functions/v1/process-notifications';
    v_anon_key TEXT := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmb3BpcXNxdWZyYXZ5d2FrZHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwODUwODgsImV4cCI6MjA4NDY2MTA4OH0.QzYEI98CPPDynQ8DYYi2Psso_MPXhe7N_Bj0Q0pd4DI';
    v_request_id INTEGER;
BEGIN
    -- Realizar petición POST asíncrona a la Edge Function
    -- Usamos pg_net para no bloquear la transacción de base de datos
    SELECT net.http_post(
        url := v_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_anon_key
        ),
        body := '{}'::jsonb
    ) INTO v_request_id;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Si falla la llamada HTTP, no queremos revertir la inserción de la notificación
    -- Solo logueamos el error (opcional)
    RAISE WARNING 'Error invocando process-notifications: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Trigger que se activa al insertar una nueva notificación
DROP TRIGGER IF EXISTS on_notification_created ON public.notifications;
CREATE TRIGGER on_notification_created
    AFTER INSERT ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_process_notifications();

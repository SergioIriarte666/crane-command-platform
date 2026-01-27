-- Función auxiliar para reintentar notificaciones fallidas
CREATE OR REPLACE FUNCTION public.retry_failed_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.notifications 
    SET status = 'pending', 
        updated_at = now() 
    WHERE status = 'failed' 
    AND created_at > now() - interval '1 hour';
END;
$$;

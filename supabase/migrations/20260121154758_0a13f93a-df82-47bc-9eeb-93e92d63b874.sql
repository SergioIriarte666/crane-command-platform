-- Fix trigger: cast text status to service_status enum
CREATE OR REPLACE FUNCTION public.log_service_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.service_status_history (service_id, from_status, to_status, changed_by)
        VALUES (NEW.id, OLD.status::service_status, NEW.status::service_status, auth.uid());
    END IF;
    RETURN NEW;
END;
$function$;
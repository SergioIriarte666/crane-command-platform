-- Make status history store text statuses (services.status is text and VIP pipeline uses extra statuses)
ALTER TABLE public.service_status_history
  ALTER COLUMN from_status TYPE text USING from_status::text,
  ALTER COLUMN to_status TYPE text USING to_status::text;

-- Update trigger function to write text values (no enum casts)
CREATE OR REPLACE FUNCTION public.log_service_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.service_status_history (service_id, from_status, to_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
    END IF;
    RETURN NEW;
END;
$function$;
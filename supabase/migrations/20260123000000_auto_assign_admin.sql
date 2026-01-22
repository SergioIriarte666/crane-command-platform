
-- Migration to auto-assign admin role to specific email on signup

CREATE OR REPLACE FUNCTION public.auto_assign_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_tenant_id UUID := 'c8594776-4bfc-408e-b18e-f0d8cde622ca';
BEGIN
    IF NEW.email = 'siriartev@gmail.com' THEN
        -- Update profile with tenant_id
        UPDATE public.profiles
        SET tenant_id = target_tenant_id
        WHERE id = NEW.id;

        -- Assign admin role for the specific tenant
        INSERT INTO public.user_roles (user_id, tenant_id, role)
        VALUES (NEW.id, target_tenant_id, 'admin')
        ON CONFLICT (user_id, tenant_id, role) DO NOTHING;
        
        -- Assign super_admin role (system wide)
        INSERT INTO public.user_roles (user_id, tenant_id, role)
        VALUES (NEW.id, NULL, 'super_admin')
        ON CONFLICT (user_id, tenant_id, role) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_assign_admin ON public.profiles;

CREATE TRIGGER on_profile_created_assign_admin
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_assign_admin_role();

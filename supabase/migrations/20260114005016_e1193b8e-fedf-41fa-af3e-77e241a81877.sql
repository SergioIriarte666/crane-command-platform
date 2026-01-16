-- Create invitations table for user invitations to tenants
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role public.app_role DEFAULT 'operator',
  invited_by UUID NOT NULL,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Policies for invitations table
CREATE POLICY "Admins can view invitations for their tenant"
ON public.invitations FOR SELECT TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid()) 
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
);

CREATE POLICY "Admins can create invitations for their tenant"
ON public.invitations FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid()) 
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
);

CREATE POLICY "Admins can delete invitations for their tenant"
ON public.invitations FOR DELETE TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid()) 
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
);

CREATE POLICY "Super admins can view all invitations"
ON public.invitations FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Public can verify invitation token (for registration flow)
CREATE POLICY "Anyone can verify invitation by token"
ON public.invitations FOR SELECT TO anon
USING (token IS NOT NULL AND expires_at > now() AND accepted_at IS NULL);

-- Add UPDATE policy for tenants so admins can update their own tenant
CREATE POLICY "Admins can update own tenant"
ON public.tenants FOR UPDATE TO authenticated
USING (
  id = public.get_user_tenant_id(auth.uid()) 
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
)
WITH CHECK (
  id = public.get_user_tenant_id(auth.uid()) 
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
);

-- Super admins can update any tenant
CREATE POLICY "Super admins can update any tenant"
ON public.tenants FOR UPDATE TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Super admins can insert tenants
CREATE POLICY "Super admins can insert tenants"
ON public.tenants FOR INSERT TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

-- Super admins can delete tenants
CREATE POLICY "Super admins can delete tenants"
ON public.tenants FOR DELETE TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Create function to process invitation on user registration
CREATE OR REPLACE FUNCTION public.process_invitation_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invitation RECORD;
BEGIN
  -- Check if there's a pending invitation for this email
  SELECT * INTO _invitation
  FROM public.invitations
  WHERE email = NEW.email
    AND accepted_at IS NULL
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF _invitation.id IS NOT NULL THEN
    -- Update profile with tenant_id
    UPDATE public.profiles
    SET tenant_id = _invitation.tenant_id
    WHERE id = NEW.id;

    -- Create user role
    INSERT INTO public.user_roles (user_id, role, tenant_id)
    VALUES (NEW.id, _invitation.role, _invitation.tenant_id);

    -- Mark invitation as accepted
    UPDATE public.invitations
    SET accepted_at = now()
    WHERE id = _invitation.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to process invitations after profile is created
CREATE TRIGGER on_profile_created_check_invitation
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.process_invitation_on_signup();

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to create tenant and assign user as admin (for onboarding)
CREATE OR REPLACE FUNCTION public.create_tenant_for_user(
  _user_id UUID,
  _tenant_name TEXT,
  _tenant_slug TEXT,
  _tax_id TEXT DEFAULT NULL,
  _email TEXT DEFAULT NULL,
  _phone TEXT DEFAULT NULL,
  _address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id UUID;
BEGIN
  -- Create the tenant
  INSERT INTO public.tenants (name, slug, tax_id, email, phone, address)
  VALUES (_tenant_name, _tenant_slug, _tax_id, _email, _phone, _address)
  RETURNING id INTO _tenant_id;

  -- Update user's profile with tenant_id
  UPDATE public.profiles
  SET tenant_id = _tenant_id
  WHERE id = _user_id;

  -- Assign admin role to user
  INSERT INTO public.user_roles (user_id, role, tenant_id)
  VALUES (_user_id, 'admin', _tenant_id);

  RETURN _tenant_id;
END;
$$;
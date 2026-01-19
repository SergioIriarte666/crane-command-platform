-- Fix RLS for company logo uploads stored under avatars/logos/
-- Recreate policies (safe: only replaces these specific policies)

DROP POLICY IF EXISTS company_logos_insert ON storage.objects;
CREATE POLICY company_logos_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'logos'
  AND (
    public.is_super_admin(auth.uid())
    OR (
      (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dispatcher'))
      AND public.get_user_tenant_id(auth.uid()) IS NOT NULL
      AND split_part(storage.filename(name), '-', 1) = public.get_user_tenant_id(auth.uid())::text
    )
  )
);

DROP POLICY IF EXISTS company_logos_update ON storage.objects;
CREATE POLICY company_logos_update
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'logos'
  AND (
    public.is_super_admin(auth.uid())
    OR (
      (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dispatcher'))
      AND public.get_user_tenant_id(auth.uid()) IS NOT NULL
      AND split_part(storage.filename(name), '-', 1) = public.get_user_tenant_id(auth.uid())::text
    )
  )
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'logos'
  AND (
    public.is_super_admin(auth.uid())
    OR (
      (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dispatcher'))
      AND public.get_user_tenant_id(auth.uid()) IS NOT NULL
      AND split_part(storage.filename(name), '-', 1) = public.get_user_tenant_id(auth.uid())::text
    )
  )
);

DROP POLICY IF EXISTS company_logos_delete ON storage.objects;
CREATE POLICY company_logos_delete
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'logos'
  AND (
    public.is_super_admin(auth.uid())
    OR (
      (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'dispatcher'))
      AND public.get_user_tenant_id(auth.uid()) IS NOT NULL
      AND split_part(storage.filename(name), '-', 1) = public.get_user_tenant_id(auth.uid())::text
    )
  )
);
-- Cambiar rol de admin a super_admin para el usuario actual
UPDATE public.user_roles 
SET role = 'super_admin' 
WHERE user_id = '2ff335e9-b2ea-4a53-ad54-cfe4991f2f7a';
-- Drop existing policies for clients table
DROP POLICY IF EXISTS "Admins can create clients" ON clients;
DROP POLICY IF EXISTS "Admins can update clients" ON clients;
DROP POLICY IF EXISTS "Admins can delete clients" ON clients;

-- Recreate INSERT policy including super_admin
CREATE POLICY "Admins can create clients" ON clients
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'dispatcher'::app_role)
  )
);

-- Recreate UPDATE policy including super_admin
CREATE POLICY "Admins can update clients" ON clients
FOR UPDATE TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'dispatcher'::app_role)
  )
)
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'dispatcher'::app_role)
  )
);

-- Recreate DELETE policy including super_admin
CREATE POLICY "Admins can delete clients" ON clients
FOR DELETE TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'dispatcher'::app_role)
  )
);
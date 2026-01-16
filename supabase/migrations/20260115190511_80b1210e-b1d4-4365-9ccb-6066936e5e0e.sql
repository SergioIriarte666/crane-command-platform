-- Drop old policy without WITH CHECK
DROP POLICY IF EXISTS "Admins can manage closure services" ON billing_closure_services;

-- Create new policy with super_admin bypass and WITH CHECK
CREATE POLICY "Admins can manage closure services" 
ON billing_closure_services
FOR ALL
USING (
  is_super_admin(auth.uid())
  OR (
    (EXISTS (
      SELECT 1 FROM billing_closures
      WHERE billing_closures.id = billing_closure_services.closure_id 
      AND billing_closures.tenant_id = get_user_tenant_id(auth.uid())
    )) 
    AND (
      has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'dispatcher'::app_role)
    )
  )
)
WITH CHECK (
  is_super_admin(auth.uid())
  OR (
    (EXISTS (
      SELECT 1 FROM billing_closures
      WHERE billing_closures.id = billing_closure_services.closure_id 
      AND billing_closures.tenant_id = get_user_tenant_id(auth.uid())
    )) 
    AND (
      has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'dispatcher'::app_role)
    )
  )
);
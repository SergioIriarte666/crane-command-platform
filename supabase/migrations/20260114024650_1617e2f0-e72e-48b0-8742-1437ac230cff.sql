-- =====================================================
-- FIX RLS POLICIES TO INCLUDE SUPER_ADMIN FOR ALL TABLES
-- =====================================================

-- ================== CRANES ==================
DROP POLICY IF EXISTS "Admins can create cranes" ON cranes;
DROP POLICY IF EXISTS "Admins can update cranes" ON cranes;
DROP POLICY IF EXISTS "Admins can delete cranes" ON cranes;

CREATE POLICY "Admins can create cranes" ON cranes
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'dispatcher'::app_role)
  )
);

CREATE POLICY "Admins can update cranes" ON cranes
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

CREATE POLICY "Admins can delete cranes" ON cranes
FOR DELETE TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- ================== OPERATORS ==================
DROP POLICY IF EXISTS "Admins can create operators" ON operators;
DROP POLICY IF EXISTS "Admins can update operators" ON operators;
DROP POLICY IF EXISTS "Admins can delete operators" ON operators;

CREATE POLICY "Admins can create operators" ON operators
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'dispatcher'::app_role)
  )
);

CREATE POLICY "Admins can update operators" ON operators
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

CREATE POLICY "Admins can delete operators" ON operators
FOR DELETE TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- ================== SERVICES ==================
DROP POLICY IF EXISTS "Admins can create services" ON services;
DROP POLICY IF EXISTS "Admins can update services" ON services;
DROP POLICY IF EXISTS "Admins can delete services" ON services;

CREATE POLICY "Admins can create services" ON services
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'dispatcher'::app_role)
  )
);

CREATE POLICY "Admins can update services" ON services
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

CREATE POLICY "Admins can delete services" ON services
FOR DELETE TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- ================== SUPPLIERS ==================
DROP POLICY IF EXISTS "Admins can create suppliers" ON suppliers;
DROP POLICY IF EXISTS "Admins can update suppliers" ON suppliers;
DROP POLICY IF EXISTS "Admins can delete suppliers" ON suppliers;

CREATE POLICY "Admins can create suppliers" ON suppliers
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'dispatcher'::app_role)
  )
);

CREATE POLICY "Admins can update suppliers" ON suppliers
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

CREATE POLICY "Admins can delete suppliers" ON suppliers
FOR DELETE TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- ================== INVENTORY_ITEMS ==================
DROP POLICY IF EXISTS "Admins can create inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Admins can update inventory items" ON inventory_items;
DROP POLICY IF EXISTS "Admins can delete inventory items" ON inventory_items;

CREATE POLICY "Admins can create inventory items" ON inventory_items
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'dispatcher'::app_role)
  )
);

CREATE POLICY "Admins can update inventory items" ON inventory_items
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

CREATE POLICY "Admins can delete inventory items" ON inventory_items
FOR DELETE TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- ================== INVENTORY_MOVEMENTS ==================
DROP POLICY IF EXISTS "Admins can create inventory movements" ON inventory_movements;

CREATE POLICY "Admins can create inventory movements" ON inventory_movements
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'dispatcher'::app_role)
  )
);

-- ================== INVOICES ==================
DROP POLICY IF EXISTS "Admins can create invoices" ON invoices;
DROP POLICY IF EXISTS "Admins can update invoices" ON invoices;
DROP POLICY IF EXISTS "Admins can delete invoices" ON invoices;

CREATE POLICY "Admins can create invoices" ON invoices
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'dispatcher'::app_role)
  )
);

CREATE POLICY "Admins can update invoices" ON invoices
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

CREATE POLICY "Admins can delete invoices" ON invoices
FOR DELETE TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- ================== PAYMENTS ==================
DROP POLICY IF EXISTS "Admins can create payments" ON payments;
DROP POLICY IF EXISTS "Admins can update payments" ON payments;
DROP POLICY IF EXISTS "Admins can delete payments" ON payments;

CREATE POLICY "Admins can create payments" ON payments
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'dispatcher'::app_role)
  )
);

CREATE POLICY "Admins can update payments" ON payments
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

CREATE POLICY "Admins can delete payments" ON payments
FOR DELETE TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- ================== BILLING_CLOSURES ==================
DROP POLICY IF EXISTS "Admins can create billing closures" ON billing_closures;
DROP POLICY IF EXISTS "Admins can update billing closures" ON billing_closures;
DROP POLICY IF EXISTS "Admins can delete billing closures" ON billing_closures;

CREATE POLICY "Admins can create billing closures" ON billing_closures
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'dispatcher'::app_role)
  )
);

CREATE POLICY "Admins can update billing closures" ON billing_closures
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

CREATE POLICY "Admins can delete billing closures" ON billing_closures
FOR DELETE TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- ================== COMMISSIONS ==================
DROP POLICY IF EXISTS "Admins can create commissions" ON commissions;
DROP POLICY IF EXISTS "Admins can update commissions" ON commissions;
DROP POLICY IF EXISTS "Admins can delete commissions" ON commissions;

CREATE POLICY "Admins can create commissions" ON commissions
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Admins can update commissions" ON commissions
FOR UPDATE TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
)
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Admins can delete commissions" ON commissions
FOR DELETE TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- ================== CATALOG_ITEMS ==================
DROP POLICY IF EXISTS "Admins can create catalog items" ON catalog_items;
DROP POLICY IF EXISTS "Admins can update catalog items" ON catalog_items;
DROP POLICY IF EXISTS "Admins can delete catalog items" ON catalog_items;

CREATE POLICY "Admins can create catalog items" ON catalog_items
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Admins can update catalog items" ON catalog_items
FOR UPDATE TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
)
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Admins can delete catalog items" ON catalog_items
FOR DELETE TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- ================== BANK_TRANSACTIONS ==================
DROP POLICY IF EXISTS "Admins can create bank transactions" ON bank_transactions;
DROP POLICY IF EXISTS "Admins can update bank transactions" ON bank_transactions;
DROP POLICY IF EXISTS "Admins can delete bank transactions" ON bank_transactions;

CREATE POLICY "Admins can create bank transactions" ON bank_transactions
FOR INSERT TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Admins can update bank transactions" ON bank_transactions
FOR UPDATE TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
)
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Admins can delete bank transactions" ON bank_transactions
FOR DELETE TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid()) 
  AND (
    is_super_admin(auth.uid()) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);
-- Tabla backup_logs para historial de respaldos
CREATE TABLE IF NOT EXISTS public.backup_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    tenant_id UUID REFERENCES public.tenants(id),
    backup_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
    file_size_bytes BIGINT,
    error_message TEXT,
    metadata JSONB
);

-- Índices
CREATE INDEX idx_backup_logs_created_at ON public.backup_logs(created_at DESC);
CREATE INDEX idx_backup_logs_status ON public.backup_logs(status);
CREATE INDEX idx_backup_logs_created_by ON public.backup_logs(created_by);
CREATE INDEX idx_backup_logs_tenant_id ON public.backup_logs(tenant_id);

-- Row Level Security
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

-- Solo admins del tenant pueden ver logs de respaldo
CREATE POLICY "Admins can view backup logs for their tenant" ON public.backup_logs
    FOR SELECT
    USING (
        tenant_id = public.get_user_tenant_id(auth.uid())
        AND (
            public.has_role(auth.uid(), 'admin') 
            OR public.is_super_admin(auth.uid())
        )
    );

CREATE POLICY "Admins can insert backup logs for their tenant" ON public.backup_logs
    FOR INSERT
    WITH CHECK (
        tenant_id = public.get_user_tenant_id(auth.uid())
        AND (
            public.has_role(auth.uid(), 'admin') 
            OR public.is_super_admin(auth.uid())
        )
    );

CREATE POLICY "Admins can update backup logs for their tenant" ON public.backup_logs
    FOR UPDATE
    USING (
        tenant_id = public.get_user_tenant_id(auth.uid())
        AND (
            public.has_role(auth.uid(), 'admin') 
            OR public.is_super_admin(auth.uid())
        )
    );

-- Función RPC para generar respaldo rápido
CREATE OR REPLACE FUNCTION public.generate_quick_backup()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
    _tenant_id UUID;
BEGIN
    -- Obtener tenant del usuario actual
    _tenant_id := public.get_user_tenant_id(auth.uid());
    
    IF _tenant_id IS NULL THEN
        RAISE EXCEPTION 'Usuario sin tenant asociado';
    END IF;
    
    SELECT jsonb_build_object(
        'metadata', jsonb_build_object(
            'generated_at', NOW(),
            'type', 'quick',
            'version', '1.0',
            'tenant_id', _tenant_id
        ),
        'tenant_data', (SELECT row_to_json(t) FROM tenants t WHERE t.id = _tenant_id LIMIT 1),
        'table_counts', jsonb_build_object(
            'clients', (SELECT COUNT(*) FROM clients WHERE tenant_id = _tenant_id),
            'services', (SELECT COUNT(*) FROM services WHERE tenant_id = _tenant_id),
            'operators', (SELECT COUNT(*) FROM operators WHERE tenant_id = _tenant_id),
            'cranes', (SELECT COUNT(*) FROM cranes WHERE tenant_id = _tenant_id),
            'costs', (SELECT COUNT(*) FROM costs WHERE tenant_id = _tenant_id),
            'invoices', (SELECT COUNT(*) FROM invoices WHERE tenant_id = _tenant_id),
            'commissions', (SELECT COUNT(*) FROM commissions WHERE tenant_id = _tenant_id)
        ),
        'folio_counters', jsonb_build_object(
            'next_folio_number', (SELECT next_folio_number FROM tenants WHERE id = _tenant_id LIMIT 1),
            'folio_format', (SELECT folio_format FROM tenants WHERE id = _tenant_id LIMIT 1)
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Función RPC para generar dump SQL (solo datos del tenant)
CREATE OR REPLACE FUNCTION public.generate_database_backup()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    backup_sql TEXT := '';
    _tenant_id UUID;
    table_name TEXT;
    table_data RECORD;
    column_names TEXT;
    column_values TEXT;
    tables_in_order TEXT[] := ARRAY[
        'clients',
        'operators',
        'cranes',
        'suppliers',
        'cost_categories',
        'cost_subcategories',
        'cost_centers',
        'inventory_items',
        'services',
        'costs',
        'billing_closures',
        'billing_closure_services',
        'invoices',
        'invoice_items',
        'payments',
        'commissions',
        'commission_services',
        'catalog_items'
    ];
BEGIN
    -- Obtener tenant del usuario actual
    _tenant_id := public.get_user_tenant_id(auth.uid());
    
    IF _tenant_id IS NULL THEN
        RAISE EXCEPTION 'Usuario sin tenant asociado';
    END IF;
    
    -- Header
    backup_sql := '-- NTMS Database Backup' || E'\n';
    backup_sql := backup_sql || '-- Tenant: ' || _tenant_id::TEXT || E'\n';
    backup_sql := backup_sql || '-- Generated: ' || NOW()::TEXT || E'\n';
    backup_sql := backup_sql || '-- Format: SQL INSERT statements' || E'\n';
    backup_sql := backup_sql || E'\n';
    backup_sql := backup_sql || 'BEGIN;' || E'\n\n';

    -- Iterate tables in dependency order
    FOREACH table_name IN ARRAY tables_in_order
    LOOP
        backup_sql := backup_sql || '-- Table: ' || table_name || E'\n';
        
        FOR table_data IN EXECUTE format(
            'SELECT row_to_json(t) as row_data FROM %I t WHERE tenant_id = $1', 
            table_name
        ) USING _tenant_id
        LOOP
            -- Build INSERT statement from JSON
            SELECT 
                string_agg(key, ', '),
                string_agg(
                    CASE 
                        WHEN value IS NULL THEN 'NULL'
                        WHEN jsonb_typeof(value) = 'string' THEN quote_literal(value#>>'{}')
                        ELSE value::TEXT
                    END, 
                    ', '
                )
            INTO column_names, column_values
            FROM jsonb_each(table_data.row_data::jsonb);
            
            IF column_names IS NOT NULL THEN
                backup_sql := backup_sql || format(
                    'INSERT INTO %I (%s) VALUES (%s);',
                    table_name,
                    column_names,
                    column_values
                ) || E'\n';
            END IF;
        END LOOP;
        
        backup_sql := backup_sql || E'\n';
    END LOOP;

    backup_sql := backup_sql || 'COMMIT;' || E'\n';
    backup_sql := backup_sql || '-- End of backup' || E'\n';

    RETURN backup_sql;
END;
$$;
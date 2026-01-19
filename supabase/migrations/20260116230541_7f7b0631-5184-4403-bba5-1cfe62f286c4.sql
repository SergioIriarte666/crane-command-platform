-- Función RPC corregida para generar dump SQL (solo datos del tenant)
CREATE OR REPLACE FUNCTION public.generate_database_backup()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    backup_sql TEXT := '';
    _tenant_id UUID;
    tbl TEXT;
    table_data RECORD;
    column_names TEXT;
    column_values TEXT;
    has_tenant_id BOOLEAN;
    -- Tablas principales con tenant_id
    tenant_tables TEXT[] := ARRAY[
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
        'invoices',
        'payments',
        'commissions',
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

    -- Iterate tables with tenant_id
    FOREACH tbl IN ARRAY tenant_tables
    LOOP
        backup_sql := backup_sql || '-- Table: ' || tbl || E'\n';
        
        BEGIN
            FOR table_data IN EXECUTE format(
                'SELECT row_to_json(t) as row_data FROM %I t WHERE tenant_id = $1', 
                tbl
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
                        tbl,
                        column_names,
                        column_values
                    ) || E'\n';
                END IF;
            END LOOP;
        EXCEPTION WHEN OTHERS THEN
            backup_sql := backup_sql || '-- Error backing up ' || tbl || ': ' || SQLERRM || E'\n';
        END;
        
        backup_sql := backup_sql || E'\n';
    END LOOP;

    -- Backup related tables (billing_closure_services via closure_id)
    backup_sql := backup_sql || '-- Table: billing_closure_services' || E'\n';
    BEGIN
        FOR table_data IN 
            SELECT row_to_json(bcs) as row_data 
            FROM billing_closure_services bcs
            JOIN billing_closures bc ON bcs.closure_id = bc.id
            WHERE bc.tenant_id = _tenant_id
        LOOP
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
                    'INSERT INTO billing_closure_services (%s) VALUES (%s);',
                    column_names,
                    column_values
                ) || E'\n';
            END IF;
        END LOOP;
    EXCEPTION WHEN OTHERS THEN
        backup_sql := backup_sql || '-- Error backing up billing_closure_services: ' || SQLERRM || E'\n';
    END;
    backup_sql := backup_sql || E'\n';

    -- Backup invoice_items via invoice_id
    backup_sql := backup_sql || '-- Table: invoice_items' || E'\n';
    BEGIN
        FOR table_data IN 
            SELECT row_to_json(ii) as row_data 
            FROM invoice_items ii
            JOIN invoices i ON ii.invoice_id = i.id
            WHERE i.tenant_id = _tenant_id
        LOOP
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
                    'INSERT INTO invoice_items (%s) VALUES (%s);',
                    column_names,
                    column_values
                ) || E'\n';
            END IF;
        END LOOP;
    EXCEPTION WHEN OTHERS THEN
        backup_sql := backup_sql || '-- Error backing up invoice_items: ' || SQLERRM || E'\n';
    END;
    backup_sql := backup_sql || E'\n';

    -- Backup commission_services via commission_id
    backup_sql := backup_sql || '-- Table: commission_services' || E'\n';
    BEGIN
        FOR table_data IN 
            SELECT row_to_json(cs) as row_data 
            FROM commission_services cs
            JOIN commissions c ON cs.commission_id = c.id
            WHERE c.tenant_id = _tenant_id
        LOOP
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
                    'INSERT INTO commission_services (%s) VALUES (%s);',
                    column_names,
                    column_values
                ) || E'\n';
            END IF;
        END LOOP;
    EXCEPTION WHEN OTHERS THEN
        backup_sql := backup_sql || '-- Error backing up commission_services: ' || SQLERRM || E'\n';
    END;
    backup_sql := backup_sql || E'\n';

    backup_sql := backup_sql || 'COMMIT;' || E'\n';
    backup_sql := backup_sql || '-- End of backup' || E'\n';

    RETURN backup_sql;
END;
$$;
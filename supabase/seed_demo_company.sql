
-- ==============================================================================
-- SEED DATA: GRÚAS METRÓPOLIS S.A. (DEMO CHILE)
-- ==============================================================================
-- Este script puebla la base de datos con una empresa ficticia chilena y datos de prueba.
-- Asume que las migraciones de estructura y catálogos base (20260123...) ya se ejecutaron.

DO $$
DECLARE
    v_tenant_id UUID;
    v_user_admin_id UUID;
    v_user_dispatcher_id UUID;
    v_user_op_1_id UUID;
    v_user_op_2_id UUID;
    v_client_insurance UUID;
    v_client_workshop UUID;
    v_client_private UUID;
    v_crane_1 UUID;
    v_crane_2 UUID;
    v_crane_3 UUID;
    v_op_1 UUID;
    v_op_2 UUID;
    v_op_3 UUID;
    v_closure_id UUID;
    v_invoice_id UUID;
    v_cat_fuel UUID;
    v_cat_maint UUID;
BEGIN
    -- 1. CREAR O BUSCAR TENANT (EMPRESA)
    SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = 'gruas-metropolis';
    
    IF v_tenant_id IS NULL THEN
        INSERT INTO public.tenants (name, slug, tax_id, address, phone, email, website, plan, is_active)
        VALUES (
            'Grúas Metrópolis S.A.', 
            'gruas-metropolis', 
            '76.123.456-7', 
            'Av. Providencia 1234, Oficina 501, Santiago, Chile', 
            '+56 2 2345 6789', 
            'contacto@gruasmetropolis.cl', 
            'https://www.gruasmetropolis.cl',
            'enterprise', 
            true
        ) RETURNING id INTO v_tenant_id;
    END IF;

    -- ==============================================================================
    -- NOTA: Los catálogos base (bancos, tipos de licencia, vehículos, costos, etc.)
    -- se cargan mediante las migraciones:
    -- 20260123000002_add_demo_cost_categories.sql
    -- 20260123000003_fill_demo_catalogs.sql
    -- 20260123000004_complete_demo_catalogs.sql
    -- 20260123000005_complete_demo_subcategories.sql
    -- 20260123000006_update_closure_status_enum.sql
    -- ==============================================================================

    -- 2. CREAR O BUSCAR CLIENTES (CHILE)
    
    -- Cliente 1: Aseguradora
    SELECT id INTO v_client_insurance FROM public.clients WHERE tenant_id = v_tenant_id AND email = 'siniestros@magallanes.cl';
    IF v_client_insurance IS NULL THEN
        INSERT INTO public.clients (tenant_id, name, type, phone, email, address, payment_terms, credit_limit, tax_id)
        VALUES (v_tenant_id, 'Seguros Magallanes', 'aseguradora', '+56 2 2999 8888', 'siniestros@magallanes.cl', 'Av. Apoquindo 3000, Las Condes, Santiago', 30, 50000000, '90.123.456-8')
        RETURNING id INTO v_client_insurance;
    END IF;

    -- Cliente 2: Taller
    SELECT id INTO v_client_workshop FROM public.clients WHERE tenant_id = v_tenant_id AND email = 'contacto@sanignacio.cl';
    IF v_client_workshop IS NULL THEN
        INSERT INTO public.clients (tenant_id, name, type, phone, email, address, payment_terms, credit_limit, tax_id)
        VALUES (v_tenant_id, 'Taller San Ignacio', 'empresa', '+56 9 4444 3333', 'contacto@sanignacio.cl', 'Calle San Ignacio 500, Santiago Centro', 7, 2000000, '77.888.999-K')
        RETURNING id INTO v_client_workshop;
    END IF;

    -- Cliente 3: Particular
    SELECT id INTO v_client_private FROM public.clients WHERE tenant_id = v_tenant_id AND email = 'pedro.pascal@email.cl';
    IF v_client_private IS NULL THEN
        INSERT INTO public.clients (tenant_id, name, type, phone, email, address, tax_id)
        VALUES (v_tenant_id, 'Pedro Pascal (Particular)', 'particular', '+56 9 1111 2222', 'pedro.pascal@email.cl', 'Av. Vitacura 2000, Vitacura', '15.555.666-7')
        RETURNING id INTO v_client_private;
    END IF;

    -- 3. CREAR O BUSCAR FLOTA (GRÚAS)
    -- Usando marcas/modelos definidos en los catálogos (Toyota, Chevrolet, Volkswagen)
    
    -- Grúa 1: Toyota Hilux (Plataforma)
    SELECT id INTO v_crane_1 FROM public.cranes WHERE tenant_id = v_tenant_id AND unit_number = 'GRU-01';
    IF v_crane_1 IS NULL THEN
        INSERT INTO public.cranes (tenant_id, unit_number, type, brand, model, year, plates, status, fuel_type)
        VALUES (v_tenant_id, 'GRU-01', 'plataforma', 'Toyota', 'Hilux', 2023, 'LF-12-34', 'available', 'diesel')
        RETURNING id INTO v_crane_1;
    END IF;

    -- Grúa 2: Chevrolet NPR (Plataforma)
    SELECT id INTO v_crane_2 FROM public.cranes WHERE tenant_id = v_tenant_id AND unit_number = 'GRU-02';
    IF v_crane_2 IS NULL THEN
        INSERT INTO public.cranes (tenant_id, unit_number, type, brand, model, year, plates, status, fuel_type)
        VALUES (v_tenant_id, 'GRU-02', 'plataforma', 'Chevrolet', 'NPR', 2022, 'AB-CD-56', 'in_service', 'diesel')
        RETURNING id INTO v_crane_2;
    END IF;

    -- Grúa 3: Volkswagen Delivery (Arrastre/Tow)
    SELECT id INTO v_crane_3 FROM public.cranes WHERE tenant_id = v_tenant_id AND unit_number = 'GRU-03';
    IF v_crane_3 IS NULL THEN
        INSERT INTO public.cranes (tenant_id, unit_number, type, brand, model, year, plates, status, fuel_type)
        VALUES (v_tenant_id, 'GRU-03', 'arrastre', 'Volkswagen', 'Delivery', 2020, 'XY-99-88', 'maintenance', 'diesel')
        RETURNING id INTO v_crane_3;
    END IF;

    -- 4. CREAR O BUSCAR OPERADORES
    
    -- Operador 1
    SELECT id INTO v_op_1 FROM public.operators WHERE tenant_id = v_tenant_id AND employee_number = 'EMP-001';
    IF v_op_1 IS NULL THEN
        INSERT INTO public.operators (tenant_id, full_name, employee_number, phone, license_type, status, assigned_crane_id)
        VALUES (v_tenant_id, 'Carlos Ruiz', 'EMP-001', '+56 9 1111 0001', 'A4', 'active', v_crane_1)
        RETURNING id INTO v_op_1;
    END IF;

    -- Operador 2
    SELECT id INTO v_op_2 FROM public.operators WHERE tenant_id = v_tenant_id AND employee_number = 'EMP-002';
    IF v_op_2 IS NULL THEN
        INSERT INTO public.operators (tenant_id, full_name, employee_number, phone, license_type, status, assigned_crane_id)
        VALUES (v_tenant_id, 'Miguel Ángel Torres', 'EMP-002', '+56 9 1111 0002', 'A4', 'active', v_crane_2)
        RETURNING id INTO v_op_2;
    END IF;

    -- Operador 3
    SELECT id INTO v_op_3 FROM public.operators WHERE tenant_id = v_tenant_id AND employee_number = 'EMP-003';
    IF v_op_3 IS NULL THEN
        INSERT INTO public.operators (tenant_id, full_name, employee_number, phone, license_type, status, assigned_crane_id)
        VALUES (v_tenant_id, 'Roberto Díaz', 'EMP-003', '+56 9 1111 0003', 'A4', 'vacation', NULL)
        RETURNING id INTO v_op_3;
    END IF;

    -- Asignaciones (Updates idempotent)
    UPDATE public.cranes SET assigned_operator_id = v_op_1 WHERE id = v_crane_1;
    UPDATE public.cranes SET assigned_operator_id = v_op_2 WHERE id = v_crane_2;

    -- 5. CREAR CIERRE DE FACTURACIÓN (Mes Pasado)
    SELECT id INTO v_closure_id FROM public.billing_closures WHERE tenant_id = v_tenant_id AND folio = 'CIE-2024-01';
    
    IF v_closure_id IS NULL THEN
        INSERT INTO public.billing_closures (
            tenant_id, folio, client_id, period_start, period_end, status, 
            services_count, subtotal, total, created_at
        ) VALUES (
            v_tenant_id, 'CIE-2024-01', v_client_insurance, 
            (CURRENT_DATE - INTERVAL '1 month')::date, CURRENT_DATE, 'invoiced',
            5, 1250000.00, 1487500.00, NOW() - INTERVAL '5 days'
        ) RETURNING id INTO v_closure_id;
    END IF;

    -- 6. CREAR FACTURA
    SELECT id INTO v_invoice_id FROM public.invoices WHERE tenant_id = v_tenant_id AND folio = 'FAC-1001';
    
    IF v_invoice_id IS NULL THEN
        INSERT INTO public.invoices (
            tenant_id, folio, client_id, billing_closure_id,
            issue_date, due_date, status,
            subtotal, tax_amount, total, balance_due
        ) VALUES (
            v_tenant_id, 'FAC-1001', v_client_insurance, v_closure_id,
            CURRENT_DATE - 5, CURRENT_DATE + 25, 'sent',
            1250000.00, 237500.00, 1487500.00, 1487500.00
        ) RETURNING id INTO v_invoice_id;
    END IF;

    -- Actualizar cierre con factura (si no tiene)
    UPDATE public.billing_closures SET invoice_id = v_invoice_id WHERE id = v_closure_id AND invoice_id IS NULL;

    -- 7. GENERAR HISTORIAL DE SERVICIOS
    
    -- Servicios FACTURADOS (Asociados al Cierre)
    FOR i IN 1..5 LOOP
        IF NOT EXISTS (SELECT 1 FROM public.services WHERE tenant_id = v_tenant_id AND folio = 'SRV-24-0' || (10 + i)) THEN
            INSERT INTO public.services (
                tenant_id, folio, status, type, client_id, crane_id, operator_id, 
                total, created_at, scheduled_date, completion_time,
                billing_closure_id, invoice_id
            ) VALUES (
                v_tenant_id, 'SRV-24-0' || (10 + i), 'invoiced', 'local', v_client_insurance, v_crane_1, v_op_1, 
                250000.00, NOW() - INTERVAL '15 days', CURRENT_DATE - 15, NOW() - INTERVAL '14 days',
                v_closure_id, v_invoice_id
            );
        END IF;
    END LOOP;

    -- Servicios RECIENTES
    -- Servicio 1: Completado (Av. Reforma -> Alameda)
    IF NOT EXISTS (SELECT 1 FROM public.services WHERE tenant_id = v_tenant_id AND folio = 'SRV-24-100') THEN
        INSERT INTO public.services (
            tenant_id, folio, status, type, priority, client_id, 
            origin_address, destination_address, distance_km, crane_id, operator_id,
            base_rate, km_rate, total, created_at, scheduled_date
        ) VALUES (
            v_tenant_id, 'SRV-24-100', 'completed', 'local', 'normal', v_client_insurance, 
            'Alameda 222, Santiago', 'Agencia Toyota, Vitacura', 15.5, v_crane_1, v_op_1,
            150000.00, 2500.00, 188750.00, NOW() - INTERVAL '2 hours', CURRENT_DATE
        );
    END IF;

    -- Servicio 2: En Progreso (Periférico -> Vespucio)
    IF NOT EXISTS (SELECT 1 FROM public.services WHERE tenant_id = v_tenant_id AND folio = 'SRV-24-101') THEN
        INSERT INTO public.services (
            tenant_id, folio, status, type, priority, client_id, 
            origin_address, destination_address, distance_km, crane_id, operator_id,
            base_rate, total, created_at, scheduled_date
        ) VALUES (
            v_tenant_id, 'SRV-24-101', 'in_progress', 'local', 'urgent', v_client_workshop,
            'Américo Vespucio Sur 4000', 'Taller San Ignacio', 10.0, v_crane_2, v_op_2,
            120000.00, 120000.00, NOW() - INTERVAL '1 hour', CURRENT_DATE
        );
    END IF;

    -- Servicio 3: Cancelado
    IF NOT EXISTS (SELECT 1 FROM public.services WHERE tenant_id = v_tenant_id AND folio = 'SRV-24-102') THEN
        INSERT INTO public.services (
            tenant_id, folio, status, type, client_id, 
            origin_address, base_rate, total, created_at, scheduled_date
        ) VALUES (
            v_tenant_id, 'SRV-24-102', 'cancelled', 'auxilio', v_client_private,
            'Calle 10, Ñuñoa', 80000.00, 80000.00, NOW() - INTERVAL '1 day', CURRENT_DATE - 1
        );
    END IF;

    RAISE NOTICE 'Datos de Grúas Metrópolis S.A. (Chile) verificados/generados.';

    -- ==============================================================================
    -- USUARIOS DE PRUEBA
    -- ==============================================================================
    
    -- Asegurar extensión pgcrypto
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- (El resto de la lógica de usuarios se mantiene, pero es bueno revisarla para asegurar
    -- que se asignen al tenant correcto si es que crea usuarios nuevos)
    -- NOTA: La creación de usuarios en auth.users requiere permisos especiales que
    -- normalmente no se tienen en migraciones SQL estándar de Supabase si no es superuser.
    -- Pero si este script corre como seed local, funciona.
END $$;

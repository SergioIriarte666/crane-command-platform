-- Migration to complete system catalogs and fix vehicle model auto-assignment

DO $$
DECLARE
    v_tenant_id UUID;
    v_brand_toyota UUID;
    v_brand_nissan UUID;
    v_brand_chevrolet UUID;
    v_brand_ford UUID;
    v_brand_vw UUID;
    v_type_sedan UUID;
    v_type_suv UUID;
    v_type_pickup UUID;
    v_type_van UUID;
    v_type_truck UUID;
BEGIN
    -- Find the demo tenant
    SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = 'gruas-metropolis';
    
    IF v_tenant_id IS NOT NULL THEN
        -- 1. Poblar service_status
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'service_status') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order, metadata) VALUES
            (v_tenant_id, 'service_status', 'draft', 'Borrador', 10, jsonb_build_object('color', '#6b7280', 'bgColor', 'bg-gray-100', 'textColor', 'text-gray-700', 'isFinal', false)),
            (v_tenant_id, 'service_status', 'quoted', 'Cotizado', 20, jsonb_build_object('color', '#60a5fa', 'bgColor', 'bg-blue-100', 'textColor', 'text-blue-700', 'isFinal', false)),
            (v_tenant_id, 'service_status', 'purchase_order_pending', 'Esperando O.C.', 22, jsonb_build_object('color', '#f59e0b', 'bgColor', 'bg-amber-100', 'textColor', 'text-amber-700', 'isFinal', false)),
            (v_tenant_id, 'service_status', 'with_purchase_order', 'Con Orden de Compra', 25, jsonb_build_object('color', '#10b981', 'bgColor', 'bg-emerald-100', 'textColor', 'text-emerald-700', 'isFinal', false)),
            (v_tenant_id, 'service_status', 'confirmed', 'Confirmado', 30, jsonb_build_object('color', '#3b82f6', 'bgColor', 'bg-blue-200', 'textColor', 'text-blue-800', 'isFinal', false)),
            (v_tenant_id, 'service_status', 'pending', 'Programado', 35, jsonb_build_object('color', '#8b5cf6', 'bgColor', 'bg-violet-100', 'textColor', 'text-violet-700', 'isFinal', false)),
            (v_tenant_id, 'service_status', 'assigned', 'Asignado', 40, jsonb_build_object('color', '#8b5cf6', 'bgColor', 'bg-purple-100', 'textColor', 'text-purple-700', 'isFinal', false)),
            (v_tenant_id, 'service_status', 'en_route', 'En Ruta', 50, jsonb_build_object('color', '#eab308', 'bgColor', 'bg-yellow-100', 'textColor', 'text-yellow-700', 'isFinal', false)),
            (v_tenant_id, 'service_status', 'on_site', 'En Sitio', 60, jsonb_build_object('color', '#f97316', 'bgColor', 'bg-orange-100', 'textColor', 'text-orange-700', 'isFinal', false)),
            (v_tenant_id, 'service_status', 'in_progress', 'En Progreso', 70, jsonb_build_object('color', '#06b6d4', 'bgColor', 'bg-cyan-100', 'textColor', 'text-cyan-700', 'isFinal', false)),
            (v_tenant_id, 'service_status', 'completed', 'Completado', 80, jsonb_build_object('color', '#22c55e', 'bgColor', 'bg-green-100', 'textColor', 'text-green-700', 'isFinal', true)),
            (v_tenant_id, 'service_status', 'failed', 'Fallido', 85, jsonb_build_object('color', '#ef4444', 'bgColor', 'bg-red-100', 'textColor', 'text-red-700', 'isFinal', true)),
            (v_tenant_id, 'service_status', 'invoiced', 'Facturado', 90, jsonb_build_object('color', '#15803d', 'bgColor', 'bg-green-200', 'textColor', 'text-green-800', 'isFinal', true)),
            (v_tenant_id, 'service_status', 'cancelled', 'Cancelado', 99, jsonb_build_object('color', '#ef4444', 'bgColor', 'bg-red-100', 'textColor', 'text-red-700', 'isFinal', true));
        END IF;

        -- 2. Poblar closure_status
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'closure_status') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order, metadata) VALUES
            (v_tenant_id, 'closure_status', 'draft', 'Borrador', 10, jsonb_build_object('color', '#6b7280', 'bgColor', 'bg-gray-100', 'textColor', 'text-gray-700', 'isFinal', false)),
            (v_tenant_id, 'closure_status', 'review', 'Por Aprobar (Legacy)', 20, jsonb_build_object('color', '#f59e0b', 'bgColor', 'bg-amber-100', 'textColor', 'text-amber-700', 'isFinal', false)),
            (v_tenant_id, 'closure_status', 'pending_review', 'Por Aprobar', 25, jsonb_build_object('color', '#f59e0b', 'bgColor', 'bg-amber-100', 'textColor', 'text-amber-700', 'isFinal', false)),
            (v_tenant_id, 'closure_status', 'client_review', 'Revisión Cliente', 30, jsonb_build_object('color', '#3b82f6', 'bgColor', 'bg-blue-100', 'textColor', 'text-blue-700', 'isFinal', false)),
            (v_tenant_id, 'closure_status', 'approved', 'Aprobado', 40, jsonb_build_object('color', '#22c55e', 'bgColor', 'bg-green-100', 'textColor', 'text-green-700', 'isFinal', false)),
            (v_tenant_id, 'closure_status', 'invoicing', 'Facturando', 50, jsonb_build_object('color', '#8b5cf6', 'bgColor', 'bg-purple-100', 'textColor', 'text-purple-700', 'isFinal', false)),
            (v_tenant_id, 'closure_status', 'invoiced', 'Facturado', 60, jsonb_build_object('color', '#15803d', 'bgColor', 'bg-green-200', 'textColor', 'text-green-800', 'isFinal', true)),
            (v_tenant_id, 'closure_status', 'cancelled', 'Cancelado', 99, jsonb_build_object('color', '#ef4444', 'bgColor', 'bg-red-100', 'textColor', 'text-red-700', 'isFinal', true));
        END IF;

        -- 3. Poblar invoice_status
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'invoice_status') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order, metadata) VALUES
            (v_tenant_id, 'invoice_status', 'draft', 'Borrador', 10, jsonb_build_object('color', '#6b7280', 'bgColor', 'bg-gray-100', 'textColor', 'text-gray-700', 'isFinal', false)),
            (v_tenant_id, 'invoice_status', 'pending', 'Pendiente', 20, jsonb_build_object('color', '#f59e0b', 'bgColor', 'bg-amber-100', 'textColor', 'text-amber-700', 'isFinal', false)),
            (v_tenant_id, 'invoice_status', 'sent', 'Emitida', 30, jsonb_build_object('color', '#3b82f6', 'bgColor', 'bg-blue-100', 'textColor', 'text-blue-700', 'isFinal', false)),
            (v_tenant_id, 'invoice_status', 'paid', 'Pagada', 40, jsonb_build_object('color', '#22c55e', 'bgColor', 'bg-green-100', 'textColor', 'text-green-700', 'isFinal', true)),
            (v_tenant_id, 'invoice_status', 'partial', 'Pago Parcial', 50, jsonb_build_object('color', '#8b5cf6', 'bgColor', 'bg-purple-100', 'textColor', 'text-purple-700', 'isFinal', false)),
            (v_tenant_id, 'invoice_status', 'overdue', 'Vencida', 60, jsonb_build_object('color', '#ef4444', 'bgColor', 'bg-red-100', 'textColor', 'text-red-700', 'isFinal', false)),
            (v_tenant_id, 'invoice_status', 'cancelled', 'Anulada', 99, jsonb_build_object('color', '#9ca3af', 'bgColor', 'bg-gray-200', 'textColor', 'text-gray-600', 'isFinal', true));
        END IF;

        -- 3.5. Poblar cost_center
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'cost_center') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order) VALUES
            (v_tenant_id, 'cost_center', 'OPS', 'Operaciones', 10),
            (v_tenant_id, 'cost_center', 'ADM', 'Administración', 20),
            (v_tenant_id, 'cost_center', 'SAL', 'Ventas', 30),
            (v_tenant_id, 'cost_center', 'MNT', 'Taller y Mantenimiento', 40);
        END IF;

        -- 3.6. Poblar payment_terms
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'payment_terms') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order, metadata) VALUES
            (v_tenant_id, 'payment_terms', 'CASH', 'Contado', 10, jsonb_build_object('days', 0)),
            (v_tenant_id, 'payment_terms', 'NET15', 'Crédito 15 Días', 20, jsonb_build_object('days', 15)),
            (v_tenant_id, 'payment_terms', 'NET30', 'Crédito 30 Días', 30, jsonb_build_object('days', 30)),
            (v_tenant_id, 'payment_terms', 'NET45', 'Crédito 45 Días', 40, jsonb_build_object('days', 45)),
            (v_tenant_id, 'payment_terms', 'NET60', 'Crédito 60 Días', 50, jsonb_build_object('days', 60));
        END IF;

        -- 3.7. Poblar vehicle_brand & vehicle_model (Nested)
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_brand') THEN
            -- Toyota
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order) VALUES (v_tenant_id, 'vehicle_brand', 'TOYOTA', 'Toyota', 10) RETURNING id INTO v_brand_toyota;
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, parent_id, sort_order) VALUES 
                (v_tenant_id, 'vehicle_model', 'COROLLA', 'Corolla', v_brand_toyota, 1),
                (v_tenant_id, 'vehicle_model', 'YARIS', 'Yaris', v_brand_toyota, 2),
                (v_tenant_id, 'vehicle_model', 'HILUX', 'Hilux', v_brand_toyota, 3),
                (v_tenant_id, 'vehicle_model', 'RAV4', 'RAV4', v_brand_toyota, 4);

            -- Nissan
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order) VALUES (v_tenant_id, 'vehicle_brand', 'NISSAN', 'Nissan', 20) RETURNING id INTO v_brand_nissan;
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, parent_id, sort_order) VALUES 
                (v_tenant_id, 'vehicle_model', 'VERSA', 'Versa', v_brand_nissan, 1),
                (v_tenant_id, 'vehicle_model', 'SENTRA', 'Sentra', v_brand_nissan, 2),
                (v_tenant_id, 'vehicle_model', 'NP300', 'NP300', v_brand_nissan, 3),
                (v_tenant_id, 'vehicle_model', 'MARCH', 'March', v_brand_nissan, 4);

            -- Chevrolet
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order) VALUES (v_tenant_id, 'vehicle_brand', 'CHEVROLET', 'Chevrolet', 30) RETURNING id INTO v_brand_chevrolet;
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, parent_id, sort_order) VALUES 
                (v_tenant_id, 'vehicle_model', 'AVEO', 'Aveo', v_brand_chevrolet, 1),
                (v_tenant_id, 'vehicle_model', 'ONIX', 'Onix', v_brand_chevrolet, 2),
                (v_tenant_id, 'vehicle_model', 'SILVERADO', 'Silverado', v_brand_chevrolet, 3);

            -- Ford
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order) VALUES (v_tenant_id, 'vehicle_brand', 'FORD', 'Ford', 40) RETURNING id INTO v_brand_ford;
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, parent_id, sort_order) VALUES 
                (v_tenant_id, 'vehicle_model', 'FIGO', 'Figo', v_brand_ford, 1),
                (v_tenant_id, 'vehicle_model', 'RANGER', 'Ranger', v_brand_ford, 2),
                (v_tenant_id, 'vehicle_model', 'F150', 'F-150', v_brand_ford, 3);

            -- VW
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order) VALUES (v_tenant_id, 'vehicle_brand', 'VW', 'Volkswagen', 50) RETURNING id INTO v_brand_vw;
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, parent_id, sort_order) VALUES 
                (v_tenant_id, 'vehicle_model', 'JETTA', 'Jetta', v_brand_vw, 1),
                (v_tenant_id, 'vehicle_model', 'VENTO', 'Vento', v_brand_vw, 2),
                (v_tenant_id, 'vehicle_model', 'TIGUAN', 'Tiguan', v_brand_vw, 3);
        END IF;

        -- 4. Actualizar metadatos de modelos de vehículos (Auto-asignación)
        -- Get IDs for vehicle types (assuming they exist, if not we skip)
        SELECT id INTO v_type_sedan FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_type' AND code = 'sedan';
        SELECT id INTO v_type_suv FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_type' AND code = 'suv';
        SELECT id INTO v_type_pickup FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_type' AND code = 'pickup';
        SELECT id INTO v_type_van FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_type' AND code = 'van';
        SELECT id INTO v_type_truck FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_type' AND code = 'truck';

        -- Update Models with Metadata
        
        -- Toyota
        SELECT id INTO v_brand_toyota FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_brand' AND code = 'TOYOTA';
        IF v_brand_toyota IS NOT NULL THEN
            UPDATE public.catalog_items SET metadata = jsonb_build_object('default_vehicle_type', v_type_sedan) WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_model' AND code IN ('COROLLA', 'YARIS') AND parent_id = v_brand_toyota;
            UPDATE public.catalog_items SET metadata = jsonb_build_object('default_vehicle_type', v_type_pickup) WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_model' AND code = 'HILUX' AND parent_id = v_brand_toyota;
            UPDATE public.catalog_items SET metadata = jsonb_build_object('default_vehicle_type', v_type_suv) WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_model' AND code = 'RAV4' AND parent_id = v_brand_toyota;
        END IF;

        -- Nissan
        SELECT id INTO v_brand_nissan FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_brand' AND code = 'NISSAN';
        IF v_brand_nissan IS NOT NULL THEN
            UPDATE public.catalog_items SET metadata = jsonb_build_object('default_vehicle_type', v_type_sedan) WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_model' AND code IN ('VERSA', 'SENTRA', 'MARCH') AND parent_id = v_brand_nissan;
            UPDATE public.catalog_items SET metadata = jsonb_build_object('default_vehicle_type', v_type_pickup) WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_model' AND code = 'NP300' AND parent_id = v_brand_nissan;
        END IF;

        -- Chevrolet
        SELECT id INTO v_brand_chevrolet FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_brand' AND code = 'CHEVROLET';
        IF v_brand_chevrolet IS NOT NULL THEN
            UPDATE public.catalog_items SET metadata = jsonb_build_object('default_vehicle_type', v_type_sedan) WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_model' AND code IN ('AVEO', 'ONIX') AND parent_id = v_brand_chevrolet;
            UPDATE public.catalog_items SET metadata = jsonb_build_object('default_vehicle_type', v_type_pickup) WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_model' AND code = 'SILVERADO' AND parent_id = v_brand_chevrolet;
        END IF;
        
        -- Ford
        SELECT id INTO v_brand_ford FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_brand' AND code = 'FORD';
        IF v_brand_ford IS NOT NULL THEN
            UPDATE public.catalog_items SET metadata = jsonb_build_object('default_vehicle_type', v_type_sedan) WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_model' AND code = 'FIGO' AND parent_id = v_brand_ford;
            UPDATE public.catalog_items SET metadata = jsonb_build_object('default_vehicle_type', v_type_pickup) WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_model' AND code IN ('RANGER', 'F150') AND parent_id = v_brand_ford;
        END IF;

        -- VW
        SELECT id INTO v_brand_vw FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_brand' AND code = 'VW';
        IF v_brand_vw IS NOT NULL THEN
            UPDATE public.catalog_items SET metadata = jsonb_build_object('default_vehicle_type', v_type_sedan) WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_model' AND code IN ('JETTA', 'VENTO') AND parent_id = v_brand_vw;
            UPDATE public.catalog_items SET metadata = jsonb_build_object('default_vehicle_type', v_type_suv) WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_model' AND code = 'TIGUAN' AND parent_id = v_brand_vw;
        END IF;

        RAISE NOTICE 'Catálogos de demo actualizados con estados y metadatos de auto-asignación.';
    END IF;
END $$;

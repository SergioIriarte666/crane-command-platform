-- ==============================================================================
-- MIGRATION: Fill Demo Catalogs (Chilean Context)
-- ==============================================================================

DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Find the demo tenant
    SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = 'gruas-metropolis';
    
    IF v_tenant_id IS NOT NULL THEN
        
        -- ==============================================================================
        -- MÓDULO: CLIENTES
        -- ==============================================================================

        -- client_type (Codes match ClientType in src/types/clients.ts)
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'client_type') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order) VALUES
            (v_tenant_id, 'client_type', 'particular', 'Particular', 10),
            (v_tenant_id, 'client_type', 'empresa', 'Empresa', 20),
            (v_tenant_id, 'client_type', 'aseguradora', 'Aseguradora', 30),
            (v_tenant_id, 'client_type', 'gobierno', 'Gobierno', 50);
        END IF;

        -- tax_regime (Codes match TAX_REGIMES in src/types/clients.ts)
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'tax_regime') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order) VALUES
            (v_tenant_id, 'tax_regime', 'primera_categoria', 'Primera Categoría - Empresas', 10),
            (v_tenant_id, 'tax_regime', 'segunda_categoria', 'Segunda Categoría - Trabajadores Dependientes', 20),
            (v_tenant_id, 'tax_regime', 'regimen_propyme', 'Régimen Pro Pyme General (Art. 14 D N°3)', 30),
            (v_tenant_id, 'tax_regime', 'regimen_propyme_transparente', 'Régimen Pro Pyme Transparente (Art. 14 D N°8)', 40),
            (v_tenant_id, 'tax_regime', 'renta_presunta', 'Renta Presunta (Art. 34)', 50),
            (v_tenant_id, 'tax_regime', 'regimen_semi_integrado', 'Régimen Semi Integrado (Art. 14 A)', 60),
            (v_tenant_id, 'tax_regime', 'sin_fines_lucro', 'Organizaciones Sin Fines de Lucro', 70),
            (v_tenant_id, 'tax_regime', 'persona_natural', 'Persona Natural con Inicio de Actividades', 80),
            (v_tenant_id, 'tax_regime', 'exento', 'Exento de IVA', 90);
        END IF;

        -- region (Chilean Regions)
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'region') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order) VALUES
            (v_tenant_id, 'region', 'ARICA', 'Arica y Parinacota', 10),
            (v_tenant_id, 'region', 'TARAPACA', 'Tarapacá', 20),
            (v_tenant_id, 'region', 'ANTOFAGASTA', 'Antofagasta', 30),
            (v_tenant_id, 'region', 'ATACAMA', 'Atacama', 40),
            (v_tenant_id, 'region', 'COQUIMBO', 'Coquimbo', 50),
            (v_tenant_id, 'region', 'VALPARAISO', 'Valparaíso', 60),
            (v_tenant_id, 'region', 'METROPOLITANA', 'Metropolitana de Santiago', 70),
            (v_tenant_id, 'region', 'OHIGGINS', 'O''Higgins', 80),
            (v_tenant_id, 'region', 'MAULE', 'Maule', 90),
            (v_tenant_id, 'region', 'NUBLE', 'Ñuble', 100),
            (v_tenant_id, 'region', 'BIOBIO', 'Biobío', 110),
            (v_tenant_id, 'region', 'ARAUCANIA', 'La Araucanía', 120),
            (v_tenant_id, 'region', 'LOS_RIOS', 'Los Ríos', 130),
            (v_tenant_id, 'region', 'LOS_LAGOS', 'Los Lagos', 140),
            (v_tenant_id, 'region', 'AYSEN', 'Aysén', 150),
            (v_tenant_id, 'region', 'MAGALLANES', 'Magallanes y la Antártica Chilena', 160);
        END IF;

        -- ==============================================================================
        -- MÓDULO: GRÚAS
        -- ==============================================================================

        -- crane_type
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'crane_type') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order) VALUES
            (v_tenant_id, 'crane_type', 'PLATFORM', 'Plataforma', 10),
            (v_tenant_id, 'crane_type', 'TOW', 'Arrastre', 20),
            (v_tenant_id, 'crane_type', 'HEAVY', 'Pesada', 30),
            (v_tenant_id, 'crane_type', 'LOWBOY', 'Lowboy', 40),
            (v_tenant_id, 'crane_type', 'SUPPORT', 'Unidad de Auxilio', 50);
        END IF;

        -- fuel_type
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'fuel_type') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order) VALUES
            (v_tenant_id, 'fuel_type', 'DIESEL', 'Diesel', 10),
            (v_tenant_id, 'fuel_type', 'GASOLINE', 'Gasolina', 20),
            (v_tenant_id, 'fuel_type', 'LPG', 'Gas LP', 30),
            (v_tenant_id, 'fuel_type', 'ELECTRIC', 'Eléctrico', 40);
        END IF;

        -- ==============================================================================
        -- MÓDULO: OPERADORES
        -- ==============================================================================

        -- license_type (Codes match LICENSE_TYPES in src/types/operators.ts)
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'license_type') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order) VALUES
            (v_tenant_id, 'license_type', 'A1', 'Clase A1 - Motocicletas hasta 400cc', 10),
            (v_tenant_id, 'license_type', 'A2', 'Clase A2 - Motocicletas sin límite', 20),
            (v_tenant_id, 'license_type', 'A3', 'Clase A3 - Motocicletas con sidecar', 30),
            (v_tenant_id, 'license_type', 'A4', 'Clase A4 - Motos especiales', 40),
            (v_tenant_id, 'license_type', 'A5', 'Clase A5 - Cuatriciclos', 50),
            (v_tenant_id, 'license_type', 'B', 'Clase B - Automóviles y camionetas', 60),
            (v_tenant_id, 'license_type', 'C', 'Clase C - Camiones simples', 70),
            (v_tenant_id, 'license_type', 'D', 'Clase D - Taxis colectivos', 80),
            (v_tenant_id, 'license_type', 'E', 'Clase E - Transporte escolar', 90),
            (v_tenant_id, 'license_type', 'F', 'Clase F - Maquinaria', 100);
        END IF;

        -- blood_type
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'blood_type') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order) VALUES
            (v_tenant_id, 'blood_type', 'O+', 'O Positivo', 10),
            (v_tenant_id, 'blood_type', 'O-', 'O Negativo', 20),
            (v_tenant_id, 'blood_type', 'A+', 'A Positivo', 30),
            (v_tenant_id, 'blood_type', 'A-', 'A Negativo', 40),
            (v_tenant_id, 'blood_type', 'B+', 'B Positivo', 50),
            (v_tenant_id, 'blood_type', 'B-', 'B Negativo', 60),
            (v_tenant_id, 'blood_type', 'AB+', 'AB Positivo', 70),
            (v_tenant_id, 'blood_type', 'AB-', 'AB Negativo', 80);
        END IF;

        -- commission_type
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'commission_type') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order) VALUES
            (v_tenant_id, 'commission_type', 'PERCENTAGE', 'Porcentaje del Servicio', 10),
            (v_tenant_id, 'commission_type', 'FIXED', 'Monto Fijo por Viaje', 20),
            (v_tenant_id, 'commission_type', 'MIXED', 'Mixto (Sueldo + Comisión)', 30);
        END IF;

        -- bank (Chilean Banks)
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'bank') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order) VALUES
            (v_tenant_id, 'bank', 'BANCO_CHILE', 'Banco de Chile', 10),
            (v_tenant_id, 'bank', 'BANCO_ESTADO', 'Banco Estado', 20),
            (v_tenant_id, 'bank', 'SANTANDER', 'Banco Santander', 30),
            (v_tenant_id, 'bank', 'BCI', 'Banco BCI', 40),
            (v_tenant_id, 'bank', 'ITAU', 'Banco Itaú', 50),
            (v_tenant_id, 'bank', 'SCOTIABANK', 'Scotiabank', 60),
            (v_tenant_id, 'bank', 'BICE', 'Banco BICE', 70),
            (v_tenant_id, 'bank', 'SECURITY', 'Banco Security', 80),
            (v_tenant_id, 'bank', 'FALABELLA', 'Banco Falabella', 90),
            (v_tenant_id, 'bank', 'RIPLEY', 'Banco Ripley', 100),
            (v_tenant_id, 'bank', 'CONSORCIO', 'Banco Consorcio', 110),
            (v_tenant_id, 'bank', 'INTERNACIONAL', 'Banco Internacional', 120);
        END IF;

        -- ==============================================================================
        -- MÓDULO: PROVEEDORES
        -- ==============================================================================

        -- supplier_category
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'supplier_category') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order) VALUES
            (v_tenant_id, 'supplier_category', 'PARTS', 'Refacciones', 10),
            (v_tenant_id, 'supplier_category', 'FUEL', 'Combustibles', 20),
            (v_tenant_id, 'supplier_category', 'SERVICES', 'Servicios', 30),
            (v_tenant_id, 'supplier_category', 'INSURANCE', 'Seguros', 40),
            (v_tenant_id, 'supplier_category', 'OTHER', 'Otros', 50);
        END IF;

        -- ==============================================================================
        -- MÓDULO: INVENTARIO
        -- ==============================================================================

        -- inventory_category
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'inventory_category') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order) VALUES
            (v_tenant_id, 'inventory_category', 'TOOLS', 'Herramientas', 10),
            (v_tenant_id, 'inventory_category', 'PPE', 'Equipo de Protección (EPP)', 20),
            (v_tenant_id, 'inventory_category', 'CONSUMABLES', 'Consumibles', 30),
            (v_tenant_id, 'inventory_category', 'SPARE_PARTS', 'Refacciones', 40),
            (v_tenant_id, 'inventory_category', 'UNIFORMS', 'Uniformes', 50);
        END IF;

        -- ==============================================================================
        -- MÓDULO: SERVICIOS
        -- ==============================================================================

        -- service_type
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'service_type') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order) VALUES
            (v_tenant_id, 'service_type', 'LOCAL', 'Arrastre Local', 10),
            (v_tenant_id, 'service_type', 'FOREIGN', 'Arrastre Foráneo', 20),
            (v_tenant_id, 'service_type', 'MANEUVER', 'Maniobra', 30),
            (v_tenant_id, 'service_type', 'CUSTODY', 'Custodia', 40),
            (v_tenant_id, 'service_type', 'TIRE_CHANGE', 'Cambio de Llanta', 50),
            (v_tenant_id, 'service_type', 'BATTERY', 'Paso de Corriente', 60),
            (v_tenant_id, 'service_type', 'FUEL_DELIVERY', 'Suministro de Combustible', 70);
        END IF;

        -- vehicle_type
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_type') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order) VALUES
            (v_tenant_id, 'vehicle_type', 'sedan', 'Sedán', 10),
            (v_tenant_id, 'vehicle_type', 'suv', 'SUV', 20),
            (v_tenant_id, 'vehicle_type', 'pickup', 'Pick-up', 30),
            (v_tenant_id, 'vehicle_type', 'van', 'Van', 40),
            (v_tenant_id, 'vehicle_type', 'truck', 'Camión', 50),
            (v_tenant_id, 'vehicle_type', 'motorcycle', 'Motocicleta', 60),
            (v_tenant_id, 'vehicle_type', 'bus', 'Autobús', 70),
            (v_tenant_id, 'vehicle_type', 'machinery', 'Maquinaria', 80);
        END IF;

        -- vehicle_condition
        IF NOT EXISTS (SELECT 1 FROM public.catalog_items WHERE tenant_id = v_tenant_id AND catalog_type = 'vehicle_condition') THEN
            INSERT INTO public.catalog_items (tenant_id, catalog_type, code, name, sort_order) VALUES
            (v_tenant_id, 'vehicle_condition', 'RUNS', 'Arranca y Camina', 10),
            (v_tenant_id, 'vehicle_condition', 'NEUTRAL', 'No Arranca / Neutral', 20),
            (v_tenant_id, 'vehicle_condition', 'LOCKED', 'Bloqueado', 30),
            (v_tenant_id, 'vehicle_condition', 'WRECKED', 'Siniestrado', 40),
            (v_tenant_id, 'vehicle_condition', 'BURNED', 'Incendiado', 50);
        END IF;

        RAISE NOTICE 'Catálogos de demo llenados (contexto Chile).';
    END IF;
END $$;

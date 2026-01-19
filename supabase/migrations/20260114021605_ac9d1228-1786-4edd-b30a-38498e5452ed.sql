-- Seed catalog_items with all hardcoded values for existing tenants

-- 1. CRANE TYPES (from CRANE_TYPES in fleet.ts)
INSERT INTO catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
SELECT t.id, 'crane_type', 'plataforma', 'Plataforma', 'Grúa con plataforma plana', true, 1 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
SELECT t.id, 'crane_type', 'arrastre', 'Arrastre', 'Grúa de arrastre tradicional', true, 2 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
SELECT t.id, 'crane_type', 'pesada', 'Pesada', 'Grúa para vehículos pesados', true, 3 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
SELECT t.id, 'crane_type', 'lowboy', 'Lowboy', 'Plataforma baja para maquinaria', true, 4 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
SELECT t.id, 'crane_type', 'auxilio', 'Auxilio', 'Vehículo de auxilio vial', true, 5 FROM tenants t
ON CONFLICT DO NOTHING;

-- 2. FUEL TYPES (from FUEL_TYPES in fleet.ts)
INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'fuel_type', 'diesel', 'Diésel', true, 1 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'fuel_type', 'gasolina', 'Gasolina', true, 2 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'fuel_type', 'gas', 'Gas LP', true, 3 FROM tenants t
ON CONFLICT DO NOTHING;

-- 3. CLIENT TYPES (from CLIENT_TYPE_LABELS in clients.ts)
INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'client_type', 'particular', 'Particular', true, 1 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'client_type', 'empresa', 'Empresa', true, 2 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'client_type', 'aseguradora', 'Aseguradora', true, 3 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'client_type', 'gobierno', 'Gobierno', true, 4 FROM tenants t
ON CONFLICT DO NOTHING;

-- 4. CLIENT CATEGORIES (from CLIENT_CATEGORY_LABELS in clients.ts)
INSERT INTO catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
SELECT t.id, 'client_category', 'A', 'Categoría A', 'Cliente preferencial', true, 1 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
SELECT t.id, 'client_category', 'B', 'Categoría B', 'Cliente regular', true, 2 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
SELECT t.id, 'client_category', 'C', 'Categoría C', 'Cliente nuevo', true, 3 FROM tenants t
ON CONFLICT DO NOTHING;

-- 5. LICENSE TYPES (from LICENSE_TYPES in operators.ts)
INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'license_type', 'A1', 'Clase A1 - Motocicletas hasta 400cc', true, 1 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'license_type', 'A2', 'Clase A2 - Motocicletas sin límite', true, 2 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'license_type', 'A3', 'Clase A3 - Motocicletas con sidecar', true, 3 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'license_type', 'A4', 'Clase A4 - Motos especiales', true, 4 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'license_type', 'A5', 'Clase A5 - Cuatriciclos', true, 5 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'license_type', 'B', 'Clase B - Automóviles y camionetas', true, 6 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'license_type', 'C', 'Clase C - Camiones simples', true, 7 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'license_type', 'D', 'Clase D - Taxis colectivos', true, 8 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'license_type', 'E', 'Clase E - Transporte escolar', true, 9 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'license_type', 'F', 'Clase F - Maquinaria', true, 10 FROM tenants t
ON CONFLICT DO NOTHING;

-- 6. BLOOD TYPES (from BLOOD_TYPES in operators.ts)
INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'blood_type', 'A+', 'A+', true, 1 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'blood_type', 'A-', 'A-', true, 2 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'blood_type', 'B+', 'B+', true, 3 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'blood_type', 'B-', 'B-', true, 4 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'blood_type', 'AB+', 'AB+', true, 5 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'blood_type', 'AB-', 'AB-', true, 6 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'blood_type', 'O+', 'O+', true, 7 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'blood_type', 'O-', 'O-', true, 8 FROM tenants t
ON CONFLICT DO NOTHING;

-- 7. COMMISSION TYPES (from COMMISSION_TYPES in operators.ts)
INSERT INTO catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
SELECT t.id, 'commission_type', 'percentage', 'Porcentaje', 'Comisión basada en porcentaje del servicio', true, 1 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
SELECT t.id, 'commission_type', 'fixed', 'Fijo', 'Monto fijo por servicio', true, 2 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
SELECT t.id, 'commission_type', 'mixed', 'Mixto', 'Combinación de porcentaje y monto fijo', true, 3 FROM tenants t
ON CONFLICT DO NOTHING;

-- 8. BANKS (from CHILEAN_BANKS in operators.ts)
INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'bank', 'banco_chile', 'Banco de Chile', true, 1 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'bank', 'banco_estado', 'Banco Estado', true, 2 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'bank', 'banco_santander', 'Banco Santander', true, 3 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'bank', 'banco_bci', 'Banco BCI', true, 4 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'bank', 'banco_itau', 'Banco Itaú', true, 5 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'bank', 'scotiabank', 'Scotiabank', true, 6 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'bank', 'banco_bice', 'Banco BICE', true, 7 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'bank', 'banco_security', 'Banco Security', true, 8 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'bank', 'banco_falabella', 'Banco Falabella', true, 9 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'bank', 'banco_ripley', 'Banco Ripley', true, 10 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'bank', 'banco_consorcio', 'Banco Consorcio', true, 11 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'bank', 'banco_internacional', 'Banco Internacional', true, 12 FROM tenants t
ON CONFLICT DO NOTHING;

-- 9. TAX REGIMES (from TAX_REGIMES in clients.ts)
INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'tax_regime', 'primera_categoria', 'Primera Categoría - Empresas', true, 1 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'tax_regime', 'segunda_categoria', 'Segunda Categoría - Trabajadores Dependientes', true, 2 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'tax_regime', 'regimen_propyme', 'Régimen Pro Pyme General (Art. 14 D N°3)', true, 3 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'tax_regime', 'regimen_propyme_transparente', 'Régimen Pro Pyme Transparente (Art. 14 D N°8)', true, 4 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'tax_regime', 'renta_presunta', 'Renta Presunta (Art. 34)', true, 5 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'tax_regime', 'regimen_semi_integrado', 'Régimen Semi Integrado (Art. 14 A)', true, 6 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'tax_regime', 'sin_fines_lucro', 'Organizaciones Sin Fines de Lucro', true, 7 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'tax_regime', 'persona_natural', 'Persona Natural con Inicio de Actividades', true, 8 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'tax_regime', 'exento', 'Exento de IVA', true, 9 FROM tenants t
ON CONFLICT DO NOTHING;

-- 10. CHILEAN REGIONS (from CHILEAN_REGIONS in clients.ts)
INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'region', 'XV', 'Arica y Parinacota', true, 1 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'region', 'I', 'Tarapacá', true, 2 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'region', 'II', 'Antofagasta', true, 3 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'region', 'III', 'Atacama', true, 4 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'region', 'IV', 'Coquimbo', true, 5 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'region', 'V', 'Valparaíso', true, 6 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'region', 'RM', 'Metropolitana de Santiago', true, 7 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'region', 'VI', 'O''Higgins', true, 8 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'region', 'VII', 'Maule', true, 9 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'region', 'XVI', 'Ñuble', true, 10 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'region', 'VIII', 'Biobío', true, 11 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'region', 'IX', 'La Araucanía', true, 12 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'region', 'XIV', 'Los Ríos', true, 13 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'region', 'X', 'Los Lagos', true, 14 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'region', 'XI', 'Aysén', true, 15 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'region', 'XII', 'Magallanes y la Antártica Chilena', true, 16 FROM tenants t
ON CONFLICT DO NOTHING;

-- 11. SERVICE TYPES (from SERVICE_TYPES in services.ts)
INSERT INTO catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
SELECT t.id, 'service_type', 'local', 'Local', 'Servicio dentro de la ciudad', true, 1 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
SELECT t.id, 'service_type', 'foraneo', 'Foráneo', 'Servicio fuera de la ciudad', true, 2 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
SELECT t.id, 'service_type', 'pension', 'Pensión', 'Servicio de pensión de vehículos', true, 3 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
SELECT t.id, 'service_type', 'maniobra', 'Maniobra', 'Servicio de maniobra especial', true, 4 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
SELECT t.id, 'service_type', 'auxilio', 'Auxilio Vial', 'Servicio de auxilio en carretera', true, 5 FROM tenants t
ON CONFLICT DO NOTHING;

-- 12. VEHICLE TYPES (from VEHICLE_TYPES in services.ts)
INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'vehicle_type', 'sedan', 'Sedán', true, 1 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'vehicle_type', 'suv', 'SUV', true, 2 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'vehicle_type', 'pickup', 'Pickup', true, 3 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'vehicle_type', 'van', 'Van', true, 4 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'vehicle_type', 'truck', 'Camión', true, 5 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'vehicle_type', 'motorcycle', 'Motocicleta', true, 6 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, is_active, sort_order)
SELECT t.id, 'vehicle_type', 'other', 'Otro', true, 7 FROM tenants t
ON CONFLICT DO NOTHING;

-- 13. VEHICLE CONDITIONS (from VEHICLE_CONDITIONS in services.ts)
INSERT INTO catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
SELECT t.id, 'vehicle_condition', 'runs', 'Rueda', 'El vehículo puede rodar', true, 1 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
SELECT t.id, 'vehicle_condition', 'neutral', 'Neutral', 'Puede ponerse en neutral', true, 2 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
SELECT t.id, 'vehicle_condition', 'blocked', 'Bloqueado', 'Ruedas bloqueadas', true, 3 FROM tenants t
ON CONFLICT DO NOTHING;

INSERT INTO catalog_items (tenant_id, catalog_type, code, name, description, is_active, sort_order)
SELECT t.id, 'vehicle_condition', 'accident', 'Accidentado', 'Daño por accidente', true, 4 FROM tenants t
ON CONFLICT DO NOTHING;
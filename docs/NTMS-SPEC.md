# NTMS - Sistema de Gestión de Grúas
## Especificación Completa del Proyecto

---

## 📋 Descripción General

Sistema multi-tenant para administración integral de empresas de grúas, incluyendo operación, facturación, inventario, proveedores y reportes.

---

## 🏗️ Arquitectura

### Stack Tecnológico
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Lovable Cloud (Supabase)
- **Base de Datos**: PostgreSQL con RLS
- **Autenticación**: Supabase Auth

### Estructura Multi-Tenant
- Cada empresa (tenant) tiene datos completamente aislados
- `tenant_id` presente en todas las tablas de negocio
- RLS policies que garantizan aislamiento de datos

---

## 👥 Roles de Usuario

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `super_admin` | Administrador de plataforma | Gestión de todos los tenants, configuración global |
| `admin` | Administrador de empresa | Acceso completo a su tenant |
| `dispatcher` | Despachador | Gestión de servicios, operadores, flota |
| `operator` | Operador de grúa | Vista limitada, actualización de servicios asignados |

---

## 📦 Módulos del Sistema

### Fase 1: Fundamentos Multi-Tenant y Autenticación ✅
**Estado**: Completado

#### Sistema de Tenants
- Tabla `tenants` con información de empresa
- Campos: nombre, slug, logo, colores, RFC, plan, límites
- Planes: basic, professional, enterprise

#### Autenticación
- Login/registro con email y contraseña
- Auto-confirm de emails habilitado
- Trigger automático para crear perfil al registrarse

#### Gestión de Roles
- Tabla `user_roles` separada (seguridad)
- Función `has_role()` security definer
- Función `get_user_tenant_id()` security definer
- Función `is_super_admin()` security definer

#### RLS (Row Level Security)
- Políticas para tenants, profiles, user_roles
- Super admins pueden ver/crear todo
- Admins pueden gestionar su tenant
- Usuarios solo ven su propia información

#### Layout Principal
- Sidebar colapsable (280px) con navegación por grupos
- Header sticky con búsqueda global
- Centro de notificaciones con badge
- Avatar y menú de usuario

---

### Fase 2: Módulos Core de Operación

#### 📋 Gestión de Clientes
**Tabla**: `clients`

```sql
- id, tenant_id
- type: 'particular' | 'empresa' | 'aseguradora' | 'gobierno'
- category: 'A' | 'B' | 'C' (prioridad)
- name, trade_name
- tax_id (RFC), tax_regime
- address, city, state, zip_code
- phone, email, website
- payment_terms (días)
- credit_limit
- requires_po (orden de compra)
- requires_approval (cierre de facturación)
- contacts: jsonb (array de contactos)
- notes
- is_active
- created_at, updated_at
```

**Funcionalidades**:
- Lista con cards visuales (tipo, categoría, indicador de deuda)
- Formulario completo: datos fiscales, contactos múltiples
- Configuración de condiciones comerciales
- Vista detalle con historial de servicios y facturación
- Búsqueda y filtros avanzados

---

#### 🚛 Gestión de Flota (Grúas)
**Tabla**: `cranes`

```sql
- id, tenant_id
- unit_number (ej: GRU-001)
- type: 'plataforma' | 'arrastre' | 'pesada' | 'lowboy' | 'auxilio'
- brand, model, year
- plates, serial_number
- capacity_tons
- status: 'available' | 'in_service' | 'maintenance' | 'out_of_service'
- current_km
- fuel_type, fuel_efficiency
- gps_device_id
- insurance_policy, insurance_expiry
- circulation_permit, permit_expiry
- verification_date, next_verification
- acquisition_date, acquisition_cost
- assigned_operator_id
- notes
- is_active
- created_at, updated_at
```

**Tabla**: `crane_documents`
```sql
- id, crane_id
- type: 'insurance' | 'permit' | 'verification' | 'registration' | 'other'
- name, file_url
- issue_date, expiry_date
- reminder_days
- created_at
```

**Tabla**: `crane_maintenance`
```sql
- id, crane_id
- type: 'preventive' | 'corrective'
- description
- scheduled_date, completed_date
- km_at_maintenance
- next_maintenance_km
- cost
- provider_id
- invoice_number
- notes
- status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
- created_at
```

**Funcionalidades**:
- Cards visuales con estado (disponible, en servicio, mantenimiento)
- Semáforo de documentos (verde, amarillo, rojo por vencimiento)
- Programación de mantenimientos preventivos
- Historial de mantenimientos
- Asignación de herramientas del inventario
- Alertas automáticas de vencimientos

---

#### 👷 Gestión de Operadores
**Tabla**: `operators`

```sql
- id, tenant_id, user_id (opcional, si tiene acceso al sistema)
- employee_number
- full_name
- photo_url
- phone, emergency_phone
- email
- address
- birth_date, hire_date
- license_number, license_type, license_expiry
- blood_type
- status: 'active' | 'inactive' | 'vacation' | 'suspended'
- assigned_crane_id
- commission_type: 'percentage' | 'fixed' | 'mixed'
- commission_percentage
- commission_fixed_amount
- bank_name, bank_account, clabe
- notes
- is_active
- created_at, updated_at
```

**Tabla**: `operator_documents`
```sql
- id, operator_id
- type: 'license' | 'ine' | 'curp' | 'rfc' | 'medical' | 'training' | 'other'
- name, file_url
- issue_date, expiry_date
- reminder_days
- created_at
```

**Funcionalidades**:
- Cards con foto, datos y métricas de desempeño
- Gestión de licencias y certificaciones
- Alertas de vencimiento
- Configuración de esquemas de comisión
- Asignación a grúas
- Historial de servicios realizados

---

### Fase 3: Proveedores y Almacén

#### 🏭 Módulo de Proveedores
**Tabla**: `suppliers`

```sql
- id, tenant_id
- code
- name, trade_name
- category: 'maintenance' | 'tires' | 'fuel' | 'parts' | 'services' | 'other'
- tax_id (RFC), tax_regime
- address, city, state, zip_code
- phone, email, website
- contact_name, contact_phone, contact_email
- payment_terms (días)
- credit_limit
- bank_name, bank_account, clabe
- rating (1-5)
- notes
- is_active
- created_at, updated_at
```

**Tabla**: `supplier_products`
```sql
- id, supplier_id
- product_code
- name, description
- unit: 'piece' | 'liter' | 'kg' | 'service' | 'hour'
- unit_price
- lead_time_days
- is_active
- created_at, updated_at
```

**Tabla**: `purchase_orders`
```sql
- id, tenant_id
- folio
- supplier_id
- status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 'partial' | 'received' | 'cancelled'
- order_date, expected_date, received_date
- subtotal, tax, total
- notes
- approved_by, approved_at
- created_by
- created_at, updated_at
```

**Tabla**: `purchase_order_items`
```sql
- id, purchase_order_id
- product_id (opcional)
- description
- quantity, unit_price
- received_quantity
- total
```

**Tabla**: `supplier_payments`
```sql
- id, tenant_id
- supplier_id
- payment_date
- amount
- payment_method: 'cash' | 'transfer' | 'check' | 'card'
- reference
- applied_to_invoices: jsonb
- notes
- created_by
- created_at
```

**Funcionalidades**:
- Base de datos de proveedores con categorías
- Catálogo de productos/servicios por proveedor
- Órdenes de compra con flujo de aprobación
- Cuentas por pagar
- Historial de compras
- Evaluación de proveedores (calidad, precio, tiempo)

---

#### 📦 Módulo de Almacén/Inventario
**Tabla**: `inventory_items`

```sql
- id, tenant_id
- code, barcode
- name, description
- category: 'parts' | 'tires' | 'oil' | 'tools' | 'equipment' | 'consumables' | 'other'
- unit: 'piece' | 'liter' | 'kg' | 'set'
- current_stock
- min_stock
- max_stock
- reorder_point
- location (ubicación en almacén)
- unit_cost (costo promedio)
- last_purchase_cost
- is_tool (para asignación a grúas)
- is_active
- created_at, updated_at
```

**Tabla**: `inventory_movements`
```sql
- id, tenant_id
- item_id
- type: 'in' | 'out' | 'adjustment' | 'transfer'
- quantity (positivo o negativo)
- unit_cost
- reference_type: 'purchase_order' | 'service' | 'maintenance' | 'adjustment' | 'assignment'
- reference_id
- notes
- created_by
- created_at
```

**Tabla**: `crane_tools`
```sql
- id, crane_id
- item_id
- quantity
- assigned_date
- assigned_by
- notes
```

**Funcionalidades**:
- Inventario de refacciones, herramientas y equipos
- Kardex con entradas y salidas
- Alertas de stock mínimo
- Asignación de herramientas por grúa
- Valuación de inventario (costo promedio)
- Historial de movimientos
- Integración con órdenes de compra

---

### Fase 4: Registro de Servicios y Pipeline

#### 📝 Gestión de Servicios
**Tabla**: `services`

```sql
- id, tenant_id
- folio (auto o manual)
- folio_prefix
- status: 'draft' | 'quoted' | 'confirmed' | 'assigned' | 'en_route' | 'on_site' | 'in_progress' | 'completed' | 'invoiced' | 'cancelled'
- type: 'local' | 'foraneo' | 'pension' | 'maniobra' | 'auxilio'
- priority: 'normal' | 'urgent'

-- Cliente
- client_id
- client_contact_name, client_contact_phone
- is_insured
- insurance_company_id
- insurance_policy, insurance_claim
- insurance_adjuster, insurance_adjuster_phone

-- Vehículo
- vehicle_brand, vehicle_model, vehicle_year
- vehicle_color, vehicle_plates
- vehicle_type: 'sedan' | 'suv' | 'pickup' | 'van' | 'truck' | 'motorcycle' | 'other'
- vehicle_condition: 'runs' | 'neutral' | 'blocked' | 'accident'
- vehicle_keys: boolean
- vehicle_notes

-- Ubicaciones
- origin_address, origin_city, origin_state
- origin_lat, origin_lng
- origin_references
- destination_address, destination_city, destination_state
- destination_lat, destination_lng
- destination_references
- distance_km

-- Asignación
- crane_id
- operator_id
- dispatch_time, arrival_time, completion_time

-- Costos
- base_rate
- km_rate, km_charged
- maneuver_charges: jsonb
- highway_tolls
- waiting_time_hours, waiting_rate
- surcharges: jsonb
- discounts: jsonb
- subtotal, tax_rate, tax_amount, total

-- Documentación
- photos: jsonb (array de URLs)
- signature_url
- notes
- internal_notes

-- Facturación
- invoice_id
- billing_closure_id
- po_number
- po_file_url

-- Auditoría
- created_by
- created_at, updated_at
```

**Formulario Multi-Paso (7 pasos)**:
1. **Información General**: Folio, fecha, tipo, prioridad
2. **Cliente**: Búsqueda/creación, datos de aseguradora si aplica
3. **Vehículo**: Marca, modelo, placas, condición
4. **Ubicaciones**: Origen, destino, referencias, mapa
5. **Asignación**: Selección visual de grúa y operador disponibles
6. **Costos**: Cálculo automático con desglose
7. **Documentación**: Fotos, firma digital, archivos

**Funcionalidades**:
- Lista con búsqueda, filtros, paginación
- Export a Excel/PDF
- Timeline visual de estados
- Galería de fotos
- Firma digital
- Cálculo de rentabilidad

---

#### 🔄 Pipeline de Servicios (Vista Avanzada)
**Estados configurables con colores**

| Estado | Color | Descripción |
|--------|-------|-------------|
| Borrador | Gris | Servicio en captura |
| Cotizado | Azul claro | Cotización enviada |
| Confirmado | Azul | Cliente aceptó |
| Asignado | Púrpura | Grúa y operador asignados |
| En Camino | Amarillo | Operador en tránsito |
| En Sitio | Naranja | Llegó al origen |
| En Proceso | Cian | Realizando servicio |
| Completado | Verde | Servicio terminado |
| Facturado | Verde oscuro | Factura emitida |
| Cancelado | Rojo | Servicio cancelado |

**Vistas Disponibles**:
- 📋 **Lista**: Tabla con todas las columnas, ordenable
- 📊 **Kanban**: Drag & drop entre estados
- 📈 **Embudo**: Funnel de conversión visual
- 📅 **Calendario**: Por fechas de servicio

**Funcionalidades**:
- Métricas por estado: cantidad, valor, tiempo promedio
- Búsqueda avanzada: folio, cliente, cotización, OC
- Acciones masivas: mover múltiples servicios
- Alertas inteligentes integradas
- Tasa de conversión y cuellos de botella

---

### Fase 5: Facturación Completa

#### 📋 Cierres de Facturación (Clientes Corporativos)
**Tabla**: `billing_closures`

```sql
- id, tenant_id
- folio
- client_id
- status: 'draft' | 'pending_review' | 'in_review' | 'approved' | 'rejected' | 'invoiced'
- period_start, period_end
- services: jsonb (array de service_ids)
- services_count
- subtotal, tax, total
- sent_at, sent_to
- reviewed_at, reviewed_by
- comments: jsonb (historial de comentarios)
- approved_at, approval_signature_url
- rejection_reason
- invoice_id
- created_by
- created_at, updated_at
```

**Flujo en 7 pasos**:
1. **Selección de Cliente**: Filtro por tipo corporativo/aseguradora
2. **Definición de Período**: Fecha inicio/fin
3. **Selección de Servicios**: Checkbox para incluir/excluir
4. **Envío al Cliente**: Generación y envío por email
5. **Revisión**: Recepción de comentarios/correcciones
6. **Aprobación**: Firma digital, documento PDF firmado
7. **Facturación**: Generación automática de factura

**Estados**:
- 📝 Borrador
- ⏳ Pendiente revisión
- 🔍 En revisión
- ✅ Aprobado
- ❌ Rechazado
- 🧾 Facturado

---

#### 🧾 Facturación Directa
**Tabla**: `invoices`

```sql
- id, tenant_id
- folio, uuid
- client_id
- type: 'service' | 'closure' | 'credit_note'
- status: 'draft' | 'issued' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled'
- issue_date, due_date
- services: jsonb
- billing_closure_id (si aplica)
- subtotal, tax_rate, tax_amount, total
- paid_amount, balance
- payment_method
- cfdi_use
- payment_form
- pdf_url, xml_url
- sent_at, sent_to
- cancelled_at, cancellation_reason
- notes
- created_by
- created_at, updated_at
```

**Tabla**: `invoice_payments`
```sql
- id, invoice_id
- payment_date
- amount
- payment_method
- reference
- bank_account
- notes
- reconciliation_id
- created_by
- created_at
```

**Funcionalidades**:
- Generación desde servicios individuales o múltiples
- Preview PDF embebido
- Estados visuales con badges
- Registro de pagos parciales
- Envío por email
- Historial de movimientos

---

### Fase 6: Conciliación y Cobranza

#### 💳 Conciliación de Pagos
**Tabla**: `payment_reconciliations`

```sql
- id, tenant_id
- date
- bank_account_id
- status: 'pending' | 'in_progress' | 'completed'
- statement_file_url
- total_deposits
- total_matched
- total_unmatched
- notes
- completed_by, completed_at
- created_by
- created_at, updated_at
```

**Tabla**: `bank_transactions`
```sql
- id, reconciliation_id
- transaction_date
- type: 'deposit' | 'withdrawal'
- amount
- reference
- description
- status: 'pending' | 'matched' | 'unmatched' | 'ignored'
- matched_payment_id
- notes
- created_at
```

**Funcionalidades**:
- Registro de pagos recibidos
- Aplicación a facturas (total o parcial)
- Importación de estados de cuenta (CSV/Excel)
- Matching automático por referencia/monto
- Sugerencias de aplicación
- Conciliación manual para casos especiales
- Reportes de conciliación

---

### Fase 7: Sistema de Notificaciones

#### 🔔 Centro de Notificaciones
**Tabla**: `notifications`

```sql
- id, tenant_id
- user_id (null para todos los admins)
- type: 'license_expiring' | 'document_expiring' | 'service_uninvoiced' | 'invoice_due' | 'invoice_overdue' | 'maintenance_due' | 'stock_low' | 'payment_due' | 'service_no_po' | 'custom'
- severity: 'info' | 'warning' | 'critical'
- title, message
- reference_type, reference_id
- action_url
- status: 'unread' | 'read' | 'archived' | 'resolved'
- snoozed_until
- created_at, read_at, resolved_at
```

**Tabla**: `notification_settings`
```sql
- id, tenant_id
- notification_type
- is_enabled
- threshold_days (para alertas de vencimiento)
- email_enabled
- recipients: jsonb
```

**Alertas Automáticas**:

| Categoría | Alerta | Anticipación |
|-----------|--------|--------------|
| Servicios | Sin OC (corporativos) | Inmediato |
| Servicios | Sin facturar | >7 días |
| Facturación | Próximas a vencer | 7 días antes |
| Facturación | Vencidas | Diario |
| Operadores | Licencias por vencer | 30 días |
| Operadores | Licencias vencidas | Inmediato |
| Flota | Seguros por vencer | 30 días |
| Flota | Permisos por vencer | 30 días |
| Flota | Verificación pendiente | 30 días |
| Flota | Mantenimiento preventivo | Según km/fecha |
| Inventario | Stock bajo mínimo | Inmediato |
| Proveedores | Pagos próximos | 7 días |

---

### Fase 8: Cierres de Caja y Comisiones

#### 💵 Cierres de Caja
**Tabla**: `cash_closures`

```sql
- id, tenant_id
- date, shift: 'morning' | 'afternoon' | 'night'
- operator_id
- services_count
- expected_cash, received_cash, cash_difference
- card_total, transfer_total
- expenses: jsonb
- expenses_total
- net_total
- notes
- signature_url
- status: 'pending' | 'approved' | 'rejected'
- approved_by, approved_at
- created_by
- created_at, updated_at
```

---

#### 📊 Comisiones
**Tabla**: `commissions`

```sql
- id, tenant_id
- operator_id
- period_start, period_end
- services: jsonb
- services_count
- total_billed
- commission_type
- commission_rate
- gross_commission
- deductions: jsonb (anticipos, faltantes, multas)
- deductions_total
- net_commission
- status: 'calculated' | 'approved' | 'paid'
- approved_by, approved_at
- paid_at, payment_reference
- notes
- created_at, updated_at
```

---

### Fase 9: Dashboard y Reportes

#### 🏠 Dashboard Principal
**KPI Cards con gradientes**:
- Servicios del día
- Ingresos del mes
- Cartera vencida
- Meta mensual (% cumplimiento)

**Componentes**:
- Gráfico de ingresos vs gastos (6 meses)
- Servicios en proceso (tiempo real)
- Widget de alertas críticas
- Top operadores del mes
- Ocupación de flota

---

#### 📈 Módulo de Reportes
**Categorías**:

1. **Operativos**
   - Servicios por período
   - Productividad por operador
   - Utilización de flota
   - Tiempos de respuesta

2. **Financieros**
   - Estado de resultados
   - Flujo de efectivo
   - Cuentas por cobrar (aging)
   - Cuentas por pagar
   - Rentabilidad por servicio

3. **Clientes**
   - Facturación por cliente
   - Top clientes
   - Estados de cuenta
   - Servicios por tipo de cliente

4. **Flota**
   - Costos por vehículo
   - Rentabilidad por unidad
   - Kilómetros recorridos
   - Consumo de combustible

5. **Proveedores**
   - Compras por proveedor
   - Evaluaciones
   - Saldos pendientes

6. **Inventario**
   - Movimientos
   - Valorización
   - Rotación
   - Artículos de lento movimiento

**Funcionalidades**:
- Filtros avanzados por período, entidad, categoría
- Gráficos interactivos
- Export a Excel y PDF
- Programación de reportes automáticos

---

### Fase 10: Panel Super Admin

#### 🏢 Gestión de Tenants
**Funcionalidades**:
- Lista de empresas con estadísticas
- Crear/editar/suspender tenants
- Configuración de planes y límites
- Asignación de usuarios admin

**Planes**:
| Plan | Usuarios | Grúas | Características |
|------|----------|-------|-----------------|
| Basic | 5 | 10 | Operación básica |
| Professional | 15 | 30 | + Reportes avanzados |
| Enterprise | Ilimitado | Ilimitado | + API + Integraciones |

**Estadísticas globales**:
- Total de tenants activos
- Total de servicios en plataforma
- Ingresos por plan
- Tenants por estado

---

## 🎨 Sistema de Diseño

### Paleta de Colores (HSL)

```css
/* Primario - Blue 600 */
--primary: 217 91% 60%;

/* Estados semánticos */
--success: 142 76% 36%;    /* Verde */
--warning: 38 92% 50%;     /* Ámbar */
--destructive: 0 84% 60%;  /* Rojo */
--info: 199 89% 48%;       /* Cian */

/* Gradientes */
--gradient-primary: linear-gradient(135deg, primary, info);
--gradient-success: linear-gradient(135deg, success, emerald);
--gradient-warning: linear-gradient(135deg, amber, orange);
--gradient-danger: linear-gradient(135deg, red, rose);
--gradient-purple: linear-gradient(135deg, violet, purple);
```

### Componentes Clave

- **KPI Cards**: Gradientes vibrantes, efecto hover con elevación
- **Status Badges**: Colores semánticos con fondo suave
- **Sidebar**: Fondo oscuro, iconos con color en hover
- **Tables**: Bordes sutiles, rows con hover
- **Forms**: Labels flotantes, validación inline
- **Modals**: Glassmorphism, animaciones de entrada

### Principios

1. **Consistencia**: Tokens de diseño en todas las vistas
2. **Jerarquía clara**: Tamaños de fuente y pesos definidos
3. **Feedback visual**: Estados hover, active, disabled
4. **Responsive**: Mobile-first, breakpoints consistentes
5. **Accesibilidad**: Contraste WCAG AA, focus visible

---

## 📱 Responsive Design

| Breakpoint | Ancho | Layout |
|------------|-------|--------|
| Mobile | < 768px | Sidebar oculto, navegación bottom |
| Tablet | 768px - 1024px | Sidebar colapsado, grid 2 columnas |
| Desktop | > 1024px | Sidebar expandido, grid completo |

---

## 🔒 Seguridad

### Row Level Security (RLS)
- Todas las tablas con RLS habilitado
- Políticas basadas en `tenant_id`
- Funciones `security definer` para checks de roles
- Índices en columnas de filtrado frecuente

### Autenticación
- Passwords hasheados con bcrypt
- Sesiones con JWT
- Refresh tokens automáticos
- Logout en todas las sesiones

### Auditoría
- `created_by`, `created_at` en todas las tablas
- Historial de cambios críticos
- Logs de acceso

---

## 📅 Roadmap de Implementación

### Sprint 1 (Actual) ✅
- [x] Arquitectura multi-tenant
- [x] Autenticación y roles
- [x] Layout principal
- [x] Dashboard inicial

### Sprint 2
- [ ] Módulo Clientes
- [ ] Módulo Flota
- [ ] Módulo Operadores

### Sprint 3
- [ ] Módulo Proveedores
- [ ] Módulo Inventario

### Sprint 4
- [ ] Registro de Servicios
- [ ] Pipeline de Servicios

### Sprint 5
- [ ] Cierres de Facturación
- [ ] Facturación Directa

### Sprint 6
- [ ] Conciliación de Pagos
- [ ] Sistema de Notificaciones

### Sprint 7
- [ ] Cierres de Caja
- [ ] Comisiones

### Sprint 8
- [ ] Dashboard Avanzado
- [ ] Reportes

### Sprint 9
- [ ] Panel Super Admin
- [ ] Optimizaciones

### Sprint 10
- [ ] Integraciones (Stripe, etc.)
- [ ] PWA para operadores

---

## 📝 Notas Adicionales

### Integraciones Futuras
- **Stripe**: Cobros y suscripciones
- **CFDI**: Facturación electrónica SAT
- **GPS**: Tracking en tiempo real
- **WhatsApp**: Notificaciones a clientes
- **Google Maps**: Cálculo de rutas y distancias

### Consideraciones de Performance
- Paginación en todas las listas (50 items por página)
- Índices en campos de búsqueda frecuente
- Caché de consultas frecuentes
- Lazy loading de imágenes
- Compresión de assets

---

*Documento generado: Enero 2026*
*Versión: 1.0*

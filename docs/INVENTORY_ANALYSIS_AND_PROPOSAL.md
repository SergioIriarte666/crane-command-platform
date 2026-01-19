# Análisis y Propuesta de Mejora: Módulo de Inventario

## 1. Evaluación Exhaustiva del Estado Actual

### 1.1 Funcionalidades Existentes
Actualmente, el módulo de inventario proporciona una gestión básica de existencias centrada en el mantenimiento de un catálogo de artículos y el registro de movimientos simples.

*   **Catálogo de Artículos:** CRUD (Crear, Leer, Actualizar, Eliminar) de ítems con atributos básicos (código, nombre, categoría, unidad, costos, stock mínimo/máximo).
*   **Control de Stock:** Registro de cantidad actual en un único campo `current_stock`.
*   **Movimientos:** Registro manual de Entradas, Salidas, Ajustes y Transferencias.
*   **Visualización:** Listado con filtros por categoría y estado de stock (bajo, crítico, etc.).
*   **Alertas Visuales:** Indicadores de color en la interfaz para niveles de stock.

### 1.2 Arquitectura Técnica y Datos
El modelo de datos actual es plano y simplificado:

*   **`inventory_items`**: Tabla principal que mezcla la definición del producto con su existencia.
    *   *Limitación crítica*: El campo `location` es un texto simple, lo que impide gestionar múltiples almacenes o ubicaciones específicas de manera estructurada.
    *   *Limitación crítica*: El campo `current_stock` es un valor único, impidiendo el rastreo por lotes o ubicaciones.
*   **`inventory_movements`**: Historial lineal de transacciones vinculado directamente al ítem.

### 1.3 Limitaciones y Puntos Débiles
1.  **Monolocalización:** No soporta múltiples bodegas, almacenes o ubicaciones dentro de un almacén (pasillo/estante/nivel).
2.  **Trazabilidad Limitada:** Inexistencia de control de lotes y fechas de caducidad. Crítico para consumibles perecederos o aceites.
3.  **Integración Aislada:** No hay conexión automática con Órdenes de Compra (entradas automáticas) ni Órdenes de Servicio (salidas automáticas por consumo).
4.  **Auditoría Manual:** Falta de herramientas para la toma física de inventario (conteos cíclicos, conciliación).
5.  **Costeo Simplificado:** El costo se maneja como `unit_cost` y `last_purchase_cost` en el ítem, sin soporte para métodos de valoración avanzados (PEPS/FIFO, Promedio Ponderado real por lote).

---

## 2. Propuestas de Mejora con Especificaciones Técnicas

### 2.1 Gestión Avanzada de Stock
Separar la definición del producto de sus existencias físicas.

*   **Multi-Ubicación:** Permitir definir N almacenes (Ej: Bodega Central, Taller, Camioneta 01).
*   **Control de Lotes y Caducidades:** Trazabilidad completa desde la entrada hasta el consumo.

**Nuevo Modelo Conceptual:**
`Item` (Catálogo) -> `Stock` (Cantidad) -> `Lote` (Opcional) -> `Ubicación`

### 2.2 Sistema de Alertas Automáticas
*   **Stock Mínimo/Punto de Reorden:** Notificaciones push/email cuando el stock global o por almacén caiga bajo el umbral.
*   **Próximos a Vencer:** Alerta diaria de lotes que caducan en X días (configurable por categoría).

### 2.3 Integración con Módulos
*   **Compras:** Al recibir una Orden de Compra, generar automáticamente una "Entrada de Recepción" que incremente el stock y cree los lotes correspondientes.
*   **Servicios/Mantenimiento:** Al asignar refacciones a una Orden de Trabajo, realizar una "Reserva de Stock". Al cerrar la orden, confirmar la "Salida por Consumo".

### 2.4 Procesos de Inventario Físico
Implementar un sub-módulo de **Auditoría**:
1.  **Crear Sesión de Conteo:** Seleccionar almacén y categorías (o "ciego").
2.  **Captura:** Interfaz móvil-friendly para ingresar conteos reales.
3.  **Conciliación:** Comparar Teórico vs. Físico y generar reporte de variaciones.
4.  **Ajuste:** Generar automáticamente movimientos de ajuste para cuadrar el stock.

### 2.5 Reportes Analíticos
*   **Valorización de Inventario:** ¿Cuánto dinero tengo invertido hoy?
*   **Kardex de Artículo:** Historial detallado de movimientos (Entradas/Salidas/Saldos).
*   **Rotación de Inventario:** Identificar productos de lento movimiento (obsoletos).

---

## 3. Plan de Implementación por Fases

### Fase 1: Fundamentos y Migración de Datos (Semana 1-2)
*   **Objetivo:** Establecer el nuevo modelo de datos robusto.
*   **Tareas:**
    1.  Crear tablas `warehouses`, `locations`, `inventory_batches`, `inventory_stock`.
    2.  Migrar datos actuales: Mover `current_stock` a una ubicación "Default".
    3.  Adaptar API/Hooks (`useInventory`) para leer del nuevo modelo.
*   **Impacto:** Transparente para el usuario, pero habilita las futuras funciones.

### Fase 2: Gestión Multi-Ubicación y Lotes (Semana 3-4)
*   **Objetivo:** Habilitar el control detallado en la interfaz.
*   **Tareas:**
    1.  Actualizar formularios de Movimientos para seleccionar Almacén y Lote.
    2.  Implementar vista de "Detalle de Stock" en la ficha del producto (desglose por ubicación).
    3.  Implementar Transferencias entre almacenes.

### Fase 3: Integraciones y Alertas (Semana 5-6)
*   **Objetivo:** Automatizar flujos.
*   **Tareas:**
    1.  Conectar recepción de Compras con Inventario.
    2.  Implementar sistema de notificaciones de bajo stock.

### Fase 4: Auditoría y Reportes (Semana 7-8)
*   **Objetivo:** Control y Análisis.
*   **Tareas:**
    1.  Desarrollar módulo de Toma de Inventario.
    2.  Implementar Dashboards y Reportes de Valorización.

---

## 4. Requisitos Técnicos Adicionales

### 4.1 Modelo de Datos Ampliado (Supabase Schema)

```sql
-- Almacenes (Bodegas, Vehículos, etc.)
create table warehouses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  type text not null, -- 'physical', 'virtual', 'transit'
  address text
);

-- Ubicaciones dentro de almacenes (Pasillo A, Estante 1)
create table locations (
  id uuid primary key default uuid_generate_v4(),
  warehouse_id uuid references warehouses(id),
  code text not null,
  name text
);

-- Lotes
create table inventory_batches (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid references inventory_items(id),
  batch_number text not null,
  expiry_date date,
  received_date date default now(),
  cost numeric
);

-- Existencias (Tabla Pivote)
create table inventory_stock (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid references inventory_items(id),
  location_id uuid references locations(id),
  batch_id uuid references inventory_batches(id), -- Nullable si no usa lotes
  quantity numeric not null default 0,
  unique(item_id, location_id, batch_id)
);
```

### 4.2 API / Hooks Necesarios
*   `useStock(itemId)`: Obtener desglose de stock por ubicación.
*   `useBatches(itemId)`: Obtener lotes disponibles y sus fechas.
*   `useStockMovement()`: Registrar movimientos complejos (validando stock disponible en lote/ubicación específica).
*   `useAudit()`: Gestionar sesiones de conteo físico.

### 4.3 Estrategia de Testing
*   **Unit Tests:** Validar lógica de cálculo de stock (Entrada - Salida = Saldo).
*   **Integration Tests:** Verificar que una Compra recibida cree el stock correctamente.
*   **User Acceptance Testing (UAT):** Simular una toma de inventario física completa.

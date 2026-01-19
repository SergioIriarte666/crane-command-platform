# Guía: Lovable Cloud vs Supabase Externo

Esta guía explica las diferencias entre los dos modos de integración de base de datos en Lovable y cómo manejar cada uno.

---

## 📊 Comparativa Rápida

| Característica | Lovable Cloud | Supabase Externo |
|---|---|---|
| Acceso al Dashboard de Supabase | ❌ No disponible | ✅ Acceso total |
| Configuración inicial | Automática | Manual |
| Control de la base de datos | Via migraciones SQL | Total (UI + SQL) |
| Portabilidad | Limitada | Total |
| Costo adicional | Incluido en Lovable | Según plan de Supabase |
| Ideal para | Prototipos rápidos | Producción / Control total |

---

## 🔵 Lovable Cloud (Este Proyecto)

### ¿Qué es?
Lovable Cloud es una instancia de Supabase **gestionada automáticamente por Lovable**. Cuando creas un proyecto y habilitas funcionalidades de backend, Lovable provisiona automáticamente una base de datos PostgreSQL.

### Datos del proyecto actual
```
Project ID: fvvpwjvxhlmfoaydadyy
URL: https://fvvpwjvxhlmfoaydadyy.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Características
- ✅ Configuración automática sin pasos adicionales
- ✅ Migraciones SQL gestionadas por Lovable
- ✅ Edge Functions desplegadas automáticamente
- ✅ RLS (Row Level Security) configurable via migraciones
- ❌ **NO** tienes acceso al dashboard de Supabase
- ❌ **NO** puedes ejecutar queries SQL manualmente en el dashboard
- ❌ **NO** puedes ver/editar datos directamente en tablas via UI

### Cómo hacer cambios en la base de datos
Todos los cambios se hacen mediante **migraciones SQL** que Lovable ejecuta:

```sql
-- Ejemplo de migración (ejecutada por Lovable)
CREATE TABLE public.mi_tabla (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mi_tabla ENABLE ROW LEVEL SECURITY;
```

### Archivos importantes
```
supabase/
├── config.toml                    # Configuración (NO EDITAR)
├── migrations/                    # Migraciones SQL ejecutadas
│   ├── 20260101000000_initial.sql
│   └── ...
└── functions/                     # Edge Functions
    └── generate-backup/
        └── index.ts

src/integrations/supabase/
├── client.ts                      # Cliente Supabase (NO EDITAR)
└── types.ts                       # Tipos auto-generados (NO EDITAR)
```

---

## 🟢 Supabase Externo

### ¿Qué es?
Es tu **propia cuenta de Supabase** conectada a un proyecto de Lovable. Tienes control total sobre la base de datos.

### Características
- ✅ Acceso total al dashboard de Supabase
- ✅ Ejecutar queries SQL directamente
- ✅ Ver y editar datos en tablas via UI
- ✅ Configurar Auth, Storage, Edge Functions desde el dashboard
- ✅ Exportar/importar datos fácilmente
- ✅ Conectar a múltiples proyectos
- ⚠️ Requiere configuración manual inicial
- ⚠️ Debes gestionar tu propio plan de Supabase

### Cómo conectar Supabase Externo (proyectos nuevos)

1. **Crear cuenta en Supabase**
   - Ve a [supabase.com](https://supabase.com)
   - Crea una cuenta gratuita
   - Crea un nuevo proyecto

2. **Obtener credenciales**
   - En el dashboard de Supabase: Settings → API
   - Copia:
     - Project URL: `https://xxxxx.supabase.co`
     - Anon/Public Key: `eyJhbGci...`

3. **Conectar en Lovable**
   - Crea un **nuevo proyecto** en Lovable
   - **IMPORTANTE**: NO uses Lovable Cloud
   - Ve a Settings → Connectors → Supabase
   - Ingresa tus credenciales

---

## ⚠️ Limitaciones de Lovable Cloud

### No es posible migrar a Supabase Externo
Una vez que un proyecto usa Lovable Cloud, **NO es posible**:
- Desconectar Lovable Cloud
- Migrar la base de datos a tu cuenta de Supabase
- Restaurar a una versión anterior sin Cloud

### Alternativas
1. **Exportar datos** usando el sistema de backups
2. **Crear nuevo proyecto** con Supabase Externo
3. **Replicar el schema** usando las migraciones SQL

---

## 📦 Exportar Datos de Este Proyecto

### Opción 1: Sistema de Backups (Recomendado)
1. Ve a **Configuración** → **Respaldos**
2. Genera un backup completo
3. Descarga el archivo JSON/SQL

### Opción 2: Exportar via Lovable
1. En el panel de Cloud, ve a Database → Tables
2. Selecciona la tabla a exportar
3. Click en el botón de exportar

### Opción 3: Consultar datos via código
```typescript
import { supabase } from "@/integrations/supabase/client";

// Exportar todos los datos de una tabla
const { data, error } = await supabase
  .from('mi_tabla')
  .select('*');

console.log(JSON.stringify(data, null, 2));
```

---

## 📋 Migraciones SQL de Este Proyecto

Ubicación: `supabase/migrations/`

### Migraciones principales ejecutadas:

#### Tablas core
- `tenants` - Multi-tenancy
- `profiles` - Perfiles de usuario
- `user_roles` - Roles y permisos

#### Tablas operativas
- `services` - Servicios de grúa
- `clients` - Clientes
- `operators` - Operadores
- `cranes` - Grúas
- `costs` - Gastos
- `invoices` - Facturas
- `payments` - Pagos
- `suppliers` - Proveedores
- `inventory_items` - Inventario

#### Tablas de configuración
- `plan_configs` - Configuración de planes
- `plan_features` - Características por plan
- `trial_settings` - Configuración de trials
- `trial_audit_logs` - Logs de auditoría
- `catalog_items` - Catálogos unificados

#### Tablas financieras
- `billing_closures` - Cierres de facturación
- `commissions` - Comisiones
- `bank_transactions` - Transacciones bancarias

### Replicar schema en Supabase Externo
Para replicar este schema en tu Supabase:
1. Crea un nuevo proyecto en Supabase
2. Abre el SQL Editor
3. Ejecuta cada migración en orden cronológico

---

## 🔄 Flujo de Trabajo Recomendado

### Para proyectos de producción con control total:
```
1. Crear nuevo proyecto Lovable (sin Cloud)
2. Conectar tu Supabase personal
3. Exportar datos de este proyecto
4. Importar en tu Supabase
5. Desarrollar con acceso total al dashboard
```

### Para desarrollo rápido / prototipos:
```
1. Usar Lovable Cloud (este proyecto)
2. Hacer cambios via migraciones SQL
3. Usar el sistema de backups para exportar
4. Migrar a Supabase externo cuando sea necesario
```

---

## ❓ Preguntas Frecuentes

### ¿Por qué no puedo ver el dashboard de Supabase?
Este proyecto usa **Lovable Cloud**, que es una instancia gestionada. No tienes acceso directo al dashboard.

### ¿Puedo cambiar a Supabase Externo?
No en este proyecto. Debes crear un nuevo proyecto sin Lovable Cloud.

### ¿Mis datos están seguros?
Sí, Lovable Cloud usa la misma infraestructura de Supabase con todas las medidas de seguridad.

### ¿Cómo hago queries SQL?
Usa el cliente de Supabase en código o pide a Lovable que ejecute migraciones.

### ¿Puedo ver mis datos?
Sí, pero solo via código o usando las herramientas de Lovable (Cloud → Database → Tables).

---

## 📞 Soporte

- [Documentación de Lovable](https://docs.lovable.dev/)
- [Documentación de Supabase](https://supabase.com/docs)
- [Discord de Lovable](https://discord.com/channels/1119885301872070706)

---

*Última actualización: Enero 2026*

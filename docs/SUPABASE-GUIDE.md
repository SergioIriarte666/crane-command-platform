# Guía de Supabase

Este proyecto utiliza Supabase como backend para la base de datos y autenticación.

## Configuración de Supabase

El proyecto está conectado a una instancia externa de Supabase. Tienes control total sobre la base de datos.

### Características

- ✅ Acceso total al dashboard de Supabase
- ✅ Ejecutar queries SQL directamente
- ✅ Ver y editar datos en tablas via UI
- ✅ Configurar Auth, Storage, Edge Functions desde el dashboard
- ✅ Exportar/importar datos fácilmente

### Credenciales

Las credenciales se encuentran en el archivo `.env` (o en las variables de entorno de Vercel para producción):

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### Estructura de Archivos

```
supabase/
├── config.toml                    # Configuración
├── migrations/                    # Migraciones SQL
└── functions/                     # Edge Functions

src/integrations/supabase/
├── client.ts                      # Cliente Supabase
└── types.ts                       # Tipos generados
```

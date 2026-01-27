-- SQL Completo para Automatización de Notificaciones
-- Este script activa la extensión pg_cron para que las notificaciones se procesen cada minuto.

-- 1. Habilitar extensión de CRON JOBS (Programador de tareas)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Habilitar extensión para hacer peticiones HTTP (pg_net)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. Crear el trabajo automático (Se ejecuta cada minuto)
-- NOTA: Reemplaza 'TU_ANON_KEY' con la clave real si ejecutas esto manualmente en otro entorno.
-- Aquí usamos una subconsulta para intentar ser dinámicos, pero en pg_cron es mejor ser explícito.

SELECT cron.schedule(
  'process-notifications-every-minute', -- Nombre del trabajo
  '* * * * *',                          -- Cron expression (cada minuto)
  $$
  SELECT
    net.http_post(
        url:='https://qfopiqsqufravywakdpa.supabase.co/functions/v1/process-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmb3BpcXNxdWZyYXZ5d2FrZHBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwODUwODgsImV4cCI6MjA4NDY2MTA4OH0.QzYEI98CPPDynQ8DYYi2Psso_MPXhe7N_Bj0Q0pd4DI"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);

-- 4. Verificar que el trabajo quedó programado
SELECT * FROM cron.job;

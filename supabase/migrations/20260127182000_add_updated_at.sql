-- Agregar columna updated_at si no existe
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

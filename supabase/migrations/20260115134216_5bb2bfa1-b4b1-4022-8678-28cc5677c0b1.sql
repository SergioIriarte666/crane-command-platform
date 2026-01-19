-- Cambiar columna type de enum a text para usar códigos del catálogo
ALTER TABLE public.services 
  ALTER COLUMN type TYPE text USING type::text;

-- Establecer un valor por defecto razonable
ALTER TABLE public.services 
  ALTER COLUMN type SET DEFAULT 'local';
-- Verificar extensiones y triggers existentes
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- Verificar si existe el trigger de webhook
SELECT tgname, tgtype, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname LIKE '%webhook%' OR tgname LIKE '%process%';

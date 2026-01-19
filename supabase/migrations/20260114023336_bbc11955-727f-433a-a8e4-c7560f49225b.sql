-- Eliminar la columna category de la tabla clients
ALTER TABLE clients DROP COLUMN IF EXISTS category;

-- Eliminar los datos de catálogo de client_category
DELETE FROM catalog_items WHERE catalog_type = 'client_category';
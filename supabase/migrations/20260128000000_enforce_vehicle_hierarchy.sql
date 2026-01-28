-- 1. Create Audit Views for reporting existing issues

-- View to find Services that have Brand/Model text values not matching any Catalog Item (Orphans by Name)
CREATE OR REPLACE VIEW audit_service_vehicle_orphans AS
SELECT 
  s.id, 
  s.folio, 
  s.vehicle_brand, 
  s.vehicle_model, 
  s.vehicle_type,
  CASE 
    WHEN cb.id IS NULL THEN 'Brand not in catalog'
    WHEN cm.id IS NULL THEN 'Model not in catalog'
    ELSE 'Unknown mismatch'
  END as issue_type
FROM services s
LEFT JOIN catalog_items cb ON cb.catalog_type = 'vehicle_brand' AND cb.name = s.vehicle_brand
LEFT JOIN catalog_items cm ON cm.catalog_type = 'vehicle_model' AND cm.name = s.vehicle_model
WHERE 
  (s.vehicle_brand IS NOT NULL AND s.vehicle_brand != '' AND cb.id IS NULL) OR
  (s.vehicle_model IS NOT NULL AND s.vehicle_model != '' AND cm.id IS NULL);

-- View to find Catalog Models that are missing a parent Brand or parent is invalid
CREATE OR REPLACE VIEW audit_catalog_model_orphans AS
SELECT 
  m.id, 
  m.name as model_name, 
  m.parent_id,
  p.name as parent_name_if_exists
FROM catalog_items m
LEFT JOIN catalog_items p ON p.id = m.parent_id
WHERE 
  m.catalog_type = 'vehicle_model' AND 
  (m.parent_id IS NULL OR p.id IS NULL OR p.catalog_type != 'vehicle_brand');


-- 2. Create Trigger to Enforce Hierarchy for FUTURE inserts/updates

CREATE OR REPLACE FUNCTION check_vehicle_hierarchy()
RETURNS TRIGGER AS $$
BEGIN
  -- Enforce: Vehicle Model must have a Parent which is a Vehicle Brand
  IF NEW.catalog_type = 'vehicle_model' THEN
    IF NEW.parent_id IS NULL THEN
      RAISE EXCEPTION 'Vehicle Model "%" must have a parent Brand (parent_id is null)', NEW.name;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM catalog_items 
      WHERE id = NEW.parent_id AND catalog_type = 'vehicle_brand'
    ) THEN
      RAISE EXCEPTION 'Vehicle Model "%" must point to a valid Vehicle Brand', NEW.name;
    END IF;
  END IF;

  return NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_vehicle_hierarchy_trigger ON catalog_items;

CREATE TRIGGER enforce_vehicle_hierarchy_trigger
BEFORE INSERT OR UPDATE ON catalog_items
FOR EACH ROW
EXECUTE FUNCTION check_vehicle_hierarchy();

-- Note: This trigger will block any new invalid data. 
-- Existing invalid data will remain but can be found via the audit views.

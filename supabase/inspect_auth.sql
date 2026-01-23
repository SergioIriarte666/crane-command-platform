
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Inspecting auth.users schema and sample data...';
    
    FOR r IN 
        SELECT * FROM auth.users LIMIT 1
    LOOP
        RAISE NOTICE 'User: %', row_to_json(r);
    END LOOP;
END $$;

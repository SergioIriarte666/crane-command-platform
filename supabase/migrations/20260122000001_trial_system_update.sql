
-- Add trial_plan column to trial_settings
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trial_settings' AND column_name = 'trial_plan') THEN
        ALTER TABLE public.trial_settings ADD COLUMN trial_plan VARCHAR DEFAULT 'basic';
    END IF;
END $$;

-- Add preferences column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{
  "theme": "system",
  "compactMode": false,
  "animations": true,
  "highContrast": false
}'::jsonb;
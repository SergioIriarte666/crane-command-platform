-- Auto-confirm any users that are pending confirmation
-- This is helpful for initial migration to ensure access
UPDATE auth.users 
SET email_confirmed_at = now(),
    last_sign_in_at = now(),
    raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{email_verified}',
        'true'
    )
WHERE email_confirmed_at IS NULL;

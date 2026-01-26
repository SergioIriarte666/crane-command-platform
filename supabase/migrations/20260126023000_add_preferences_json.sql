
alter table public.notification_preferences
add column if not exists settings jsonb default '{}';

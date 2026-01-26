
-- Enums
create type public.notification_channel as enum ('in_app', 'email', 'push');
create type public.notification_status as enum ('pending', 'processing', 'sent', 'failed');

-- Notification Preferences
create table if not exists public.notification_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  channels notification_channel[] default '{in_app}',
  categories text[] default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  primary key (user_id)
);

alter table public.notification_preferences enable row level security;

create policy "Users can view own preferences"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users can update own preferences"
  on public.notification_preferences for update
  using (auth.uid() = user_id);

create policy "Users can insert own preferences"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

-- Notification Templates
create table if not exists public.notification_templates (
  id uuid not null default gen_random_uuid() primary key,
  code text not null unique,
  name text not null,
  subject_template text not null, -- Title/Subject
  body_template text not null, -- Content
  default_channels notification_channel[] default '{in_app}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.notification_templates enable row level security;

-- Admins/System can manage templates. For now, read-only for users if needed?
-- Or maybe only accessible by service role?
-- Let's allow authenticated users to read templates if they need to render them client-side?
-- Usually templates are rendered server-side.
-- We'll enable RLS but maybe restrict access.
create policy "Authenticated users can view templates"
  on public.notification_templates for select
  to authenticated
  using (true);

-- Enhance Notifications Table
alter table public.notifications
add column if not exists channel notification_channel default 'in_app',
add column if not exists status notification_status default 'sent', -- Default sent for existing ones (assumed in-app)
add column if not exists metadata jsonb default '{}',
add column if not exists template_id uuid references public.notification_templates(id),
add column if not exists scheduled_for timestamp with time zone;

-- Index for queue processing
create index if not exists idx_notifications_status_scheduled on public.notifications(status, scheduled_for);

-- Trigger to update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_updated_at_preferences
  before update on public.notification_preferences
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_templates
  before update on public.notification_templates
  for each row execute procedure public.handle_updated_at();

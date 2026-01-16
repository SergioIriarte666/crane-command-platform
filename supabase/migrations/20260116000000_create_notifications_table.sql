
-- Create notification type enum if it doesn't exist
do $$ begin
    create type notification_type as enum ('info', 'warning', 'error', 'success');
exception
    when duplicate_object then null;
end $$;

-- Create notifications table
create table if not exists public.notifications (
  id uuid not null default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type notification_type not null default 'info',
  read boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint notifications_pkey primary key (id)
);

-- RLS
alter table public.notifications enable row level security;

create policy "Users can view notifications for their tenant"
  on public.notifications
  for select
  using (
    tenant_id in (select tenant_id from public.profiles where id = auth.uid())
    and (user_id is null or user_id = auth.uid())
  );

create policy "Users can update their own notifications"
  on public.notifications
  for update
  using (
    tenant_id in (select tenant_id from public.profiles where id = auth.uid())
    and (user_id is null or user_id = auth.uid())
  );

-- Indexes
create index if not exists idx_notifications_tenant_id on public.notifications(tenant_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

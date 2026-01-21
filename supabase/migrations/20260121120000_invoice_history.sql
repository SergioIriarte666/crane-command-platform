create table if not exists public.invoice_history (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  changed_by uuid references public.profiles(id),
  changed_at timestamptz default now() not null,
  changes jsonb not null, -- Stores { field: { old: val, new: val } }
  action_type text not null, -- 'create', 'update', 'status_change'
  tenant_id uuid references public.tenants(id) not null
);

-- Enable RLS
alter table public.invoice_history enable row level security;

-- Policies
create policy "Users can view invoice history of their tenant"
  on public.invoice_history for select
  using (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

create policy "Users can insert invoice history for their tenant"
  on public.invoice_history for insert
  with check (tenant_id = (select auth.jwt() ->> 'tenant_id')::uuid);

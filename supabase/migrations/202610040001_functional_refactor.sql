-- RestoPulse functional refactor migration.
-- Backward-compatible: existing tables/columns are preserved. These tables fill
-- gaps already referenced by the application and are required for persistent
-- inventory/subscription settings/history.

create table if not exists public.settings(
  key text primary key,
  value text not null default '',
  upi_id text,
  updated_at timestamptz not null default now()
);
alter table public.settings enable row level security;
revoke all on public.settings from anon, authenticated;
grant select, insert, update, delete on public.settings to authenticated;
drop policy if exists settings_admin_read on public.settings;
drop policy if exists settings_admin_write on public.settings;
create policy settings_admin_read on public.settings for select to authenticated
  using(public.is_platform_admin());
create policy settings_admin_write on public.settings for all to authenticated
  using(public.is_platform_admin()) with check(public.is_platform_admin());

create table if not exists public.subscription_requests(
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) on delete set null,
  restaurant_name text not null default 'Restaurant',
  owner_name text not null default 'Owner',
  owner_email text not null default '',
  plan text not null default 'Monthly',
  amount numeric(12,2) not null default 0,
  upi_id text not null default '',
  screenshot_url text not null default '',
  reference_id text not null default '',
  message text not null default '',
  status text not null default 'Pending',
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);
alter table public.subscription_requests enable row level security;
revoke all on public.subscription_requests from anon, authenticated;
grant select, insert, update on public.subscription_requests to authenticated;
drop policy if exists subscription_request_admin on public.subscription_requests;
drop policy if exists subscription_request_restaurant_read on public.subscription_requests;
drop policy if exists subscription_request_restaurant_insert on public.subscription_requests;
create policy subscription_request_admin on public.subscription_requests for all to authenticated
  using(public.is_platform_admin()) with check(public.is_platform_admin());
create policy subscription_request_restaurant_read on public.subscription_requests for select to authenticated
  using(public.is_platform_admin() or (restaurant_id is not null and public.is_restaurant_member(restaurant_id)));
create policy subscription_request_restaurant_insert on public.subscription_requests for insert to authenticated
  with check(restaurant_id is not null and public.is_restaurant_member(restaurant_id));

create index if not exists subscription_requests_restaurant_idx
  on public.subscription_requests(restaurant_id, requested_at desc);

create table if not exists public.inventory_items(
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  category text not null default 'General',
  on_hand numeric(12,3) not null default 0 check(on_hand >= 0),
  unit text not null default 'unit',
  reorder_level numeric(12,3) not null default 0 check(reorder_level >= 0),
  cost numeric(12,2) not null default 0 check(cost >= 0),
  supplier_id uuid,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(restaurant_id,id),
  foreign key(restaurant_id,supplier_id) references public.suppliers(restaurant_id,id)
);
alter table public.inventory_items enable row level security;
revoke all on public.inventory_items from anon, authenticated;
grant select, insert, update, delete on public.inventory_items to authenticated;
create policy inventory_read on public.inventory_items for select to authenticated
  using(public.is_restaurant_member(restaurant_id));
create policy inventory_insert on public.inventory_items for insert to authenticated
  with check(public.can_manage_restaurant(restaurant_id));
create policy inventory_update on public.inventory_items for update to authenticated
  using(public.can_manage_restaurant(restaurant_id))
  with check(public.can_manage_restaurant(restaurant_id));
create policy inventory_delete on public.inventory_items for delete to authenticated
  using(public.can_manage_restaurant(restaurant_id));

create table if not exists public.inventory_transactions(
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  inventory_item_id uuid not null,
  previous_quantity numeric(12,3) not null,
  change_quantity numeric(12,3) not null,
  new_quantity numeric(12,3) not null,
  transaction_type text not null,
  reference_id text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  foreign key(restaurant_id,inventory_item_id) references public.inventory_items(restaurant_id,id)
);
alter table public.inventory_transactions enable row level security;
revoke all on public.inventory_transactions from anon, authenticated;
grant select, insert on public.inventory_transactions to authenticated;
create policy inventory_tx_read on public.inventory_transactions for select to authenticated
  using(public.is_restaurant_member(restaurant_id));
create policy inventory_tx_insert on public.inventory_transactions for insert to authenticated
  with check(public.can_manage_restaurant(restaurant_id));
create index if not exists inventory_items_restaurant_idx on public.inventory_items(restaurant_id, updated_at desc);
create index if not exists inventory_tx_restaurant_idx on public.inventory_transactions(restaurant_id, created_at desc);

-- Keep updated_at accurate without requiring client-side timestamps.
create or replace function public.touch_inventory_item() returns trigger
language plpgsql set search_path='' as $$
begin
  new.updated_at = now();
  return new;
end $$;
drop trigger if exists inventory_item_touch on public.inventory_items;
create trigger inventory_item_touch before update on public.inventory_items
for each row execute function public.touch_inventory_item();

-- Realtime is enabled only for the functional tables; no new external infrastructure.
do $$ begin
  alter publication supabase_realtime add table public.restaurants;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.sales;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.expenses;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.employees;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.daily_wages;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.inventory_items;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.inventory_transactions;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.subscription_requests;
exception when duplicate_object then null; end $$;

do $$ begin alter publication supabase_realtime add table public.settings; exception when duplicate_object then null; end $$;

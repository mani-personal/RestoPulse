-- Granular platform-admin access, employee logins, and tenant notifications.
alter table public.platform_admins add column if not exists permissions jsonb not null default '{"restaurants":true,"approvals":true,"pricing":true,"settings":true,"support":true,"admins":false}'::jsonb;
alter table public.memberships add column if not exists permissions jsonb not null default '{}'::jsonb;
alter table public.employees add column if not exists user_id uuid unique references auth.users(id) on delete set null;

create table if not exists public.app_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  notification_key text not null,
  title text not null,
  detail text not null default '',
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique(user_id, restaurant_id, notification_key)
);

alter table public.app_notifications enable row level security;
revoke all on public.app_notifications from anon, authenticated;
grant select, update on public.app_notifications to authenticated;
create policy notification_read on public.app_notifications for select to authenticated using(user_id=(select auth.uid()));
create policy notification_mark_read on public.app_notifications for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

create or replace function public.has_restaurant_permission(p_restaurant_id uuid, p_permission text)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(
    select 1 from public.memberships m
    where m.restaurant_id=p_restaurant_id and m.user_id=(select auth.uid())
      and (
        m.role='OWNER'
        or coalesce((m.permissions ->> p_permission)::boolean, false)
      )
  )
$$;
revoke all on function public.has_restaurant_permission(uuid,text) from public, anon;
grant execute on function public.has_restaurant_permission(uuid,text) to authenticated;

-- Replace tenant policies with permission-aware policies for direct browser access.
drop policy if exists supplier_read on public.suppliers;
drop policy if exists supplier_insert on public.suppliers;
drop policy if exists supplier_update on public.suppliers;
drop policy if exists supplier_delete on public.suppliers;
create policy supplier_read on public.suppliers for select to authenticated using(public.has_restaurant_permission(restaurant_id,'suppliers'));
create policy supplier_insert on public.suppliers for insert to authenticated with check(public.has_restaurant_permission(restaurant_id,'suppliers'));
create policy supplier_update on public.suppliers for update to authenticated using(public.has_restaurant_permission(restaurant_id,'suppliers')) with check(public.has_restaurant_permission(restaurant_id,'suppliers'));
create policy supplier_delete on public.suppliers for delete to authenticated using(public.has_restaurant_permission(restaurant_id,'suppliers'));

drop policy if exists expense_read on public.expenses;
drop policy if exists expense_insert on public.expenses;
drop policy if exists expense_update on public.expenses;
drop policy if exists expense_delete on public.expenses;
create policy expense_read on public.expenses for select to authenticated using(public.has_restaurant_permission(restaurant_id,'expenses'));
create policy expense_insert on public.expenses for insert to authenticated with check(public.has_restaurant_permission(restaurant_id,'expenses'));
create policy expense_update on public.expenses for update to authenticated using(public.has_restaurant_permission(restaurant_id,'expenses')) with check(public.has_restaurant_permission(restaurant_id,'expenses'));
create policy expense_delete on public.expenses for delete to authenticated using(public.has_restaurant_permission(restaurant_id,'expenses'));

drop policy if exists employee_read on public.employees;
drop policy if exists employee_insert on public.employees;
drop policy if exists employee_update on public.employees;
drop policy if exists employee_delete on public.employees;
create policy employee_read on public.employees for select to authenticated using(public.has_restaurant_permission(restaurant_id,'staff'));
create policy employee_insert on public.employees for insert to authenticated with check(public.has_restaurant_permission(restaurant_id,'staff'));
create policy employee_update on public.employees for update to authenticated using(public.has_restaurant_permission(restaurant_id,'staff')) with check(public.has_restaurant_permission(restaurant_id,'staff'));
create policy employee_delete on public.employees for delete to authenticated using(public.has_restaurant_permission(restaurant_id,'staff'));

drop policy if exists wage_read on public.daily_wages;
drop policy if exists wage_insert on public.daily_wages;
drop policy if exists wage_update on public.daily_wages;
drop policy if exists wage_delete on public.daily_wages;
create policy wage_read on public.daily_wages for select to authenticated using(public.has_restaurant_permission(restaurant_id,'staff'));
create policy wage_insert on public.daily_wages for insert to authenticated with check(public.has_restaurant_permission(restaurant_id,'staff'));
create policy wage_update on public.daily_wages for update to authenticated using(public.has_restaurant_permission(restaurant_id,'staff')) with check(public.has_restaurant_permission(restaurant_id,'staff'));
create policy wage_delete on public.daily_wages for delete to authenticated using(public.has_restaurant_permission(restaurant_id,'staff'));

drop policy if exists menu_read on public.menu_items;
drop policy if exists menu_insert on public.menu_items;
drop policy if exists menu_update on public.menu_items;
drop policy if exists menu_delete on public.menu_items;
create policy menu_read on public.menu_items for select to authenticated using(public.has_restaurant_permission(restaurant_id,'menu'));
create policy menu_insert on public.menu_items for insert to authenticated with check(public.has_restaurant_permission(restaurant_id,'menu'));
create policy menu_update on public.menu_items for update to authenticated using(public.has_restaurant_permission(restaurant_id,'menu')) with check(public.has_restaurant_permission(restaurant_id,'menu'));
create policy menu_delete on public.menu_items for delete to authenticated using(public.has_restaurant_permission(restaurant_id,'menu'));

drop policy if exists sales_read on public.sales;
drop policy if exists sales_insert on public.sales;
drop policy if exists sales_update on public.sales;
drop policy if exists sales_delete on public.sales;
create policy sales_read on public.sales for select to authenticated using(public.has_restaurant_permission(restaurant_id,'pos'));
create policy sales_insert on public.sales for insert to authenticated with check(public.has_restaurant_permission(restaurant_id,'pos'));
create policy sales_update on public.sales for update to authenticated using(public.has_restaurant_permission(restaurant_id,'pos')) with check(public.has_restaurant_permission(restaurant_id,'pos'));
create policy sales_delete on public.sales for delete to authenticated using(public.has_restaurant_permission(restaurant_id,'pos'));

-- Seed permissions for existing non-owner memberships according to their role.
update public.memberships set permissions = case role
  when 'MANAGER' then '{"overview":true,"pos":true,"menu":true,"inventory":true,"staff":true,"expenses":true,"suppliers":true}'::jsonb
  when 'CASHIER' then '{"overview":true,"pos":true}'::jsonb
  when 'KITCHEN' then '{"overview":true,"inventory":true}'::jsonb
  else coalesce(permissions,'{}'::jsonb) end
where role <> 'OWNER';

-- Ensure existing admins retain all existing capabilities, except the new admin-management capability.
update public.platform_admins set permissions = jsonb_set(coalesce(permissions,'{}'::jsonb),' {admins}', 'true'::jsonb, true);

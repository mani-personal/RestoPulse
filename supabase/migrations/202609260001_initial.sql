-- RestoPulse: run in a NEW Supabase project using SQL Editor.
create extension if not exists pgcrypto;
create table public.platform_admins(user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
create table public.restaurants(
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name)) between 2 and 120),
 owner_name text not null, owner_email text not null unique, owner_phone text not null,
 city text not null default '', logo_url text, address text not null default '',business_phone text not null default '',gstin text not null default '',receipt_footer text not null default 'Thank you for dining with us!', plan text not null default 'Free Trial',
 status text not null default 'Trial' check(status in ('Trial','Active','Paused')),
 renewal_on date, created_at timestamptz not null default now()
);
create table public.memberships(
 user_id uuid not null references auth.users(id) on delete cascade,
 restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 role text not null check(role in ('OWNER','MANAGER','CASHIER','KITCHEN')),
 primary key(user_id,restaurant_id)
);
create or replace function public.is_platform_admin() returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.platform_admins where user_id=(select auth.uid())) $$;
create or replace function public.is_restaurant_member(p_restaurant_id uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.memberships where restaurant_id=p_restaurant_id and user_id=(select auth.uid())) $$;
create or replace function public.can_manage_restaurant(p_restaurant_id uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.memberships where restaurant_id=p_restaurant_id and user_id=(select auth.uid()) and role in ('OWNER','MANAGER')) $$;
revoke all on function public.is_platform_admin() from public,anon;
revoke all on function public.is_restaurant_member(uuid) from public,anon;
revoke all on function public.can_manage_restaurant(uuid) from public,anon;
grant execute on function public.is_platform_admin(),public.is_restaurant_member(uuid),public.can_manage_restaurant(uuid) to authenticated;
create table public.suppliers(
 id uuid primary key default gen_random_uuid(),restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 name text not null check(length(trim(name))>0), contact_name text not null default '',phone text not null default '',email text not null default '',
 created_at timestamptz not null default now(), unique(restaurant_id,id)
);
create table public.expenses(
 id uuid primary key default gen_random_uuid(),restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 supplier_id uuid, name text not null,category text not null,vendor text not null default '',
 amount numeric(12,2) not null check(amount>0), incurred_on date not null default current_date,
 receipt_url text, created_at timestamptz not null default now(),
 foreign key(restaurant_id,supplier_id) references public.suppliers(restaurant_id,id), unique(restaurant_id,id)
);
create table public.supplier_payments(
 id uuid primary key default gen_random_uuid(),restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 supplier_id uuid not null, amount numeric(12,2) not null check(amount>0),
 paid_on date not null default current_date,method text not null default 'Bank transfer',note text not null default '',
 created_at timestamptz not null default now(),
 foreign key(restaurant_id,supplier_id) references public.suppliers(restaurant_id,id)
);
create table public.employees(
 id uuid primary key default gen_random_uuid(),restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 name text not null,role text not null,shift text not null default '',daily_rate numeric(12,2) not null default 0 check(daily_rate>=0),
 email text not null default '',phone text not null default '',active boolean not null default true,
 created_at timestamptz not null default now(),unique(restaurant_id,id)
);
create table public.daily_wages(
 id uuid primary key default gen_random_uuid(),restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 employee_id uuid not null,wage_date date not null,amount numeric(12,2) not null check(amount>0),
 status text not null default 'Unpaid' check(status in ('Paid','Unpaid')),note text not null default '',
 created_at timestamptz not null default now(), unique(employee_id,wage_date),
 foreign key(restaurant_id,employee_id) references public.employees(restaurant_id,id)
);
create table public.menu_items(
 id uuid primary key default gen_random_uuid(),restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 name text not null,category text not null default 'Mains',price numeric(12,2) not null check(price>=0),cost numeric(12,2) not null default 0 check(cost>=0),
 available boolean not null default true,emoji text not null default '🍽️',diet text not null default '',prep_minutes integer not null default 15,
 image_url text,created_at timestamptz not null default now()
);
create table public.sales(
 id uuid primary key default gen_random_uuid(),restaurant_id uuid not null references public.restaurants(id) on delete cascade,
 bill_no text not null,placed_at timestamptz not null default now(),order_type text not null,
 amount numeric(12,2) not null check(amount>=0),status text not null default 'Paid' check(status in ('Paid','Refunded','Voided')),
 receipt jsonb not null,unique(restaurant_id,bill_no)
);
create index on public.suppliers(restaurant_id,name);
create index on public.expenses(restaurant_id,supplier_id,incurred_on desc);
create index on public.supplier_payments(restaurant_id,supplier_id,paid_on desc);
create index on public.daily_wages(restaurant_id,employee_id,wage_date desc);
create index on public.sales(restaurant_id,placed_at desc);
-- RLS on all exposed tables; no anonymous application grants.
alter table public.platform_admins enable row level security;
alter table public.restaurants enable row level security;
alter table public.memberships enable row level security;
alter table public.suppliers enable row level security;
alter table public.expenses enable row level security;
alter table public.supplier_payments enable row level security;
alter table public.employees enable row level security;
alter table public.daily_wages enable row level security;
alter table public.menu_items enable row level security;
alter table public.sales enable row level security;
revoke all on public.platform_admins,public.restaurants,public.memberships,public.suppliers,public.expenses,public.supplier_payments,public.employees,public.daily_wages,public.menu_items,public.sales from anon,authenticated;
grant select on public.platform_admins,public.restaurants,public.memberships to authenticated;
grant select,insert,update,delete on public.suppliers,public.employees,public.daily_wages,public.menu_items,public.sales to authenticated;
grant select,insert on public.expenses,public.supplier_payments to authenticated;
create policy admin_self on public.platform_admins for select to authenticated using(user_id=(select auth.uid()));
create policy restaurant_read on public.restaurants for select to authenticated using(public.is_platform_admin() or public.is_restaurant_member(id));
create policy membership_read on public.memberships for select to authenticated using(user_id=(select auth.uid()) or public.is_platform_admin());
-- All tenant records are scoped by the restaurant_id from a trusted membership.
create policy supplier_read on public.suppliers for select to authenticated using(public.is_restaurant_member(restaurant_id));
create policy supplier_insert on public.suppliers for insert to authenticated with check(public.can_manage_restaurant(restaurant_id));
create policy supplier_update on public.suppliers for update to authenticated using(public.can_manage_restaurant(restaurant_id)) with check(public.can_manage_restaurant(restaurant_id));
create policy supplier_delete on public.suppliers for delete to authenticated using(public.can_manage_restaurant(restaurant_id));
create policy expense_read on public.expenses for select to authenticated using(public.is_restaurant_member(restaurant_id));
create policy expense_insert on public.expenses for insert to authenticated with check(public.can_manage_restaurant(restaurant_id));
create policy expense_update on public.expenses for update to authenticated using(public.can_manage_restaurant(restaurant_id)) with check(public.can_manage_restaurant(restaurant_id));
create policy expense_delete on public.expenses for delete to authenticated using(public.can_manage_restaurant(restaurant_id));
create policy payment_read on public.supplier_payments for select to authenticated using(public.is_restaurant_member(restaurant_id));
create policy payment_insert on public.supplier_payments for insert to authenticated with check(public.can_manage_restaurant(restaurant_id));
create policy payment_update on public.supplier_payments for update to authenticated using(public.can_manage_restaurant(restaurant_id)) with check(public.can_manage_restaurant(restaurant_id));
create policy payment_delete on public.supplier_payments for delete to authenticated using(public.can_manage_restaurant(restaurant_id));
create policy employee_read on public.employees for select to authenticated using(public.is_restaurant_member(restaurant_id));
create policy employee_insert on public.employees for insert to authenticated with check(public.can_manage_restaurant(restaurant_id));
create policy employee_update on public.employees for update to authenticated using(public.can_manage_restaurant(restaurant_id)) with check(public.can_manage_restaurant(restaurant_id));
create policy employee_delete on public.employees for delete to authenticated using(public.can_manage_restaurant(restaurant_id));
create policy wage_read on public.daily_wages for select to authenticated using(public.is_restaurant_member(restaurant_id));
create policy wage_insert on public.daily_wages for insert to authenticated with check(public.can_manage_restaurant(restaurant_id));
create policy wage_update on public.daily_wages for update to authenticated using(public.can_manage_restaurant(restaurant_id)) with check(public.can_manage_restaurant(restaurant_id));
create policy wage_delete on public.daily_wages for delete to authenticated using(public.can_manage_restaurant(restaurant_id));
create policy menu_read on public.menu_items for select to authenticated using(public.is_restaurant_member(restaurant_id));
create policy menu_insert on public.menu_items for insert to authenticated with check(public.can_manage_restaurant(restaurant_id));
create policy menu_update on public.menu_items for update to authenticated using(public.can_manage_restaurant(restaurant_id)) with check(public.can_manage_restaurant(restaurant_id));
create policy menu_delete on public.menu_items for delete to authenticated using(public.can_manage_restaurant(restaurant_id));
create policy sales_read on public.sales for select to authenticated using(public.is_restaurant_member(restaurant_id));
create policy sales_insert on public.sales for insert to authenticated with check(public.is_restaurant_member(restaurant_id));
create policy sales_update on public.sales for update to authenticated using(public.can_manage_restaurant(restaurant_id)) with check(public.can_manage_restaurant(restaurant_id));
-- Logos and dish images are publicly readable; writes are owner/manager scoped by path prefix.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('restaurant-media','restaurant-media',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy media_public_read on storage.objects for select to public using(bucket_id='restaurant-media');
create policy media_tenant_insert on storage.objects for insert to authenticated with check(bucket_id='restaurant-media' and public.can_manage_restaurant((storage.foldername(name))[1]::uuid));
create policy media_tenant_update on storage.objects for update to authenticated using(bucket_id='restaurant-media' and public.can_manage_restaurant((storage.foldername(name))[1]::uuid)) with check(bucket_id='restaurant-media' and public.can_manage_restaurant((storage.foldername(name))[1]::uuid));
create policy media_tenant_delete on storage.objects for delete to authenticated using(bucket_id='restaurant-media' and public.can_manage_restaurant((storage.foldername(name))[1]::uuid));
-- Restaurant managers may change their display name and logo only.
grant update(name,logo_url,address,business_phone,gstin,receipt_footer) on public.restaurants to authenticated;
create policy restaurant_brand_update on public.restaurants for update to authenticated using(public.can_manage_restaurant(id)) with check(public.can_manage_restaurant(id));
-- Prevent duplicate or excessive supplier payments even when an API client bypasses UI checks.
create or replace function public.check_supplier_payment_balance() returns trigger language plpgsql set search_path='' as $$
declare billed numeric; paid numeric;
begin
 perform pg_advisory_xact_lock(hashtextextended(new.supplier_id::text,0));
 select coalesce(sum(amount),0) into billed from public.expenses where restaurant_id=new.restaurant_id and supplier_id=new.supplier_id;
 select coalesce(sum(amount),0) into paid from public.supplier_payments where restaurant_id=new.restaurant_id and supplier_id=new.supplier_id and id<>new.id;
 if paid+new.amount>billed then raise exception 'Supplier payment exceeds balance due'; end if;
 return new;
end $$;
create trigger supplier_payment_balance before insert or update on public.supplier_payments for each row execute function public.check_supplier_payment_balance();

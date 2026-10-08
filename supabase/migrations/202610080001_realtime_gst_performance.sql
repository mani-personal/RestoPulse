-- RestoPulse: persistent restaurant GST settings + complete realtime coverage.
-- Backward-compatible; existing rows receive the current 5/2.5/2.5 defaults.
alter table public.restaurants add column if not exists gst_percent numeric(5,2) not null default 5;
alter table public.restaurants add column if not exists cgst_percent numeric(5,2) not null default 2.5;
alter table public.restaurants add column if not exists sgst_percent numeric(5,2) not null default 2.5;
alter table public.restaurants add column if not exists receipt_footer text not null default 'Thank you for dining with us!';
alter table public.restaurants add column if not exists logo_url text;

-- The original schema grants column-level restaurant updates; grant the new GST fields too.
grant update(gst_percent,cgst_percent,sgst_percent,receipt_footer,logo_url) on public.restaurants to authenticated;

alter table public.restaurants drop constraint if exists restaurants_gst_percent_check;
alter table public.restaurants add constraint restaurants_gst_percent_check check (gst_percent >= 0 and gst_percent <= 100);
alter table public.restaurants drop constraint if exists restaurants_cgst_percent_check;
alter table public.restaurants add constraint restaurants_cgst_percent_check check (cgst_percent >= 0 and cgst_percent <= 100);
alter table public.restaurants drop constraint if exists restaurants_sgst_percent_check;
alter table public.restaurants add constraint restaurants_sgst_percent_check check (sgst_percent >= 0 and sgst_percent <= 100);

-- Realtime subscriptions used by the UI. Duplicate additions are harmless.
do $$ begin alter publication supabase_realtime add table public.restaurants; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.menu_items; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.suppliers; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.supplier_payments; exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.memberships; exception when duplicate_object then null; end $$;

create index if not exists restaurants_status_renewal_idx on public.restaurants(status, renewal_on);

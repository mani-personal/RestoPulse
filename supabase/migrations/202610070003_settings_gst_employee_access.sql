-- Persistent restaurant settings, GST values, receipt synchronization, and granular employee access.
alter table public.restaurants add column if not exists gst_percent numeric(6,2) not null default 5;
alter table public.restaurants add column if not exists cgst_percent numeric(6,2) not null default 2.5;
alter table public.restaurants add column if not exists sgst_percent numeric(6,2) not null default 2.5;

-- Keep GST totals sensible and prevent invalid values.
alter table public.restaurants drop constraint if exists restaurants_gst_percent_check;
alter table public.restaurants add constraint restaurants_gst_percent_check check(gst_percent >= 0 and gst_percent <= 100 and cgst_percent >= 0 and cgst_percent <= 100 and sgst_percent >= 0 and sgst_percent <= 100);

-- Realtime restaurant changes keep the Restaurant Console synchronized after an Admin extends a subscription or changes restaurant details.
do $$ begin alter publication supabase_realtime add table public.restaurants; exception when duplicate_object then null; end $$;

-- Realtime membership changes keep employee access/navigation synchronized.
do $$ begin alter publication supabase_realtime add table public.memberships; exception when duplicate_object then null; end $$;

-- Backfill missing GST values consistently.
update public.restaurants set gst_percent=5 where gst_percent is null;
update public.restaurants set cgst_percent=gst_percent/2 where cgst_percent is null;
update public.restaurants set sgst_percent=gst_percent/2 where sgst_percent is null;

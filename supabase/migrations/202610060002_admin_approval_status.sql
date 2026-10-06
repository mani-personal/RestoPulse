-- Allow the restaurant lifecycle states used by the Admin approval queue.
-- Existing Trial/Active/Paused data is preserved.
alter table public.restaurants drop constraint if exists restaurants_status_check;
alter table public.restaurants
  add constraint restaurants_status_check
  check (status in ('Trial','Active','Paused','Pending','Rejected'));

create index if not exists restaurants_status_created_idx
  on public.restaurants(status, created_at desc);

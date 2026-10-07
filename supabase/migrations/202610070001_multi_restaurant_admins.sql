-- RestoPulse: allow one authenticated owner to manage multiple restaurants.
-- The original owner_email UNIQUE constraint prevented a single login/email
-- from owning more than one restaurant. Authentication identity remains in
-- auth.users and memberships links that identity to each restaurant.
alter table public.restaurants drop constraint if exists restaurants_owner_email_key;
create index if not exists restaurants_owner_email_idx on public.restaurants(lower(owner_email));

-- Keep the existing platform_admins model; no new admin table is necessary.
-- Realtime membership changes are useful for multi-restaurant access changes.
do $$ begin
  alter publication supabase_realtime add table public.memberships;
exception when duplicate_object then null; end $$;

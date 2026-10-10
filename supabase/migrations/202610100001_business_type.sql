-- Add a business type to each RestoPulse tenant. Existing accounts remain restaurants.
alter table public.restaurants
  add column if not exists business_type text not null default 'restaurant';

alter table public.restaurants
  drop constraint if exists restaurants_business_type_check;

alter table public.restaurants
  add constraint restaurants_business_type_check
  check (business_type in ('restaurant', 'fruit_shop', 'vegetable_shop', 'grocery_store', 'retail'));

create index if not exists restaurants_business_type_idx
  on public.restaurants (business_type);

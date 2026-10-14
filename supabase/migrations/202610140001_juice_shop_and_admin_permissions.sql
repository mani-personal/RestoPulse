-- Add Juice Shop as an inventory/POS business type and persist admin Overview access.
alter table public.restaurants drop constraint if exists restaurants_business_type_check;
alter table public.restaurants add constraint restaurants_business_type_check
  check (business_type in ('restaurant', 'fruit_shop', 'juice_shop', 'vegetable_shop', 'grocery_store', 'retail'));

alter table public.platform_admins add column if not exists permissions jsonb not null
  default '{"overview":true,"restaurants":true,"approvals":true,"pricing":true,"settings":true,"support":true,"admins":false}'::jsonb;
update public.platform_admins set permissions = jsonb_build_object(
  'overview', coalesce((permissions->>'overview')::boolean, true),
  'restaurants', coalesce((permissions->>'restaurants')::boolean, true),
  'approvals', coalesce((permissions->>'approvals')::boolean, true),
  'pricing', coalesce((permissions->>'pricing')::boolean, true),
  'settings', coalesce((permissions->>'settings')::boolean, true),
  'support', coalesce((permissions->>'support')::boolean, true),
  'admins', coalesce((permissions->>'admins')::boolean, false)
);

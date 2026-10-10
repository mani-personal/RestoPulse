-- Produce-shop support: selling prices, wastage movements, and atomic POS stock deduction.
alter table public.inventory_items add column if not exists selling_price numeric(12,2) not null default 0 check (selling_price >= 0);

create or replace function public.complete_retail_sale(
  p_restaurant_id uuid,
  p_bill_no text,
  p_placed_at timestamptz,
  p_order_type text,
  p_amount numeric,
  p_status text,
  p_receipt jsonb,
  p_lines jsonb
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  line jsonb;
  item_id uuid;
  qty numeric(12,3);
  old_qty numeric(12,3);
  new_qty numeric(12,3);
  sale_row public.sales%rowtype;
begin
  if not public.is_restaurant_member(p_restaurant_id) then
    raise exception 'Restaurant membership required';
  end if;
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'At least one inventory item is required';
  end if;
  -- Lock rows in a stable order to prevent concurrent checkouts overselling stock.
  for line in select value from jsonb_array_elements(p_lines) order by (value->>'inventory_item_id')
  loop
    item_id := (line->>'inventory_item_id')::uuid;
    qty := (line->>'quantity')::numeric;
    if qty <= 0 or qty > 1000000 then raise exception 'Invalid quantity'; end if;
    select on_hand into old_qty from public.inventory_items
      where id = item_id and restaurant_id = p_restaurant_id and active = true for update;
    if not found then raise exception 'Inventory item not found'; end if;
    if old_qty < qty then raise exception 'Insufficient stock for item %', item_id; end if;
    new_qty := old_qty - qty;
    update public.inventory_items set on_hand = new_qty where id = item_id and restaurant_id = p_restaurant_id;
    insert into public.inventory_transactions(restaurant_id, inventory_item_id, previous_quantity, change_quantity, new_quantity, transaction_type, reference_id, note)
      values (p_restaurant_id, item_id, old_qty, -qty, new_qty, 'POS sale', p_bill_no, 'Stock deducted by completed POS sale');
  end loop;
  insert into public.sales(restaurant_id, bill_no, placed_at, order_type, amount, status, receipt)
    values(p_restaurant_id, p_bill_no, coalesce(p_placed_at, now()), p_order_type, greatest(0,p_amount), p_status, p_receipt)
    returning * into sale_row;
  return to_jsonb(sale_row);
end;
$$;
revoke all on function public.complete_retail_sale(uuid,text,timestamptz,text,numeric,text,jsonb,jsonb) from public, anon;
grant execute on function public.complete_retail_sale(uuid,text,timestamptz,text,numeric,text,jsonb,jsonb) to authenticated;

-- Optional sample data. Replace the email before running. Run once per new restaurant.
do $$
declare tid uuid; fresh uuid;
begin
 select id into tid from public.restaurants where owner_email='REPLACE_OWNER_EMAIL@example.com';
 if tid is null then raise exception 'Restaurant not found for sample owner email'; end if;
 if exists(select 1 from public.menu_items where restaurant_id=tid) then raise exception 'Menu already has items; sample data was not inserted'; end if;
 insert into public.menu_items(restaurant_id,name,category,price,cost,emoji,diet,prep_minutes) values
 (tid,'Truffle Mushroom Risotto','Mains',680,240,'🍄','Vegetarian',22),
 (tid,'Grilled Salmon Bowl','Mains',790,330,'🥗','Gluten-free',18),
 (tid,'Burrata & Heirloom Tomato','Appetizers',520,210,'🍅','Vegetarian',12),
 (tid,'Citrus Mint Cooler','Drinks',240,65,'🍹','Vegan',5);
 insert into public.suppliers(restaurant_id,name,contact_name,phone) values(tid,'Green Acres Co.','Meera','+91 98765 43001') returning id into fresh;
 insert into public.expenses(restaurant_id,supplier_id,name,category,vendor,amount,incurred_on) values
 (tid,fresh,'Fresh produce delivery','Inventory','Green Acres Co.',4850,current_date-1),
 (tid,fresh,'Weekly vegetable delivery','Inventory','Green Acres Co.',3200,current_date-4);
 insert into public.supplier_payments(restaurant_id,supplier_id,amount,paid_on,method,note) values(tid,fresh,4850,current_date-1,'UPI','Payment for fresh produce');
 insert into public.employees(restaurant_id,name,role,shift,daily_rate,email,phone) values
 (tid,'Ananya Rao','Store Manager','09:00 – 18:00',1800,'ananya@example.com','+91 98765 43002'),
 (tid,'Rohan Mehta','Cashier','10:00 – 19:00',900,'rohan@example.com','+91 98765 43003');
end $$;

# Fruit & Vegetable Shop Workflow (RestoPulse)

## Enable a shop
1. In Platform Admin > Restaurants, create/edit the business and choose **Fruit shop** or **Vegetable shop**.
2. In Supabase SQL Editor, run `supabase/migrations/202610100002_produce_shop_workflow.sql` after the existing business-type migration has been applied.
3. Deploy the updated app and API files.

## Configure inventory
1. Open Inventory and choose Add Produce.
2. Add the product name (e.g. Apple), quantity, unit (`kg`, `g`, `piece`, `box`, `crate`), reorder threshold, cost per unit and selling price per unit.
3. Use **Add stock / purchase** when new produce arrives. Add a note for supplier / purchase reference.
4. Use **Record wastage** for spoiled/damaged produce; it deducts stock and creates a dated inventory movement.
5. Review Inventory History to reconcile opening stock, purchases, POS sales, wastage and manual adjustments.

## POS
1. Fruit/vegetable shops see inventory products with stock and selling price in POS; restaurants continue to see menu dishes.
2. Tap a product and set the quantity/weight in the order (decimals supported, e.g. 0.75 kg).
3. Charge the sale. The server-side `complete_retail_sale` database function deducts stock and records the sale/stock movement in one database transaction. If stock is insufficient, the sale is rejected and stock is not partially deducted.
4. Inventory balance and history refresh after the completed sale.

## Responsive layout
POS catalog and order panel stack on tablet/mobile, product tiles use two columns on small screens, dialogs are width-limited to the viewport, and inventory tables remain horizontally scrollable. Test at 375px mobile width and common 768px/1024px tablet widths before production.

## Notes
- Existing restaurant POS still uses `menu_items`; the produce inventory POS is conditional on the selected business type.
- The migration adds `inventory_items.selling_price` and the atomic checkout function. No existing restaurant table data is deleted.
- Run `npm run build` and test a restaurant checkout plus fruit-shop checkout, insufficient-stock rejection, purchase addition and wastage deduction in a staging Supabase project before production.

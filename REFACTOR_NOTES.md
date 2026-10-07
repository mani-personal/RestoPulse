# RestoPulse Refactor Notes

This refactor preserves the existing application UI structure and existing database tables. A single additive Supabase migration is included because the source application already referenced persistent `settings` and `subscription_requests` data that was absent from the supplied schema, and persistent inventory/history cannot be implemented reliably with browser localStorage.

## Main changes
- Restaurant data is loaded by authenticated restaurant membership.
- POS sales are persisted to `sales`; Sale History reads persisted sales and reuses the existing receipt UI.
- Inventory is persistent and restaurant-scoped with stock adjustments and transaction history.
- Expenses, suppliers, supplier payments, employees, and daily wages use the existing Supabase tables instead of local-only state.
- Restaurant dashboard metrics are calculated from persisted data.
- Subscription page shows current plan/status/renewal/history and uses the existing plan/payment flow.
- Admin dashboard reports subscription revenue rather than restaurant product sales.
- Admin restaurant directory supports create, edit, and safe deactivate.
- Admin pricing/settings/subscription/approval APIs require an authenticated platform-admin session for mutations.
- Restaurant APIs require an authenticated membership and scope access to the requested restaurant.
- Supabase Realtime replaces the previous 4-second polling loop for operational, restaurant, subscription, and admin changes.
- Storage paths are tenant-prefixed so existing storage RLS can enforce restaurant ownership.
- No existing table or column is renamed or deleted.

## Additive migration
`supabase/migrations/202610040001_functional_refactor.sql`
adds:
- `settings`
- `subscription_requests`
- `inventory_items`
- `inventory_transactions`

It also adds RLS, indexes, inventory transaction tracking, and Realtime publication entries. Existing tables remain unchanged.

## Validation
- All TypeScript/TSX files were transpile-checked successfully with TypeScript.
- Full `npm run typecheck` could not be completed in this environment because the uploaded project dependencies were not fully installable before the environment timeout. The source package itself is unchanged in dependency declarations.

## Follow-up Restaurant Console Improvements – October 2026

- Added weekly employee wage payment workflow using the existing `daily_wages` table. A selected employee's unpaid wage entries within a chosen week can be marked Paid together as a weekly payment; no schema change is required.
- Added live device-date synchronization on the Restaurant Overview. The dashboard clock/date state refreshes every minute, and overview date-based metrics recalculate from the synchronized date.
- Restricted Restaurant Console notifications to restaurant-scoped operational notifications (inventory, unpaid wages, subscription renewal). Admin approval/subscription notifications remain available only to Admin users.
- Added realtime listeners for `suppliers` and `supplier_payments` so supplier history refreshes when transactions change.
- Supplier selection now displays transaction history combining supplier-linked expenses/purchases and supplier payments, with purchase total, payment total, and balance.

## POS image and receipt print fixes
- POS dish images now use `object-fit: contain` so the complete uploaded dish photo is visible instead of being cropped.
- POS dish photo area was widened/taller for better image presentation.
- Receipt format selector now supports 58mm, 85mm, and A4.
- Receipt print CSS adapts width, padding, font sizing, and item columns to the selected format.
- Receipt content wraps long item names/values to prevent clipping on narrow thermal paper.
- No database schema changes are required.


## 2026-10-06 POS and inventory fixes

- Inventory **+ Add Stock** now opens the same custom quantity/reason workflow as **- Reduce Stock**.
- Add stock accepts decimal quantities and records the exact movement in inventory history.
- POS dish images use a contained 4:3 presentation so the complete uploaded image remains visible without cropping.
- Receipt printing was consolidated to one format-aware print layout for 58mm, 85mm, and A4. Conflicting global print rules were removed; the receipt uses the selected paper width, safe content width, wrapping, and static print positioning.
- No database migration is required for these changes.

## 2026-10-06 Overview & mobile fixes
- Fixed Overview date-range filtering for Today, Yesterday, This week, and This month.
- Added a Custom date range with From/To date inputs for restaurant sales and expense reporting.
- Overview KPIs and revenue/expense chart now use the selected date range for restaurant accounts.
- Fixed mobile top-bar profile/avatar visibility; profile, notifications, and theme controls remain inside the viewport and the profile popover is constrained to the mobile screen width.

## 2026-10-06 Team/Payroll and table UI enhancements
- Added explicit Monthly / Weekly / Daily employee compensation types.
- Added persistent weekly salary and monthly salary fields for employees.
- Weekly-salary employees can be paid directly for a selected week from the employee payroll sheet.
- Enhanced Inventory History with a structured, scrollable table showing date/time, item, transaction, change, and stock movement.
- Enhanced Expenses table with date, category badges, vendor, and right-aligned amounts.
- Enhanced Supplier transaction history with payment/purchase badges and improved table spacing.
- Added light/dark-safe designation badges for Manager, Accountant, Storekeeper, and Staff.
- Added migration `202610060001_weekly_payroll_and_ui.sql` for employee compensation fields.

## 2026-10-06 subscription, receipt, and mobile update
- Added POS receipt-format selector directly beside Charge for 58mm, 85mm, and A4; the selected format is reused by receipt preview and browser printing.
- Added Google Pay, PhonePe, and generic UPI launch actions for subscription payments, with generic UPI fallback.
- Added restaurant subscription/trial expiry banner and an operation lock overlay; expired restaurants can still open Subscription to renew.
- Added mobile responsive hardening for tables, dialogs, forms, receipt controls, POS cards, subscription notices, and narrow screens.

## Admin Console Fixes – 2026-10-06
- Fixed the Add/Edit Restaurant dialog so the generic Record Payment dialog cannot open at the same time.
- Fixed subscription renewal rejection/approval to persist status without depending on optional `reviewed_at`/`reviewed_by` columns.
- Fixed approval of legacy subscription requests with a null `restaurant_id` by resolving the restaurant from owner email/name before UUID lookup.
- Pending subscription queues now remove only successfully transitioned requests.

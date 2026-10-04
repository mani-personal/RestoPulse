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

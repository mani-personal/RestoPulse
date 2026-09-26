# RestoPulse — Supabase + Vercel

A Next.js 16 restaurant POS and supplier ledger. The Vercel project is separate from the earlier ChatGPT Sites preview. The preview does **not** automatically share data with this project.

## What is connected to Supabase

- Email/password sign-in with Supabase Auth.
- Platform-admin restaurant creation through a server-only Next.js route. This creates the owner in Supabase Auth and assigns an `OWNER` membership.
- Tenant-scoped menu, image uploads, store identity/logo, employees, daily wages, expenses, suppliers, supplier payments, and sales/receipt snapshots.
- Row-level security (RLS) on every application table, plus restaurant-scoped Storage upload rules.
- Supplier ledger: purchases are expenses linked to a supplier; payments are separate records. **Due = purchases − payments.** Purchase costs appear once in expenses and are not counted again on payment.

The subscription plans, approval board, chart trend, and some tenant setting controls remain UI examples. Connect a billing provider and verified approval workflow before charging customers. Currency and tax are currently INR / 5% GST in the POS; configure those for your business before production. The source has no demo fallback once Supabase is configured.

## 1. Create the Supabase project

1. Create a new project in [Supabase](https://supabase.com/dashboard). Keep its database password private.
2. Open **SQL Editor → New query** and execute `supabase/migrations/202609260001_initial.sql` in a new, empty project. The script creates tables, policies, and the `restaurant-media` Storage bucket. Do not run it over an existing schema with similarly named tables.
3. Open **Authentication → Users → Add user**. Create the first platform administrator with a strong password and a confirmed email.
4. In SQL Editor, grant that user's ID platform access (replace the email):

```sql
insert into public.platform_admins(user_id)
select id from auth.users where email='YOUR_ADMIN_EMAIL@example.com';
```

5. In **Project Settings → API Keys**, copy the project URL, publishable key, and server-only secret key. The secret key bypasses RLS; never commit it, put it in a browser variable, or share it with a restaurant user.
6. In **Authentication → URL Configuration**, set Site URL to your final Vercel domain. Add its URL to Redirect URLs if you later enable email confirmation/password recovery flows.

## 2. Run locally

Use Node.js 22 or newer.

```bash
npm install
cp .env.example .env.local
```

Fill `.env.local` with your Supabase values:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL, `https://…supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` |
| `SUPABASE_SECRET_KEY` | `sb_secret_…`, server only |

Then run:

```bash
npm run dev
```

Open `http://localhost:3000`, sign in with the platform-admin account, choose **Restaurants → Add restaurant**, and enter the restaurant name, owner name, email, phone, password, city, and plan. The owner can then sign in with their email/password and manage their own restaurant. A platform admin without a restaurant membership sees the platform console, not a tenant's private records.

Optional: edit the placeholder email in `supabase/optional_sample_data.sql`, then run it once in SQL Editor to add sample menu items, staff, and supplier transactions to that restaurant.

## 3. Put the code on GitHub

From the folder containing this README:

```bash
git init
git add .
git commit -m "Build RestoPulse Supabase backend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/restopulse.git
git push -u origin main
```

Create the empty GitHub repository first. `.env.local` and `node_modules` are ignored; check `git status` before pushing.

## 4. Deploy on Vercel

1. Go to [Vercel → New Project](https://vercel.com/new), connect GitHub, and import the RestoPulse repository.
2. Keep **Framework Preset: Next.js** and **Root Directory: repository root**.
3. Add all three variables from `.env.local` in **Project Settings → Environment Variables** for Production and Preview. Keep `SUPABASE_SECRET_KEY` server-side, with no `NEXT_PUBLIC_` prefix.
4. Deploy. Open the resulting URL and sign in as the platform admin. Create a restaurant and sign in as its owner in a separate browser session.
5. If you change variables later, redeploy the project. Update the Supabase Auth Site URL to your production domain.

The Vercel deployment is not performed by this package. You need your own Supabase project, API keys, and connected Vercel/GitHub accounts.

## Smoke check

- Admin: create a restaurant owner, then verify the new restaurant appears in the directory.
- Owner: add a supplier; log an expense linked to it; record a partial payment. The ledger should show the charge, payment, and remaining due.
- Owner: add an employee; record a dated wage and mark it paid. Refresh: it should still be there.
- Owner: upload a restaurant logo and dish image, then refresh. Both should still appear.
- POS: complete a sale; open it from Recent sales; print at 58 mm, 85 mm, and A4 after selecting matching paper in the browser's print dialog.
- Tenant isolation: sign in with a second restaurant account and verify the first restaurant's supplier, staff, sales, and media uploads are inaccessible.

## Operational limits

An actual Supabase project and credentials were not available while this package was built, so live database operations and RLS could not be exercised here. The build and TypeScript check pass. For production, add a payment provider, audited refunds, tax jurisdiction rules, financial reconciliation, onboarding verification, back-office role management, and backup/restore practice.

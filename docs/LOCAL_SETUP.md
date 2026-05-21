# Local Setup

## 1. Start Odoo

Start Odoo 18 with the custom addons path:

```powershell
C:\Users\mame computer\Documents\influencer-link-et\apps\odoo_addons
```

Use local environment values like:

```env
ODOO_URL=http://localhost:8069
ODOO_DB=influencer_link_db
```

Do not put real production credentials in local docs or committed files.

## 2. Confirm Database

Confirm Odoo is using:

```env
ODOO_DB=influencer_link_db
```

The Next.js app calls Odoo over JSON-RPC and expects the configured database to contain the `ethio_influencer_pro` module.

## 3. Upgrade Odoo Module

After changing Python models, XML views, access CSVs, or data files:

1. Restart Odoo if Python files changed.
2. Open Odoo Apps.
3. Upgrade `ethio_influencer_pro`.
4. Refresh the frontend.

If frontend field errors appear, upgrade the module before changing frontend code.

## 4. Configure Next.js Environment

Create `apps/web/.env.local` from `apps/web/.env.example`.

Expected keys:

```env
ODOO_URL=http://localhost:8069
ODOO_DB=influencer_link_db
ODOO_USERNAME=admin
ODOO_PASSWORD=change_me
SESSION_SECRET=change_me_to_a_long_random_secret
AUTH_SESSION_SECRET=change_me_to_a_long_random_secret
```

Current session signing reads `AUTH_SESSION_SECRET`, then `NEXTAUTH_SECRET`, then falls back to `ODOO_PASSWORD` in local code. Prefer setting `AUTH_SESSION_SECRET` explicitly.

## 5. Start Next.js

From the repo root:

```powershell
npm install
npm run dev
npm run lint
npm run build
```

Or from the web app:

```powershell
cd apps/web
npm install
npm run dev
npm run lint
npm run build
```

The root scripts delegate to `apps/web`.

## 6. Useful Checks

- Visit the Odoo URL and confirm the database is reachable.
- Confirm `ethio_influencer_pro` is installed and upgraded.
- Confirm industries exist in Odoo.
- Sign up or log in as a business owner and verify `/dashboard`.
- Sign up or log in as an influencer and verify `/influencer/dashboard`.
- Log in as an Odoo system administrator and verify `/api/me` returns `role: "admin"`, then open `/admin/verifications`.
- Run `npm.cmd run lint` and `npm.cmd run build` from the repo root before handoff.

## Admin Login Notes

Admin access is derived from Odoo group membership, not a frontend switch or hardcoded email. A user must belong to Odoo external group `base.group_system` to receive `role: "admin"` in the app session. Ordinary portal users and non-system internal users should continue to resolve to `business_owner` or `influencer`.

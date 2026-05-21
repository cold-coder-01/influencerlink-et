# InfluencerLink ET QA Report

Date: May 20, 2026

## Environment

- Odoo URL: http://localhost:8069
- Odoo database: influencer_link_db
- Odoo module: ethio_influencer_pro
- Next.js URL: http://localhost:3000
- LAN URL: http://192.168.0.188:3000
- Local IP confirmed from Wi-Fi 2: 192.168.0.188
- Platform: Windows / PowerShell

## Test Accounts / Roles Used

- Admin: configured Odoo service/admin login from `apps/web/.env.local`; password not recorded.
- Business owner: unauthenticated redirect checks and code-level permission review only; no password recorded or available during this pass.
- Influencer: unauthenticated redirect checks and code-level permission review only; no password recorded or available during this pass.

## Auth

Status: PARTIAL PASS

- Unauthenticated protected routes redirect to `/login`: `/dashboard`, `/influencer/dashboard`, `/admin/verifications`, `/campaigns`, `/contracts`, `/payments`, `/notifications`.
- Real Odoo admin login succeeds through `/api/auth/login`.
- `/api/me` returns `role: admin`, `partnerId`, `uid`, and null influencer profile fields for the admin account.
- `/` redirects admin to `/admin/verifications`.
- `/admin/verifications` loads for admin.
- Business owner and influencer role redirects could not be fully browser-tested without dedicated credentials. Server layout and API guard code were reviewed.

## Business Owner

Status: PARTIAL PASS

- Admin-authenticated smoke test returned 200 for: `/dashboard`, `/industries`, `/industries/1`, `/influencers`, `/influencers/1`, `/campaigns`, `/campaigns/new`, `/campaigns/1`, `/messages`, `/contracts`, `/contracts/new?campaignId=1`, `/contracts/1`, `/payments`, `/payments/new?contractId=1`, `/payments/1`, `/analytics`, `/notifications`, `/settings`.
- Business list APIs use partner ownership domains and return empty data when `partnerId` is missing.
- Dedicated business-owner data isolation needs a real business-owner credential set.

## Influencer

Status: PARTIAL PASS

- Admin-authenticated smoke test returned 200 for: `/influencer/dashboard`, `/influencer/profile`, `/influencer/social-accounts`, `/influencer/campaigns`, `/influencer/messages`, `/influencer/contracts`, `/influencer/earnings`, `/influencer/notifications`, `/influencer/settings`.
- Influencer list APIs use `profileId` / `influencerProfileId` domains and return empty data when profile identity is missing.
- Dedicated influencer assignment checks need a real influencer credential set.

## Admin

Status: PASS

- `/admin` redirects to the admin verification dashboard.
- `/admin/verifications` and `/admin/verifications/1` load.
- Verification filters load: `status=pending`, `status=needs_review`, `platform=youtube`, and `q=test`.
- `/api/social-accounts` filter variants return 200.
- Social account client sanitization hides `platformAccountId`, notes, and token-like fields.
- Verify/reject/needs_review mutation endpoints were reviewed but not executed against existing production-like records to avoid altering live QA data.

## Campaigns

Status: PARTIAL PASS

- Campaign list/detail/create pages and APIs smoke-tested with admin session.
- `PATCH /api/campaigns/[id]/status` enforces `canViewCampaign` and lifecycle validation.
- Business owner/influencer mutation flows need safe test campaign records and role-specific credentials for end-to-end status transitions.

## Messages

Status: PARTIAL PASS

- `/messages`, `/influencer/messages`, `/api/messages`, and `/api/campaigns/1/messages` load.
- Message list domains are scoped by business partner, influencer profile, or admin.
- Missing partner/profile identity returns empty data rather than all messages.
- Send/reply notification behavior was reviewed in code but not mutated against live data.

## Contracts

Status: PARTIAL PASS

- Contract list/detail/create pages and APIs smoke-tested with admin session.
- Contract create/sign APIs check campaign ownership, role, and signature state.
- Influencer cannot create contracts by API guard.
- Signature mutations need dedicated role credentials and safe test records.

## Payments

Status: PARTIAL PASS

- Payment list/detail/create pages and APIs smoke-tested with admin session.
- Payment list domains are scoped by business partner, campaign owner, influencer profile, or admin.
- Missing partner/profile identity returns empty data rather than all payments.
- Payment create/status APIs check contract ownership and admin-only release rules.
- Deposit/release mutations were not executed against existing records.

## Social Accounts

Status: PARTIAL PASS

- Social account list/detail APIs smoke-tested with admin session.
- Influencer creation/update code blocks client-controlled verified status and verification fields.
- Business-owner social account view only exposes verified/pending sanitized records for a requested influencer.
- Token fields were not found in client components.
- Add/edit/delete flows need role-specific credentials and safe test records.

## YouTube Sync

Status: PARTIAL PASS

- `YOUTUBE_API_KEY` is present in `.env.local`.
- `POST /api/social-accounts/[id]/sync/youtube` restricts access to admin or the owning influencer account.
- Business owners are blocked by the route.
- Sync writes public metrics and sets `verificationMethod: api_sync` and `verificationStatus: needs_review`.
- Live sync was not executed because it would mutate existing social-account records.

## Telegram Sync

Status: PARTIAL PASS

- `TELEGRAM_BOT_TOKEN` is present in `.env.local`.
- Telegram handle normalization supports `@channelname`, `channelname`, `https://t.me/channelname`, and `t.me/channelname`.
- `POST /api/social-accounts/[id]/sync/telegram` restricts access to admin or the owning influencer account.
- Business owners are blocked by the route.
- Live sync was not executed because it would mutate existing social-account records.

## Notifications

Status: PARTIAL PASS

- `/notifications`, `/influencer/notifications`, `/api/notifications`, and notification read endpoints are present and smoke-tested where non-mutating.
- Notification list domains are scoped by recipient partner or recipient influencer profile.
- Mark-one-read and mark-all-read endpoints were reviewed but not executed against existing records.

## Mobile / PWA

Status: PARTIAL PASS

- `/login`, `/signup`, `/signup/business`, and `/signup/influencer` return 200.
- `http://localhost:3000/manifest.json` returns 200.
- `http://192.168.0.188:3000/login` returns 200.
- Full visual overflow testing at 390px and 430px was not performed in this shell-only QA pass.

## Capacitor

Status: PASS

- `apps/web/capacitor.config.ts` exists.
- Android project exists under `apps/web/android`.
- `docs/MOBILE_APP_PLAN.md` documents Android Studio limitations, PWA alternative, local IP usage, and production HTTPS notes.
- `npm.cmd run cap:sync` passes.

## Odoo Module

Status: PASS

- `python .\scripts\check_odoo_module.py` passes.
- Static checks cover imports, manifest entries, access CSV, XML parse, Python compile, and notification model/view/access coverage.
- Important warning: a duplicate stale module in `C:\custom_addons` can cause old code loading if `addons_path` order is wrong. The workspace addon path should come before `C:\custom_addons`.

## Bugs Found And Fixes Applied

### Capacitor Android URL Used `localhost`

- Issue: `apps/web/capacitor.config.ts` pointed `server.url` to `http://localhost:3000`.
- Root cause: Android devices/emulators treat `localhost` as the Android runtime, not the Windows development PC.
- Fix: changed `server.url` to `http://192.168.0.188:3000` and kept cleartext local development enabled.
- Files changed: `apps/web/capacitor.config.ts`.
- Verification: `npm.cmd run cap:sync` passes; LAN `/login` returns 200.

### Odoo Static Checker Did Not Require Notification Artifacts

- Issue: `scripts/check_odoo_module.py` did not explicitly require `notification.py`, `notification_views.xml`, or `model_influencer_notification`.
- Root cause: notifications were added after the original checker list.
- Fix: added notification model, view, and access model to the expected static checker lists.
- Files changed: `scripts/check_odoo_module.py`.
- Verification: `python .\scripts\check_odoo_module.py` passes.

## Known Remaining Issues / TODOs

- Dedicated business-owner and influencer fixture credentials are now documented in `docs/QA_FIXTURES.md`.
- Existing verification, payment, contract, message, and sync records were not mutated during this pass to avoid changing live QA data without explicit fixture records.
- Instagram/TikTok integrations are not implemented yet.
- Real payment gateway integration is not implemented yet.
- Android Studio APK build was not performed.
- Production hosting and HTTPS configuration are not configured in this local QA pass.
- Full mobile viewport screenshot testing was not performed from the shell.

## Next QA Step

Create or refresh local QA records with:

```powershell
python .\scripts\create_qa_fixtures.py
```

Then rerun full role-specific mutation QA using the fixture accounts:

- Business owner: `qa.business@example.test`
- Influencer: `qa.influencer@example.test`
- Admin: local Odoo admin account

Use the checklists in `docs/QA_FIXTURES.md` to test business owner, influencer, admin, campaigns, messages, contracts, payments, notifications, social accounts, YouTube sync, and Telegram sync without changing non-QA records.

## Final Area Status

- Auth: PARTIAL PASS
- Business Owner: PARTIAL PASS
- Influencer: PARTIAL PASS
- Admin: PASS
- Campaigns: PARTIAL PASS
- Messages: PARTIAL PASS
- Contracts: PARTIAL PASS
- Payments: PARTIAL PASS
- Social Accounts: PARTIAL PASS
- YouTube Sync: PARTIAL PASS
- Telegram Sync: PARTIAL PASS
- Notifications: PARTIAL PASS
- Mobile/PWA: PARTIAL PASS
- Capacitor: PASS
- Odoo Module: PASS

Overall final status: PARTIAL PASS
